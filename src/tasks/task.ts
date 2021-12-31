export enum TaskType {
  HARVEST,
  TRANSPORT,
  BUILD,
  UPGRADE,
}

export abstract class Task {
  public abstract run(creep: Creep): void;
}
