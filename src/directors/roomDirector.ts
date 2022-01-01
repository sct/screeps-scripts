import { HarvestTask } from 'tasks/harvest';
import { TaskType } from 'tasks/task';
import log from 'utils/logger';

interface ActiveCreepMemory {
  activeTask?: TaskType | null;
  targetId?: Id<Structure>;
}

interface RoomDirectorMemory {
  lastUpdate: number;
  activeCreeps: Record<Id<Creep>, ActiveCreepMemory>;
  availableSpawnEnergy: number;
  availableStoredEnergy: number;
  spawnCapacity: number;
}

export class RoomDirector {
  private static ENERGY_HARVEST_THRESHOLD = 0.5;
  private static ENERGY_EMERGENCY_THRESHOLD = 0.25;

  protected room: Room;

  public constructor(room: Room) {
    this.room = room;
    this.initialize();
  }

  private get memory(): RoomDirectorMemory {
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
      };
    }
  }

  private updateCreepList(creepIds: Id<Creep>[]) {
    const currentCreeps = Object.assign(
      {},
      creepIds.reduce<RoomDirectorMemory['activeCreeps']>(
        (acc, creepId) => ({
          ...acc,
          [creepId]: {
            activeTask: null,
          },
        }),
        {}
      ),
      this.memory.activeCreeps ?? {},
    );

    (Object.keys(currentCreeps) as Id<Creep>[]).forEach((id) => {
      if (!creepIds.includes(id)) {
        delete currentCreeps[id];
      }
    });

    return currentCreeps;
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

  public run(): void {
    (
      Object.entries(this.memory.activeCreeps) as [
        Id<Creep>,
        ActiveCreepMemory
      ][]
    ).forEach(([creepId, creepMemory]) => {
      const creep = Game.getObjectById(creepId);
      if (!creep) {
        return;
      }

      if (creepMemory.activeTask) {
        switch (creepMemory.activeTask) {
          case TaskType.Harvest: {
            const task = new HarvestTask(creep);
            task.run();
            break;
          }
          default:
          // do nothing
        }
      } else {
        this.memory.activeCreeps[creepId].activeTask = TaskType.Harvest;
      }
    });
  }
}
