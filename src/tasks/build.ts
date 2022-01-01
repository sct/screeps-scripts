import { Task, TaskType } from './task';

export class BuildTask extends Task<ConstructionSite> {
  public taskType = TaskType.Build;

  public constructor(creep: Creep, targetId?: Id<ConstructionSite>) {
    super(creep, targetId);
  }

  public run(): void {
    if (this.creep.memory.working && this.currentStoredEnergy() === 0) {
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

    if (this.creep.memory.working) {
      const constructionSite = this.targetId
        ? Game.getObjectById(this.targetId)
        : this.creep.room.find(FIND_CONSTRUCTION_SITES)[0];
      if (
        constructionSite &&
        this.creep.build(constructionSite) === ERR_NOT_IN_RANGE
      ) {
        this.creep.travelTo(this.creep.room.find(FIND_CONSTRUCTION_SITES)[0]);
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
