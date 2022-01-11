/* eslint-disable no-fallthrough */
import { Shachou } from 'shachou';
import { BuildDirective } from './directives/build';
import { Directive, DirectiveAction } from './directives/directive';
import { EnergyDirective } from './directives/energy';
import { MineDirective } from './directives/mine';
import { RemoteEnergyDirective } from './directives/remoteEnergy';
import { RepairDirective } from './directives/repair';
import { ReserveDirective } from './directives/reserve';
import { ScoutDirective } from './directives/scout';
import { TransportToControllerDirective } from './directives/transportToController';
import { TransportToStorageDirective } from './directives/transportToStorage';
import { UpgradeDirective } from './directives/upgrade';
import { RoadPlanner, RoadPlannerMemory } from './layout/roadPlanner';

interface SourceConfig {
  id: Id<Source>;
  x: number;
  y: number;
  openMiningSpaces: number;
}
export interface RoomDirectorMemory {
  lastUpdate: number;
  lastSpawn: number;
  availableSpawnEnergy: number;
  availableStoredEnergy: number;
  spawnCapacity: number;
  spawns: Id<StructureSpawn>[];
  containers: Id<StructureContainer>[];
  availableSources: Id<Source>[];
  sources: Record<Id<Source>, SourceConfig>;
  rcl: number;
  roomController?: Id<StructureController>;
  activeDirectiveActions: DirectiveAction[];
  remoteSources: {
    id: Id<Source>;
    distance: number;
    room: string;
    x: number;
    y: number;
  }[];
  expansionRooms: {
    roomName: string;
  }[];
  roadPlanner: RoadPlannerMemory;
}

const RoomMemoryDefaults: RoomDirectorMemory = {
  lastUpdate: 0,
  lastSpawn: 0,
  availableSpawnEnergy: 0,
  availableSources: [],
  sources: {},
  activeDirectiveActions: [],
  availableStoredEnergy: 0,
  rcl: 0,
  spawnCapacity: 0,
  spawns: [],
  remoteSources: [],
  containers: [],
  expansionRooms: [],
  roadPlanner: {
    roadLocations: {},
    roads: {},
  },
};

export class RoomDirector {
  public static getRoomMemory(
    roomName: string
  ): RoomDirectorMemory | undefined {
    const roomMemory = Memory.rooms[roomName];
    if (!roomMemory) {
      return undefined;
    }
    return roomMemory as RoomDirectorMemory;
  }

  public room: Room;
  public shachou: Shachou;
  private roadPlanner: RoadPlanner;
  protected directives: Directive[] = [];

  public constructor(room: Room, shachou: Shachou) {
    this.room = room;
    this.shachou = shachou;
    this.roadPlanner = new RoadPlanner(this);
    _.defaults(this.memory, RoomMemoryDefaults);
    this.initialize();
    this.setDirectives();
  }

  public get memory(): RoomDirectorMemory {
    return this.room.memory as RoomDirectorMemory;
  }

  private set memory(memory) {
    this.room.memory = memory;
  }

  private initialize() {
    if ((this.memory.lastUpdate ?? -20) + 20 < Game.time) {
      const availableSpawnEnergy = this.room.energyAvailable;
      const spawnCapacity = this.room.energyCapacityAvailable;
      const availableStoredEnergy = this.getAvailableStoredEnergy();

      _.merge<RoomDirectorMemory, Partial<RoomDirectorMemory>>(this.memory, {
        lastUpdate: Game.time,
        lastSpawn: this.memory.lastSpawn ?? 0,
        availableSpawnEnergy,
        availableStoredEnergy,
        spawnCapacity,
        spawns: this.room.find(FIND_MY_SPAWNS).map((spawn) => spawn.id),
        containers: this.room
          .find<FIND_STRUCTURES, StructureContainer>(FIND_STRUCTURES, {
            filter: (structure) =>
              structure.structureType === STRUCTURE_CONTAINER,
          })
          .map((s) => s.id),
        availableSources: this.room
          .find(FIND_SOURCES)
          .map((source) => source.id),
        rcl: this.room.controller?.level ?? 0,
        roomController: this.room.controller?.id,
        activeDirectiveActions: this.memory.activeDirectiveActions ?? [],
      });
      // if (
      //   Object.values(this.memory.sources).length === 0 &&
      //   this.room.find(FIND_SOURCES).length > 0
      // ) {
      this.evaluateSources();
      // }

      if (this.room.controller?.my) {
        this.evaluateRemoteMining();
        this.autoConstruction();
        this.evaluateExpansion();
      }
    }

    if (this.room.controller?.my) {
      this.roadPlanner.run();
    }
  }

