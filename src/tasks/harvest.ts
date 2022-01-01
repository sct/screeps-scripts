import { Task, TaskType } from './task';

export class HarvestTask extends Task<Source> {
  public taskType = TaskType.Harvest;

  public constructor(creep: Creep, targetId?: Id<Source>) {
    super(creep, targetId);
  }

  public transferToStorage(): void {
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
    if (
      closestSpawn &&
      this.creep.transfer(closestSpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(closestSpawn);
    } else if (
      closestStorage &&
      this.creep.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(closestStorage);
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

    if (this.creep.memory.working) {
      this.transferToStorage();
    } else {
      const targetSource = this.targetId
        ? Game.getObjectById(this.targetId)
        : this.getClosestSource();

      if (targetSource) {
        this.moveAndHarvest(targetSource);
      }
    }
  }
}
