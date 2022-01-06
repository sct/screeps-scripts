import { Shachou } from 'shachou';
import { BuildIntent } from './intents/build';
import { EnergyIntent } from './intents/energy';
import { Intent, IntentAction } from './intents/intent';
import { RemoteEnergyIntent } from './intents/remoteEnergy';
import { RepairIntent } from './intents/repair';
import { ScoutIntent } from './intents/scout';
import { TransportToControllerIntent } from './intents/transportToController';
import { TransportToStorageIntent } from './intents/transportToStorage';
import { UpgradeIntent } from './intents/upgrade';

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
  availableSources: Id<Source>[];
  sources: Record<Id<Source>, SourceConfig>;
  rcl: number;
  roomController?: Id<StructureController>;
  activeIntentActions: IntentAction[];
  remoteSources: { id: Id<Source>; distance: number; room: string }[];
}

const RoomMemoryDefaults: RoomDirectorMemory = {
  lastUpdate: 0,
  lastSpawn: 0,
  availableSpawnEnergy: 0,
  availableSources: [],
  sources: {},
  activeIntentActions: [],
  availableStoredEnergy: 0,
  rcl: 0,
  spawnCapacity: 0,
  spawns: [],
  remoteSources: [],
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
  protected intents: Intent[] = [];

  public constructor(room: Room, shachou: Shachou) {
    this.room = room;
    this.shachou = shachou;
    _.defaults(this.memory, RoomMemoryDefaults);
    this.initialize();
    this.setIntents();
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
        availableSources: this.room
          .find(FIND_SOURCES)
          .map((source) => source.id),
        rcl: this.room.controller?.level ?? 0,
        roomController: this.room.controller?.id,
        activeIntentActions: this.memory.activeIntentActions ?? [],
      });
      // if (
      //   Object.values(this.memory.sources).length === 0 &&
      //   this.room.find(FIND_SOURCES).length > 0
      // ) {
      this.evaluateSources();
      // }

      if (this.room.controller?.my) {
        this.evaluateRemoteMining();
      }
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

  /**
   * Checks room memory data (if available) and returns the available extension sources (in order of distance)
   */
  private evaluateRemoteMining(): void {
    const exits = Game.map.describeExits(this.room.name);
    const spawn = Game.getObjectById(this.spawns[0]);
    const remoteSourceIds: RoomDirectorMemory['remoteSources'] = [];

    Object.values(exits).forEach((exit) => {
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

  private setIntents(): void {
    const intents: Intent[] = [];

    switch (this.memory.rcl) {
      case 8:
      case 7:
      case 6:
      case 5:
      case 4:
        intents.push(
          new EnergyIntent({ roomDirector: this }),
          new UpgradeIntent({ roomDirector: this }),
          new TransportToStorageIntent({ roomDirector: this }),
          new TransportToControllerIntent({ roomDirector: this }),
          new BuildIntent({ roomDirector: this }),
          new RepairIntent({ roomDirector: this }),
          new ScoutIntent({ roomDirector: this }),
          new RemoteEnergyIntent({ roomDirector: this })
        );
        break;
      case 3:
        intents.push(
          new EnergyIntent({ roomDirector: this }),
          new UpgradeIntent({ roomDirector: this }),
          new BuildIntent({ roomDirector: this }),
          new RepairIntent({ roomDirector: this }),
          new ScoutIntent({ roomDirector: this }),
          new RemoteEnergyIntent({ roomDirector: this })
        );
        break;
      case 2:
        intents.push(
          new EnergyIntent({ roomDirector: this }),
          new UpgradeIntent({ roomDirector: this }),
          new BuildIntent({ roomDirector: this }),
          new RepairIntent({ roomDirector: this })
        );
        break;
      default:
        intents.push(
          new EnergyIntent({ roomDirector: this }),
          new UpgradeIntent({ roomDirector: this })
        );
    }

    this.intents = intents;
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
    const activeIntentActions: IntentAction[] = [];
    if (
      this.room.controller &&
      this.room.controller.level > 0 &&
      this.room.controller.my
    ) {
      this.intents.forEach((intent) => {
        const response = intent.run();
        if (response.shouldAct) {
          response.actions.forEach((action) => {
            activeIntentActions.push(action);
            this.shachou.creepDirector.assignCreeps(this, action);
          });
        }
      });
      this.memory.activeIntentActions = activeIntentActions;
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
