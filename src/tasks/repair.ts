import { Kouhai } from 'creeps/kouhai';
import { Task, TaskType } from './task';

export class RepairTask extends Task<AnyStructure> {
  public taskType = TaskType.Build;

  public constructor(kouhai: Kouhai, targetId?: Id<AnyStructure>) {
    super(kouhai, targetId);
  }

  private repair(structure: AnyStructure): void {
    if (this.kouhai.creep.repair(structure) === ERR_NOT_IN_RANGE) {
      this.kouhai.creep.travelTo(structure);
    }
  }

  public run(): void {
    if (this.kouhai.memory.working && this.kouhai.creep.store[RESOURCE_ENERGY] === 0) {
      this.kouhai.memory.working = false;
      this.kouhai.creep.say("🔄 harvest");
    }
    if (!this.kouhai.memory.working && this.kouhai.creep.store.getFreeCapacity() === 0) {
      this.kouhai.memory.working = true;
      this.kouhai.creep.say("🚧 repair");
    }

    if (this.kouhai.memory.working && this.targetId) {
      const damagedStructure = Game.getObjectById(this.targetId);

      if (damagedStructure) {
        this.repair(damagedStructure);
      }
    } else {
      const containerEnergy = this.getClosestContainerEnergy();
      const source = this.getClosestSource();
      if (containerEnergy) {
        this.moveAndCollectEnergy(containerEnergy);
      } else if (source) {
        this.moveAndHarvest(source);
      }
    }
  }
}
