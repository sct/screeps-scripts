import { Kouhai } from "creeps/kouhai";

export enum TaskType {
  Harvest = 1,
  Transport,
  Build,
  Upgrade,
  Repair,
  Scout,
}

export abstract class Task<Target = void, SubTarget = void> {
  public abstract taskType: TaskType;
  protected kouhai: Kouhai;
  protected targetId?: Id<Target>;
  protected subTargetId?: Id<SubTarget>;

  public constructor(
    kouhai: Kouhai,
    targetId?: Id<Target>,
    subTargetId?: Id<SubTarget>
  ) {
    this.kouhai = kouhai;
    this.targetId = targetId;
    this.subTargetId = subTargetId;
  }

  protected currentStoredEnergy(): number {
    return this.kouhai.creep.store[RESOURCE_ENERGY];
  }

  protected getClosestSource(): Source | null {
    return this.kouhai.creep.pos.findClosestByPath(FIND_SOURCES);
  }

  protected getClosestContainerEnergy(
    allowReservedContainers = false
  ): AnyStructure | undefined {
    const container = this.kouhai.creep.pos.findClosestByPath<
      FIND_STRUCTURES,
      StructureContainer
    >(FIND_STRUCTURES, {
      filter: (structure) =>
        structure.structureType === STRUCTURE_CONTAINER &&
        structure.store.energy > 0 &&
        (!allowReservedContainers
          ? structure.pos.findInRange(FIND_SOURCES, 3).length === 0 &&
            structure.pos.findInRange(FIND_STRUCTURES, 3, {
              filter: (s) => s.structureType === STRUCTURE_CONTROLLER,
            }).length === 0
          : true),
    });
    const storage = this.kouhai.creep.pos.findClosestByPath(FIND_STRUCTURES, {
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
    if (this.kouhai.creep.harvest(source) === ERR_NOT_IN_RANGE) {
      this.kouhai.creep.travelTo(source);
    }
  }

  protected moveAndCollectEnergy(targetStructure: AnyStructure): void {
    if (
      this.kouhai.creep.withdraw(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.kouhai.creep.travelTo(targetStructure);
    }
  }

  public abstract run(creep: Creep): void;
}
