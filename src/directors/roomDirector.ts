import { Shachou } from 'shachou';
import log from 'utils/logger';
import { BuildIntent } from './intents/build';
import { EnergyIntent } from './intents/energy';
import { Intent, IntentAction } from './intents/intent';
import { RepairIntent } from './intents/repair';
import { ScoutIntent } from './intents/scout';
import { TransportToControllerIntent } from './intents/transportToController';
import { TransportToStorageIntent } from './intents/transportToStorage';
import { UpgradeIntent } from './intents/upgrade';

export interface RoomDirectorMemory {
  lastUpdate: number;
  lastSpawn: number;
  availableSpawnEnergy: number;
  availableStoredEnergy: number;
  spawnCapacity: number;
  spawns: Id<StructureSpawn>[];
  availableSources: Id<Source>[];
  rcl: number;
  roomController?: Id<StructureController>;
  activeIntentActions: IntentAction[];
}

export class RoomDirector {
  public room: Room;
  public shachou: Shachou;
  protected intents: Intent[] = [];

  public constructor(room: Room, shachou: Shachou) {
    this.room = room;
    this.shachou = shachou;
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
      log.debug(`Updating room memory: ${this.room.name} @ ${Game.time}`, {
        label: 'Room Director',
      });

      const availableSpawnEnergy = this.room.energyAvailable;
      log.debug(`Available spawn energy: ${availableSpawnEnergy}`, {
        label: 'Room Director',
      });
      const spawnCapacity = this.room.energyCapacityAvailable;
      log.debug(`Spawn energy capacity: ${spawnCapacity}`, {
        label: 'Room Director',
      });

      const availableStoredEnergy = this.getAvailableStoredEnergy();
      log.debug(`Available stored energy: ${availableStoredEnergy}`, {
        label: 'Room Director',
      });

      this.memory = {
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
      };
    }
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
          new ScoutIntent({ roomDirector: this })
        );
        break;
      case 3:
        intents.push(
          new EnergyIntent({ roomDirector: this }),
          new UpgradeIntent({ roomDirector: this }),
          new BuildIntent({ roomDirector: this }),
          new RepairIntent({ roomDirector: this }),
          new ScoutIntent({ roomDirector: this })
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
    if ((this.room.controller?.level ?? 0) > 0) {
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
    }
  }
}
