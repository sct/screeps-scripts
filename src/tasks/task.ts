export enum TaskType {
  Harvest = 1,
  Transport,
  Build,
  Upgrade,
}

export abstract class Task {
  protected creep: Creep;

  public constructor(creep: Creep) {
    this.creep = creep;
  }
  public abstract run(creep: Creep): void;
}
