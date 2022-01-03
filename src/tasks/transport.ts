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
  private preferSubtarget = false;

  public constructor(
    creep: Creep,
    targetId?: Id<StorableStructures>,
    subTargetId?: Id<StorableStructures>,
    preferSubTarget?: boolean
  ) {
    super(creep, targetId, subTargetId);
    if (preferSubTarget) {
      this.preferSubtarget = preferSubTarget;
    }
  }

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

      const tryFirst = this.preferSubtarget ? target : closestSpawn;
      const trySecond = this.preferSubtarget ? closestSpawn : target;

      if (tryFirst) {
        if (
          this.creep.transfer(tryFirst, RESOURCE_ENERGY) ===
          ERR_NOT_IN_RANGE
        ) {
          this.creep.travelTo(tryFirst);
        }
      } else if (trySecond) {
        if (this.creep.transfer(trySecond, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          this.creep.travelTo(trySecond);
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
