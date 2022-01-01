import { Task, TaskType } from './task';

export class RepairTask extends Task<AnyStructure> {
  public taskType = TaskType.Build;

  public constructor(creep: Creep, targetId?: Id<AnyStructure>) {
    super(creep, targetId);
  }

  private repair(structure: AnyStructure): void {
    if (this.creep.repair(structure) === ERR_NOT_IN_RANGE) {
      this.creep.travelTo(structure);
    }
  }

  public run(): void {
    if (this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.creep.memory.working = false;
      this.creep.say("🔄 harvest");
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
      this.creep.say("🚧 repair");
    }

    if (this.creep.memory.working && this.targetId) {
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
