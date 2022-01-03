import { Task, TaskType } from './task';

const DEFAULT_SIGN = 'All hail the our new overlord. sct.';
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
      if (this.creep.room.controller.sign?.text !== DEFAULT_SIGN) {
        if (
          this.creep.signController(
            this.creep.room.controller,
            DEFAULT_SIGN
          ) === ERR_NOT_IN_RANGE
        ) {
          this.creep.moveTo(this.creep.room.controller);
        }
      } else if (
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
