import { Task, TaskType } from './task';

const DEFAULT_SIGN = 'All hail the our new overlord. sct.';
export class UpgradeTask extends Task<StructureController> {
  public taskType = TaskType.Upgrade;

  public run(): void {
    if (this.kouhai.memory.working && this.kouhai.creep.store[RESOURCE_ENERGY] === 0) {
      this.kouhai.memory.working = false;
      this.kouhai.creep.say('🔄');
    }
    if (
      !this.kouhai.memory.working &&
      this.kouhai.creep.store.getFreeCapacity() === 0
    ) {
      this.kouhai.memory.working = true;
      this.kouhai.creep.say('🚧');
    }

    if (this.kouhai.memory.working && this.kouhai.creep.room.controller) {
      if (this.kouhai.creep.room.controller.sign?.text !== DEFAULT_SIGN) {
        if (
          this.kouhai.creep.signController(
            this.kouhai.creep.room.controller,
            DEFAULT_SIGN
          ) === ERR_NOT_IN_RANGE
        ) {
          this.kouhai.creep.moveTo(this.kouhai.creep.room.controller);
        }
      } else if (
        this.kouhai.creep.upgradeController(this.kouhai.creep.room.controller) ===
        ERR_NOT_IN_RANGE
      ) {
        this.kouhai.creep.travelTo(this.kouhai.creep.room.controller);
      }
    } else {
      const containerEnergy = this.getClosestContainerEnergy(true);
      const source = this.getClosestSource();
      if (containerEnergy) {
        this.moveAndCollectEnergy(containerEnergy);
      } else if (source) {
        this.moveAndHarvest(source);
      }
    }
  }
}
