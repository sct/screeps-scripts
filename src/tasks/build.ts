import { Kouhai } from 'creeps/kouhai';
import { Task, TaskType } from './task';

export class BuildTask extends Task<ConstructionSite> {
  public taskType = TaskType.Build;

  public constructor(kouhai: Kouhai, targetId?: Id<ConstructionSite>) {
    super(kouhai, targetId);
  }

  public run(): void {
    if (this.kouhai.memory.working && this.currentStoredEnergy() === 0) {
      this.kouhai.memory.working = false;
      this.kouhai.creep.say('🔄 harvest');
    }

    if (
      !this.kouhai.memory.working &&
      this.kouhai.creep.store.getFreeCapacity() === 0
    ) {
      this.kouhai.memory.working = true;
      this.kouhai.creep.say('🚧 build');
    }

    if (this.kouhai.memory.working) {
      const constructionSite = this.targetId
        ? Game.getObjectById(this.targetId)
        : this.kouhai.creep.room.find(FIND_CONSTRUCTION_SITES)[0];
      if (
        constructionSite &&
        this.kouhai.creep.build(constructionSite) === ERR_NOT_IN_RANGE
      ) {
        this.kouhai.creep.travelTo(this.kouhai.creep.room.find(FIND_CONSTRUCTION_SITES)[0]);
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
