import { Kouhai } from 'creeps/kouhai';
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
    kouhai: Kouhai,
    targetId?: Id<StorableStructures>,
    subTargetId?: Id<StorableStructures>,
    preferSubTarget?: boolean
  ) {
    super(kouhai, targetId, subTargetId);
    if (preferSubTarget) {
      this.preferSubtarget = preferSubTarget;
    }

    if (kouhai.creep.store[RESOURCE_ENERGY] === 0) {
      this.preferSubtarget = true;
    }
  }

  public transfer(target: AnyCreep | Structure<StructureConstant>): void {
    if (
      this.kouhai.creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.kouhai.creep.travelTo(target);
    } else if (
      this.kouhai.creep.transfer(target, RESOURCE_KEANIUM) === ERR_NOT_IN_RANGE
    ) {
      this.kouhai.creep.travelTo(target);
    }
  }

  public run(): void {
    if (this.kouhai.memory.working && this.currentStore() === 0) {
      this.kouhai.memory.working = false;
      this.kouhai.creep.say('🔄 pick up');
    }
    if (
      !this.kouhai.memory.working &&
      this.kouhai.creep.store.getFreeCapacity() === 0
    ) {
      this.kouhai.memory.working = true;
      this.kouhai.creep.say('🚧 transport');
    }

    if (this.kouhai.memory.working && this.subTargetId) {
      const closestSpawnOrTower = this.kouhai.creep.pos.findClosestByPath(
        FIND_STRUCTURES,
        {
          filter: (structure) =>
            (structure.structureType === STRUCTURE_EXTENSION ||
              structure.structureType === STRUCTURE_SPAWN ||
              structure.structureType === STRUCTURE_TOWER) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
        }
      );

      const target = Game.getObjectById(this.subTargetId);

      const tryFirst = this.preferSubtarget ? target : closestSpawnOrTower;
      const trySecond = this.preferSubtarget ? closestSpawnOrTower : target;

      if (tryFirst) {
        this.transfer(tryFirst);
      } else if (trySecond) {
        this.transfer(trySecond);
      }
    } else if (this.targetId) {
      const target = Game.getObjectById(this.targetId);
      if (target) {
        if (target.store[RESOURCE_ENERGY] > 0) {
          this.moveAndCollectEnergy(target);
        } else if (target.store[RESOURCE_KEANIUM] > 0) {
          if (
            this.kouhai.creep.withdraw(target, RESOURCE_KEANIUM) ===
            ERR_NOT_IN_RANGE
          ) {
            this.kouhai.creep.travelTo(target);
          }
        }
      }
    }
  }
}
