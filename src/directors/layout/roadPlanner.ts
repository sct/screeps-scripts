import { RoomDirector } from 'directors/roomDirector';
import log from 'utils/logger';

export interface RoadPlannerMemory {
  roadLocations: { [roomName: string]: { [roadCoorName: string]: boolean } };
  roads: {
    [destination: string]: {
      roadCount: number;
      length: number;
    };
  };
}

const memoryDefaults: RoadPlannerMemory = {
  roadLocations: {},
  roads: {},
};

const PLAIN_COST = 3;
const SWAMP_COST = 4;
const WALL_COST = 15 * PLAIN_COST;
const EXISTING_PATH_COST = PLAIN_COST - 1;

export class RoadPlanner {
  public static canBuild(
    structureType: BuildableStructureConstant,
    pos: RoomPosition
  ): boolean {
    if (!pos.room()) {
      return false;
    }
    const buildings = _.filter(
      pos.lookFor(LOOK_STRUCTURES),
      (s) => s && s.structureType == structureType
    );
    const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
    if (!buildings || buildings.length == 0) {
      if (!sites || sites.length == 0) {
        return true;
      }
    }
    return false;
  }

  protected roomDirector: RoomDirector;
  protected destinations: RoomPosition[] = [];
  protected costMatrices: { [roomName: string]: CostMatrix } = {};
  protected roadPositions: RoomPosition[] = [];

  public constructor(roomDirector: RoomDirector) {
    this.roomDirector = roomDirector;
    this.memory = _.defaults(
      this.roomDirector.memory.roadPlanner,
      memoryDefaults
    );
    this.setDestinations();
  }

  private setDestinations() {
    if (!this.roomDirector.memory.sources) {
      return;
    }
    const localSources = Object.values(this.roomDirector.memory.sources).map(
      (s) => new RoomPosition(s.x, s.y, this.roomDirector.room.name)
    );
    this.destinations.push(...localSources);

    // Local controller
    if (this.roomDirector.room.controller) {
      this.destinations.push(this.roomDirector.room.controller.pos);
    }

    const remoteSources = this.roomDirector.memory.remoteSources
      .map((rs) => new RoomPosition(rs.x, rs.y, rs.room))
      .slice(0, 4);
    this.destinations.push(...remoteSources);

    // Remote controllers
    this.roomDirector.memory.expansionRooms.forEach((r) => {
      const room = Game.rooms[r.roomName];
      if (room && room.controller) {
        this.destinations.push(room.controller.pos);
      }
    });
  }

  public get memory(): RoadPlannerMemory {
    return this.roomDirector.memory.roadPlanner;
  }

  private set memory(memory) {
    this.roomDirector.memory.roadPlanner = memory;
  }

  private generateRoadPlannerCostMatrix(roomName: string) {
    const matrix = new PathFinder.CostMatrix();
    const terrain = Game.map.getRoomTerrain(roomName);

    for (let y = 0; y < 50; ++y) {
      for (let x = 0; x < 50; ++x) {
        switch (terrain.get(x, y)) {
          case TERRAIN_MASK_SWAMP:
            matrix.set(x, y, SWAMP_COST);
            break;
          case TERRAIN_MASK_WALL:
            matrix.set(x, y, WALL_COST);
            break;
          default:
            matrix.set(x, y, PLAIN_COST);
        }
      }
    }

    const room = Game.rooms[roomName];
    if (room) {
      const impassableStrctures: Structure[] = [];
      room.find(FIND_STRUCTURES).forEach((s: Structure) => {
        if (!s.isWalkable()) {
          impassableStrctures.push(s);
        }
      });

      impassableStrctures.forEach((is) => matrix.set(is.pos.x, is.pos.y, 0xff));

      room.find(FIND_MY_CONSTRUCTION_SITES).forEach((cs) => {
        if (!cs.isWalkable()) {
          matrix.set(cs.pos.x, cs.pos.y, 0xff);
        }
      });
    }

    return matrix;
  }

  private generateRoadPath(
    origin: RoomPosition,
    destination: RoomPosition
  ): RoomPosition[] | undefined {
    const callback = (roomName: string): CostMatrix | boolean => {
      if (
        !this.roomDirector.memory.expansionRooms.find(
          (r) => r.roomName === roomName
        ) &&
        roomName !== this.roomDirector.room.name
      ) {
        return false;
      }
      if (!this.costMatrices[roomName]) {
        this.costMatrices[roomName] =
          this.generateRoadPlannerCostMatrix(roomName);
      }

      return this.costMatrices[roomName];
    };

    const pathData = PathFinder.search(
      origin,
      { pos: destination, range: 1 },
      { roomCallback: callback, maxOps: 40000 }
    );

    if (pathData.incomplete) {
      log.warning('Pathfinder failed to find a path in road planner', {
        label: 'Road Planner',
        pathData,
        destination,
      });
      return;
    }

    for (const i of _.range(pathData.path.length)) {
      const pos = pathData.path[i];
      if (i % 2 === 0 && this.costMatrices[pos.roomName] && !pos.isEdge()) {
        this.costMatrices[pos.roomName].set(pos.x, pos.y, EXISTING_PATH_COST);
      }
    }

    return pathData.path;
  }

  private planRoad(pos1: RoomPosition, pos2: RoomPosition): void {
    const roadPath = this.generateRoadPath(pos1, pos2);
    if (roadPath) {
      this.roadPositions = this.roadPositions.concat(roadPath);
    }
  }

  private buildRoadNetwork(storagePos: RoomPosition): void {
    this.costMatrices = {};
    this.roadPositions = [];

    for (const destination of this.destinations) {
      this.planRoad(storagePos, destination);
    }
    this.formatRoadPositions();
  }

  private formatRoadPositions(): void {
    this.roadPositions = _.unique(this.roadPositions);
    _.remove(this.roadPositions, (rp) => rp.isEdge());
  }

  private finalize(): void {
    this.memory.roadLocations = {};

    for (const pos of this.roadPositions) {
      if (!this.memory.roadLocations[pos.roomName]) {
        this.memory.roadLocations[pos.roomName] = {};
      }

      this.memory.roadLocations[pos.roomName][pos.coordName()] = true;
    }
  }

  private buildMissing(): void {
    let roadPositions: RoomPosition[] = [];

    for (const roomName in this.memory.roadLocations) {
      for (const coords of Object.keys(this.memory.roadLocations[roomName])) {
        const [x, y] = coords.split(':');
        roadPositions.push(
          new RoomPosition(parseInt(x, 10), parseInt(y, 10), roomName)
        );
      }
    }
    const origin = this.roomDirector.room.storage;
    if (!origin) {
      return;
    }
    roadPositions = _.sortBy(roadPositions, (pos) =>
      pos.getMultiRoomRangeTo(origin.pos)
    );
    for (const pos of roadPositions) {
      if (RoadPlanner.canBuild(STRUCTURE_ROAD, pos)) {
        const response = pos.createConstructionSite(STRUCTURE_ROAD);
        if (response !== OK) {
          log.debug('Failed to create road', {
            pos,
            response,
            label: 'Road Planner',
          });
        }
      }
    }
  }

  private recalculateRoadNetwork(storagePos: RoomPosition): void {
    this.buildRoadNetwork(storagePos);
    this.finalize();
  }

  public run(): void {
    const storage = this.roomDirector.room.storage;
    if (storage) {
      if (Game.time % 3000 === 0) {
        log.debug('Recalculating road network', { label: 'Road Planner' });
        this.recalculateRoadNetwork(storage.pos);

        if (this.roomDirector.memory.rcl >= 4) {
          this.buildMissing();
        }
      }
    }
  }
}
