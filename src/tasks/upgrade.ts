import { Task, TaskType } from './task';

export class UpgradeTask extends Task<StructureController> {
  public taskType = TaskType.Upgrade;

  public run(): void {
    if (this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.creep.memory.working = false;
      this.creep.say('🔄 harvest');
    }
    if (
      !this.creep.memory.working &&
      this.creep.store.getFreeCapacity() === 0
    ) {
      this.creep.memory.working = true;
      this.creep.say('🚧 build');
    }

    if (this.creep.memory.working && this.creep.room.controller) {
      if (
        this.creep.upgradeController(this.creep.room.controller) ===
        ERR_NOT_IN_RANGE
      ) {
        this.creep.travelTo(this.creep.room.controller);
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
