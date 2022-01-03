import { BuildTask } from 'tasks/build';
import { HarvestTask } from 'tasks/harvest';
import { RepairTask } from 'tasks/repair';
import { TaskType } from 'tasks/task';
import { TransportTask } from 'tasks/transport';
import { UpgradeTask } from 'tasks/upgrade';
import log from 'utils/logger';
import { CreepDirector, CreepSize, CreepType } from './creepDirector';
import { BuildIntent } from './intents/build';
import { EnergyIntent } from './intents/energy';
import { Intent, IntentAction } from './intents/intent';
import { RepairIntent } from './intents/repair';
import { TransportToControllerIntent } from './intents/transportToController';
import { TransportToStorageIntent } from './intents/transportToStorage';
import { UpgradeIntent } from './intents/upgrade';

interface ActiveTaskMemory {
  taskKey: string;
  taskType: TaskType;
  targetId?: Id<any>;
  subTargetId?: Id<any>;
}

interface ActiveCreepMemory {
  activeTask?: ActiveTaskMemory | null;
  creepId: Id<Creep>;
  creepType: CreepType;
  creepSize?: CreepSize;
}

export interface RoomDirectorMemory {
  lastUpdate: number;
  lastSpawn: number;
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
        lastSpawn: this.memory.lastSpawn ?? 0,
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
        intents.push(
          new EnergyIntent({ roomDirector: this }),
          new UpgradeIntent({ roomDirector: this }),
          new TransportToStorageIntent({ roomDirector: this }),
          new TransportToControllerIntent({ roomDirector: this }),
          new BuildIntent({ roomDirector: this }),
          new RepairIntent({ roomDirector: this })
        );
        break;
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
      .map((creep): { type: CreepType; id: Id<Creep>; size: CreepSize } => ({
        type: creep.memory.type ?? 'drone',
        id: creep.id,
        size: creep.memory.size ?? 'default',
      }));
    log.debug(`Active creep count: ${activeCreeps.length}`, {
      label: 'Room Director',
    });

    const currentCreeps = _.merge(
      (activeCreeps ?? []).reduce<RoomDirectorMemory['activeCreeps']>(
        (acc, creep) => ({
          ...acc,
          [creep.id]: {
            creepId: creep.id,
            activeTask: null,
            creepType: creep.type,
            creepSize: creep.size,
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
    Object.values(action.creeps).forEach((creepConfig) => {
      const workingThisType = Object.values(this.activeCreeps).filter(
        (memory) =>
          memory.activeTask?.taskKey === action.id &&
          memory.creepSize === (creepConfig.creepSize ?? 'default') &&
          memory.creepType === creepConfig.creepType
      ).length;

      if (workingThisType < creepConfig.creepCount) {
        const difference = creepConfig.creepCount - workingThisType;
        let remaining = difference;
        [...Array(difference).keys()].forEach(() => {
          const unassignedCreep = Object.values(this.activeCreeps).find(
            (activeCreepMemory) =>
              !activeCreepMemory.activeTask &&
              activeCreepMemory.creepType === creepConfig.creepType &&
              activeCreepMemory.creepSize ===
                (creepConfig.creepSize ?? 'default')
          )?.creepId;

          if (unassignedCreep) {
            this.activeCreeps[unassignedCreep].creepType =
              creepConfig.creepType;
            this.activeCreeps[unassignedCreep].creepSize =
              creepConfig.creepSize;
            this.activeCreeps[unassignedCreep].activeTask = {
              taskKey: action.id,
              taskType: action.taskType,
              targetId: action.targetId,
              subTargetId: action.subTargetId,
            };
            log.debug('Assigned creep', {
              assigned: this.activeCreeps[unassignedCreep],
            });
            remaining -= 1;
          }
        });

        if (remaining) {
          const spawn = Game.getObjectById(this.spawns[0]);
          if (
            spawn &&
            !spawn.spawning &&
            (this.memory.lastSpawn ?? 0) + 21 < Game.time
          ) {
            this.creepDirector.spawnCreep(
              spawn,
              creepConfig.creepType,
              creepConfig.creepSize
            );
            this.memory.lastSpawn = Game.time;
          }
        }
      }
    });
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

    Object.values(this.activeCreeps).forEach((activeCreep) => {
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
        case TaskType.Transport: {
          const task = new TransportTask(
            creep,
            activeCreep.activeTask.targetId,
            activeCreep.activeTask.subTargetId,
            activeCreep.activeTask.taskKey.startsWith('transportToController')
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
    _.forEach(this.memory.activeCreeps, (creepMemory) => {
      if (
        creepMemory.activeTask &&
        !this.memory.activeIntentActions.find(
          (action) => creepMemory.activeTask?.taskKey === action.id
        ) &&
        this.memory.activeCreeps[creepMemory.creepId]
      ) {
        log.debug('Clearing dead task for creep', {
          id: creepMemory.creepId,
          task: creepMemory.activeTask?.taskKey,
        });
        this.memory.activeCreeps[creepMemory.creepId].activeTask = null;
      }
    });
  }
}
