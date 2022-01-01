import { Role } from './creepWrapper';
import { HarvesterCreep } from './harvester';

export class UpgraderCreep extends HarvesterCreep<Record<string, unknown>> {
  protected static role = Role.Upgrader;
  protected static parts: BodyPartConstant[] = [WORK, WORK, CARRY, CARRY, MOVE];

  public run(): void {
    if (this.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.working = false;
      this.creep.say('🔄 harvest');
    }
    if (!this.working && this.creep.store.getFreeCapacity() === 0) {
      this.working = true;
      this.creep.say('🚧 build');
    }

    if (this.working && this.creep.room.controller) {
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
