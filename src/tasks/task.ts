export enum TaskType {
  Harvest = 1,
  Transport,
  Build,
  Upgrade,
  Repair,
}

export abstract class Task<Target, SubTarget = void> {
  public abstract taskType: TaskType;
  protected creep: Creep;
  protected targetId?: Id<Target>;
  protected subTargetId?: Id<SubTarget>;

  public constructor(creep: Creep, targetId?: Id<Target>, subTargetId?: Id<SubTarget>) {
    this.creep = creep;
    this.targetId = targetId;
    this.subTargetId = subTargetId;
  }

  protected currentStoredEnergy(): number {
    return this.creep.store[RESOURCE_ENERGY];
  }

  protected getClosestSource(): Source | null {
    return this.creep.pos.findClosestByPath(FIND_SOURCES);
  }

  protected getClosestContainerEnergy(): AnyStructure | undefined {
    const container = this.creep.pos.findClosestByPath<
      FIND_STRUCTURES,
      StructureContainer
    >(FIND_STRUCTURES, {
      filter: (structure) =>
        structure.structureType === STRUCTURE_CONTAINER &&
        structure.store.energy > 0,
    });
    const storage = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) =>
        structure.structureType === STRUCTURE_STORAGE &&
        structure.store.energy > 0,
    });

    if (container) {
      return container;
    } else if (storage) {
      return storage;
    }

    return undefined;
  }

  protected moveAndHarvest(
    source: Source | Mineral<MineralConstant> | Deposit
  ): void {
    if (this.creep.harvest(source) === ERR_NOT_IN_RANGE) {
      this.creep.travelTo(source);
    }
  }

  protected moveAndCollectEnergy(targetStructure: AnyStructure): void {
    if (
      this.creep.withdraw(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(targetStructure);
    }
  }

  public abstract run(creep: Creep): void;
}
