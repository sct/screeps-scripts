import { Task, TaskType } from './task';

export class HarvestTask extends Task<Source> {
  public taskType = TaskType.Harvest;

  public constructor(creep: Creep, targetId?: Id<Source>) {
    super(creep, targetId);
  }

  public currentStoredEnergy(): number {
    return this.creep.store[RESOURCE_ENERGY];
  }

  public getClosestSource(): Source | null {
    return this.creep.pos.findClosestByPath(FIND_SOURCES);
  }

  public getClosestContainerEnergy(): AnyStructure | undefined {
    const containers = this.creep.room.find<
      FIND_STRUCTURES,
      StructureContainer
    >(FIND_STRUCTURES, {
      filter: (structure) =>
        structure.structureType === STRUCTURE_CONTAINER &&
        structure.store.energy > 0,
    });

    return containers.reduce((a: StructureContainer | undefined, container) => {
      if (!a) {
        return container;
      } else {
        return a.store.energy > container.store.energy ? a : container;
      }
    }, undefined);
  }

  public moveAndHarvest(
    source: Source | Mineral<MineralConstant> | Deposit
  ): void {
    if (this.creep.harvest(source) === ERR_NOT_IN_RANGE) {
      this.creep.travelTo(source);
    }
  }

  public moveAndCollectEnergy(targetStructure: AnyStructure): void {
    if (
      this.creep.withdraw(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(targetStructure);
    }
  }

  public transferToStorage(): void {
    const closestSpawn = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) =>
        (structure.structureType === STRUCTURE_EXTENSION ||
          structure.structureType === STRUCTURE_SPAWN) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });

    const closestStorage = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) =>
        (structure.structureType === STRUCTURE_CONTAINER ||
          structure.structureType === STRUCTURE_STORAGE ||
          structure.structureType === STRUCTURE_TOWER) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });
    if (
      closestSpawn &&
      this.creep.transfer(closestSpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(closestSpawn);
    } else if (
      closestStorage &&
      this.creep.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(closestStorage);
    }
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
      this.creep.say('📦 storing energy');
    }

    if (this.creep.memory.working) {
      this.transferToStorage();
    } else {
      const targetSource = this.targetId
        ? Game.getObjectById(this.targetId)
        : this.getClosestSource();

      if (targetSource) {
        this.moveAndHarvest(targetSource);
      }
    }
  }
}
