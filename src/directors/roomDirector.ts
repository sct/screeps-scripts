import { BuildTask } from 'tasks/build';
import { HarvestTask } from 'tasks/harvest';
import { RepairTask } from 'tasks/repair';
import { TaskType } from 'tasks/task';
import { UpgradeTask } from 'tasks/upgrade';
import log from 'utils/logger';
import { CreepDirector, CreepType } from './creepDirector';
import { BuildIntent } from './intents/build';
import { EnergyIntent } from './intents/energy';
import { Intent, IntentAction } from './intents/intent';
import { RepairIntent } from './intents/repair';
import { UpgradeIntent } from './intents/upgrade';

interface ActiveTaskMemory {
  taskKey: string;
  taskType: TaskType;
  targetId?: Id<AnyStructure | Source | ConstructionSite>;
}

interface ActiveCreepMemory {
  activeTask?: ActiveTaskMemory | null;
  creepId: Id<Creep>;
  creepType: CreepType;
}

interface RoomDirectorMemory {
  lastUpdate: number;
  activeCreeps: Record<Id<Creep>, ActiveCreepMemory>;
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
  protected creepDirector: CreepDirector;
  protected intents: Intent[] = [];

  public constructor(room: Room) {
    this.room = room;
    this.initialize();
    this.setIntents();
    this.creepDirector = new CreepDirector(this);
  }

  public get memory(): RoomDirectorMemory {
    return this.room.memory as RoomDirectorMemory;
  }

  private set memory(memory) {
    this.room.memory = memory;
  }

  private initialize() {
    if ((this.memory.lastUpdate ?? 0) + 20 < Game.time) {
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
        activeCreeps: this.updateCreepList(),
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
      case 3:
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

  private updateCreepList() {
    const activeCreeps = Game.rooms[this.room.name]
      .find(FIND_MY_CREEPS)
      .map((creep): { type: CreepType; id: Id<Creep> } => ({
        type: creep.memory.type ?? 'drone',
        id: creep.id,
      }));
    log.debug(`Active creep count: ${activeCreeps.length}`, {
      label: 'Room Director',
    });

    const currentCreeps = Object.assign(
      {},
      (activeCreeps ?? []).reduce<RoomDirectorMemory['activeCreeps']>(
        (acc, creep) => ({
          ...acc,
          [creep.id]: {
            creepId: creep.id,
            activeTask: null,
            creepType: creep.type,
          },
        }),
        {}
      ),
      this.memory.activeCreeps ?? {}
    );

    (Object.keys(currentCreeps) as Id<Creep>[]).forEach((id) => {
      if (!activeCreeps.find((creep) => creep.id === id)) {
        delete currentCreeps[id];
      }
    });

    return currentCreeps;
  }

  private assignCreeps(action: IntentAction) {
    // First get how many are already doing this task
    const working = Object.values(this.activeCreeps).filter(
      (memory) => memory.activeTask?.taskKey === action.id
    ).length;

    if (working < action.assignedCreeps) {
      const difference = action.assignedCreeps - working;
      let left = difference;

      [...Array(difference).keys()].forEach(() => {
        const unassignedCreep = Object.values(this.activeCreeps).find(
          (activeCreepMemory) =>
            !activeCreepMemory.activeTask &&
            activeCreepMemory.creepType === action.creepType
        )?.creepId;

        if (unassignedCreep) {
          this.activeCreeps[unassignedCreep].activeTask = {
            taskKey: action.id,
            taskType: action.taskType,
            targetId: action.targetId,
          };
          left -= 1;
        }

        if (left) {
          const spawn = Game.getObjectById(this.spawns[0]);
          if (spawn && !spawn.spawning) {
            this.creepDirector.spawnCreep(spawn, action.creepType);
          }
        }
      });
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

  public get activeCreeps(): Record<Id<Creep>, ActiveCreepMemory> {
    return this.memory.activeCreeps;
  }

  public get sources(): Id<Source>[] {
    return this.memory.availableSources;
  }

  public get spawns(): Id<StructureSpawn>[] {
    return this.memory.spawns;
  }

  public run(): void {
    const activeIntentActions: IntentAction[] = [];
    this.intents.forEach((intent) => {
      const response = intent.run();
      if (response.shouldAct) {
        response.actions.forEach((action) => {
          activeIntentActions.push(action);
          this.assignCreeps(action);
        });
      }
    });
    this.memory.activeIntentActions = activeIntentActions;

    Object.values(this.activeCreeps)
      .forEach((activeCreep) => {
        const creep = Game.getObjectById(activeCreep.creepId);

        if (!creep) {
          return;
        }

        switch (activeCreep.activeTask?.taskType) {
          case TaskType.Upgrade: {
            const task = new UpgradeTask(creep);
            task.run();
            break;
          }
          case TaskType.Build: {
            const task = new BuildTask(
              creep,
              activeCreep.activeTask.targetId as Id<ConstructionSite>
            );
            task.run();
            break;
          }
          case TaskType.Repair: {
            const task = new RepairTask(
              creep,
              activeCreep.activeTask.targetId as Id<AnyStructure>
            );
            task.run();
            break;
          }
          case TaskType.Harvest:
          default: {
            const task = new HarvestTask(
              creep,
              activeCreep.activeTask?.targetId as Id<Source>
            );
            task.run();
            break;
          }
        }
      });

    // Clean up any creeps that no longer have an active intent
    _.forEach(this.activeCreeps, (creepMemory) => {
      if (
        !this.memory.activeIntentActions.some(
          (action) => creepMemory.activeTask?.taskKey === action.id
        ) &&
        this.memory.activeCreeps[creepMemory.creepId]
      ) {
        this.memory.activeCreeps[creepMemory.creepId].activeTask = null;
      }
    });
  }
}
