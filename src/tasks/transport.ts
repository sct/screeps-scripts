import { Task, TaskType } from './task';

type StorableStructures =
  | StructureContainer
  | StructureStorage
  | StructureTerminal
  | StructureLink;

export class TransportTask extends Task<
  StorableStructures,
  StorableStructures
> {
  public taskType = TaskType.Transport;

  public run(): void {
    if (this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.creep.memory.working = false;
      this.creep.say('🔄 pick up');
    }
    if (
      !this.creep.memory.working &&
      this.creep.store.getFreeCapacity() === 0
    ) {
      this.creep.memory.working = true;
      this.creep.say('🚧 transport');
    }

    if (this.creep.memory.working && this.subTargetId) {
      const closestSpawn = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) =>
          (structure.structureType === STRUCTURE_EXTENSION ||
            structure.structureType === STRUCTURE_SPAWN) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
      });

      const target = Game.getObjectById(this.subTargetId);

      if (closestSpawn) {
        if (
          this.creep.transfer(closestSpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
        ) {
          this.creep.travelTo(closestSpawn);
        }
      } else if (target) {
        if (this.creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          this.creep.travelTo(target);
        }
      }
    } else if (this.targetId) {
      const target = Game.getObjectById(this.targetId);
      if (target) {
        this.moveAndCollectEnergy(target);
      }
    }
  }
}
