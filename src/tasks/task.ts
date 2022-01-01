export enum TaskType {
  Harvest = 1,
  Transport,
  Build,
  Upgrade,
}

export abstract class Task<Target> {
  public abstract taskType: TaskType;
  protected creep: Creep;
  protected targetId?: Id<Target>;

  public constructor(
    creep: Creep,
    targetId?: Id<Target>
  ) {
    this.creep = creep;
    this.targetId = targetId;
  }

  public abstract run(creep: Creep): void;
}
