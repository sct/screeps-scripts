import { Role } from 'creeps/creepWrapper';
import { HarvestTask } from 'tasks/harvest';
import { TaskType } from 'tasks/task';
import log from 'utils/logger';
import { EnergyIntent } from './intents/energy';
import { Intent } from './intents/intent';

interface ActiveTaskMemory {
  taskType: TaskType;
  targetId?: Id<AnyStructure | Source>;
}

interface ActiveCreepMemory {
  activeTask?: ActiveTaskMemory | null;
  creepId: Id<Creep>;
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
}

export class RoomDirector {
  protected room: Room;
  protected intents: Intent[] = [];

  public constructor(room: Room) {
    this.room = room;
    this.initialize();
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

      const activeCreepsIds = Game.rooms[this.room.name]
        .find(FIND_MY_CREEPS)
        .map((creep) => creep.id);
      log.debug(`Active creep count: ${activeCreepsIds.length}`, {
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
        activeCreeps: this.updateCreepList(activeCreepsIds),
        availableSpawnEnergy,
        availableStoredEnergy,
        spawnCapacity,
        spawns: this.room.find(FIND_MY_SPAWNS).map((spawn) => spawn.id),
        availableSources: this.room
          .find(FIND_SOURCES)
          .map((source) => source.id),
        rcl: this.room.controller?.level ?? 0,
      };
    }
  }

  private setIntents(): void {
    const intents: Intent[] = [];

    switch (this.memory.rcl) {
      default:
        intents.push(new EnergyIntent({ roomDirector: this }));
    }

    this.intents = intents;
  }

  private updateCreepList(creepIds: Id<Creep>[]) {
    const currentCreeps = Object.assign(
      {},
      creepIds.reduce<RoomDirectorMemory['activeCreeps']>(
        (acc, creepId) => ({
          ...acc,
          [creepId]: {
            creepId,
            activeTask: null,
          },
        }),
        {}
      ),
      this.memory.activeCreeps ?? {}
    );

    (Object.keys(currentCreeps) as Id<Creep>[]).forEach((id) => {
      if (!creepIds.includes(id)) {
        delete currentCreeps[id];
      }
    });

    return currentCreeps;
  }

  private assignCreeps(
    taskType: TaskType,
    creepsToAssign: number,
    targetId?: Id<AnyStructure | Source>
  ) {
    // First get how many are already doing this task
    const working = Object.values(this.activeCreeps).filter(
      (memory) =>
        memory.activeTask?.taskType === taskType &&
        memory.activeTask?.targetId === targetId
    ).length;

    log.debug('Current working creeps', { working });

    if (working < creepsToAssign) {
      const difference = creepsToAssign - working;
      let left = difference;

      log.debug('Difference', { difference });

      [...Array(difference).keys()].forEach(() => {
        const unassignedCreep = Object.values(this.activeCreeps).find(
          (activeCreepMemory) => !activeCreepMemory.activeTask
        )?.creepId;

        if (unassignedCreep) {
          this.activeCreeps[unassignedCreep].activeTask = {
            taskType,
            targetId,
          };
          left -= 1;
        }

        if (left) {
          const spawn = Game.getObjectById(this.spawns[0]);
          const creepName = `drone-${Game.time}`;

          if (
            spawn &&
            spawn.spawnCreep([WORK, MOVE, CARRY], creepName, {
              memory: {
                role: Role.Harvester,
                room: this.room.name,
                working: false,
              },
            }) === OK
          ) {
            log.info(`Spawning new creep. Name: ${creepName}`, {
              label: 'Creep Spawning',
            });
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
    // Must call first to sync intents we want to use
    this.setIntents();

    this.intents.forEach((intent) => {
      const response = intent.run();
      if (response.shouldAct) {
        response.actions.forEach((action) => {
          this.assignCreeps(
            action.taskType,
            action.assignedCreeps,
            action.targetId
          );
        });
      }
    });

    Object.values(this.activeCreeps)
      .filter((creep) => creep.activeTask)
      .forEach((activeCreep) => {
        const creep = Game.getObjectById(activeCreep.creepId);

        if (!creep) {
          return;
        }

        switch (activeCreep.activeTask?.taskType) {
          case TaskType.Harvest: {
            const task = new HarvestTask(
              creep,
              activeCreep.activeTask.targetId as Id<Source>
            );
            task.run();
          }
        }
      });
  }
}
