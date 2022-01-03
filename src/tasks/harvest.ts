import { RoomDirectorMemory } from 'directors/roomDirector';
import { Task, TaskType } from './task';

export class HarvestTask extends Task<Source> {
  public taskType = TaskType.Harvest;

  public constructor(creep: Creep, targetId?: Id<Source>) {
    super(creep, targetId);
  }

  public transferToStorage(preferStorage = false): void {
    const closestSpawn = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) =>
        (structure.structureType === STRUCTURE_EXTENSION ||
          structure.structureType === STRUCTURE_SPAWN) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });

    const closestStorage = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) =>
        (structure.structureType === STRUCTURE_CONTAINER ||
          structure.structureType === STRUCTURE_STORAGE ||
          structure.structureType === STRUCTURE_TOWER) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });

    const tryFirst = preferStorage ? closestStorage : closestSpawn;
    const trySecond = preferStorage ? closestSpawn : closestStorage;
    if (
      tryFirst &&
      this.creep.transfer(tryFirst, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(tryFirst);
    } else if (
      trySecond &&
      this.creep.transfer(trySecond, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(trySecond);
    }
  }

  public run(): void {
    if (this.creep.memory.working && this.currentStoredEnergy() === 0) {
      this.creep.memory.working = false;
      this.creep.say('🔄 harvest');
    }

    if (
      !this.creep.memory.working &&
      this.creep.store.getFreeCapacity() === 0
    ) {
      this.creep.memory.working = true;
      this.creep.say('📦 storing energy');
    }

    const targetSource = this.targetId
      ? Game.getObjectById(this.targetId)
      : this.getClosestSource();

    if (this.creep.memory.working) {
      const containersInRange = targetSource?.pos.findInRange(
        FIND_STRUCTURES,
        3,
        {
          filter: (structure) =>
            structure.structureType === STRUCTURE_CONTAINER &&
            structure.store.getFreeCapacity() > 0,
        }
      );

      const transportersAvailable = Object.values(
        (this.creep.room.memory as RoomDirectorMemory).activeCreeps
      ).some(
        (creep) =>
          creep.activeTask?.taskType === TaskType.Transport &&
          creep.activeTask?.taskKey.startsWith('transportToStorage')
      );
      const preferStorage =
        (this.creep.room.controller?.level ?? 0) >= 4 &&
        !!containersInRange?.[0] &&
        transportersAvailable;

      this.transferToStorage(preferStorage);
    } else {
      if (targetSource) {
        this.moveAndHarvest(targetSource);
      }
    }
  }
}