  private evaluateSources(): void {
    const sources = this.room.find(FIND_SOURCES);

    this.memory.sources = sources.reduce((acc, source) => {
      const sourcePosition = source.pos;
      let mineableSpots = 0;

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          if (
            this.room
              .getTerrain()
              .get(sourcePosition.x + x, sourcePosition.y + y) !==
            TERRAIN_MASK_WALL
          ) {
            mineableSpots += 1;
          }
        }
      }

      return {
        ...acc,
        [source.id]: {
          id: source.id,
          x: sourcePosition.x,
          y: sourcePosition.y,
          openMiningSpaces: mineableSpots,
        },
      };
    }, {} as Record<Id<Source>, SourceConfig>);
  }

  private evaluateExpansion(): void {
    // Lets keep it simple and only try to expand to closest 3 sources.
    // If later on we expand to a room with a source not in this, we can still trigger
    // remote mining on expansions rooms!
    const remoteSources = this.memory.remoteSources
      // Filter out rooms that dont have controllers
      .filter(
        (rs) => (Memory.rooms[rs.room] as RoomDirectorMemory).roomController
      )
      .slice(0, 3);

    if (remoteSources.length === 0) {
      return;
    }

    this.memory.expansionRooms = _.uniq(remoteSources, 'room').map(
      (source) => ({
        roomName: source.room,
      })
    );
  }

  /**
   * Checks room memory data (if available) and returns the available extension sources (in order of distance)
   */
  private evaluateRemoteMining(): void {
    const spawn = Game.getObjectById(this.spawns[0]);
    const remoteSourceIds: RoomDirectorMemory['remoteSources'] = [];

    const roomPositions = /^([WE])([0-9]+)([NS])([0-9]+)$/.exec(this.room.name);

    if (!roomPositions) {
      return;
    }

    const wrappingRooms: string[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        if (!(x === 0 && y === 0)) {
          const roomName = `${roomPositions[1]}${
            parseInt(roomPositions[2], 10) + x
          }${roomPositions[3]}${parseInt(roomPositions[4], 10) + y}`;
          wrappingRooms.push(roomName);
        }
      }
    }

    Object.values(wrappingRooms).forEach((exit) => {
      const roomMemory = RoomDirector.getRoomMemory(exit);

      if (spawn && roomMemory && roomMemory.availableSources.length > 0) {
        remoteSourceIds.push(
          ...Object.values(roomMemory.sources).map((sourceData) => {
            let distance = -1;
            const route = PathFinder.search(spawn.pos, {
              pos: new RoomPosition(sourceData.x, sourceData.y, exit),
              range: 1,
            });
            if (!route.incomplete) {
              distance = route.cost;
            }
            return {
              id: sourceData.id,
              distance,
              x: sourceData.x,
              y: sourceData.y,
              room: exit,
            };
          })
        );
      }
    });

    this.memory.remoteSources = remoteSourceIds.sort(
      (a, b) => a.distance - b.distance
    );
  }

  private setDirectives(): void {
    const directives: Directive[] = [];

    switch (this.memory.rcl) {
      case 8:
      case 7:
      case 6:
        directives.push(new MineDirective({ roomDirector: this }));
      case 5:
      case 4:
        directives.push(
          new TransportToControllerDirective({ roomDirector: this }),
          new TransportToStorageDirective({ roomDirector: this })
        );
      case 3:
        directives.push(
          new ReserveDirective({ roomDirector: this }),
          new RemoteEnergyDirective({ roomDirector: this }),
          new ScoutDirective({ roomDirector: this })
        );
      case 2:
        directives.push(
          new RepairDirective({ roomDirector: this }),
          new BuildDirective({ roomDirector: this })
        );
      default:
        directives.push(
          new UpgradeDirective({ roomDirector: this }),
          new EnergyDirective({ roomDirector: this })
        );
    }

    this.directives = directives.reverse();
  }

  private autoConstruction() {
    // Build container near extractor
    const extractor = this.room.find<FIND_STRUCTURES, StructureExtractor>(
      FIND_STRUCTURES,
      {
        filter: (structure) => structure.structureType === STRUCTURE_EXTRACTOR,
      }
    )?.[0];

    if (extractor && this.memory.containers.length < 5) {
      const structures = this.room.lookAtArea(
        extractor.pos.y - 1,
        extractor.pos.x - 1,
        extractor.pos.y + 1,
        extractor.pos.x + 1,
        true
      );

      if (
        !structures.some(
          (s) =>
            s.structure instanceof StructureContainer ||
            s.constructionSite?.structureType === STRUCTURE_CONTAINER
        )
      ) {
        let startedConstruction = false;
        extractor.around().forEach(({ x, y }) => {
          if (
            !startedConstruction &&
            this.room.createConstructionSite(x, y, STRUCTURE_CONTAINER) === OK
          ) {
            startedConstruction = true;
          }
        });
      }
    }
  }

  public getAvailableStoredEnergy(): number {
    const storageUnits = this.room.find<
      FIND_STRUCTURES,
      StructureContainer | StructureStorage
    >(FIND_STRUCTURES, {
      filter: (s) =>
        s.structureType === STRUCTURE_CONTAINER ||
        s.structureType === STRUCTURE_STORAGE,
    });

    return storageUnits.reduce((acc, unit) => acc + unit.store.energy, 0);
  }

  public get sources(): Id<Source>[] {
    return this.memory.availableSources;
  }

  public get spawns(): Id<StructureSpawn>[] {
    return this.memory.spawns;
  }

  public run(): void {
    const activeDirectiveActions: DirectiveAction[] = [];
    if (
      this.room.controller &&
      this.room.controller.level > 0 &&
      this.room.controller.my
    ) {
      this.directives.forEach((directive) => {
        const response = directive.run();
        if (response.shouldAct) {
          response.actions.forEach((action) => {
            activeDirectiveActions.push(action);
            this.shachou.creepDirector.assignCreeps(this, action);
          });
        }
      });

      this.memory.activeDirectiveActions = activeDirectiveActions;

      if (this.room.storage) {
        const storageLink = this.room.storage.pos.findInRange<
          FIND_STRUCTURES,
          StructureLink
        >(FIND_STRUCTURES, 2, {
          filter: (structure) => structure.structureType === STRUCTURE_LINK,
        })?.[0];

        const controllerLink = this.room.controller.pos.findInRange<
          FIND_STRUCTURES,
          StructureLink
        >(FIND_STRUCTURES, 4, {
          filter: (structure) => structure.structureType === STRUCTURE_LINK,
        })?.[0];

        if (storageLink && controllerLink) {
          storageLink.transferEnergy(controllerLink);
        }
      }
    }
  }
}
