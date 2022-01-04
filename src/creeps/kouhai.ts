import { CreepSize, CreepType } from 'directors/creepDirector';
import { TaskType } from 'tasks/task';

interface CreepMemory {
  type?: CreepType;
  size?: CreepSize;
  room: string;
  working: boolean;
  activeTask?: ActiveTaskMemory | null | undefined;
  creepId: Id<Creep>;
  data?: Record<string, unknown>;
}

interface ActiveTaskMemory {
  taskKey: string;
  taskType: TaskType;
  targetId?: Id<any>;
  subTargetId?: Id<any>;
}

export class Kouhai {
  public creep: Creep;

  public constructor(creep: Creep) {
    this.creep = creep;
    _.defaults(this.creep.memory, {
      creepId: creep.id,
      working: false,
      type: 'drone',
      size: 'default',
    });
  }

  public get memory(): CreepMemory {
    return this.creep.memory as CreepMemory;
  }

  public set memory(memory: CreepMemory) {
    this.creep.memory = memory;
  }

  public get id(): Id<Creep> {
    return this.creep.id;
  }

  public get type(): CreepType {
    return this.memory.type ?? 'drone';
  }

  public set type(type: CreepType) {
    this.memory.type = type;
  }

  public get size(): CreepSize {
    return this.memory.size ?? 'default';
  }

  public set size(size: CreepSize) {
    this.memory.size = size;
  }

  public get activeTask(): ActiveTaskMemory | null | undefined {
    return this.memory.activeTask;
  }

  public set activeTask(activeTask: ActiveTaskMemory | null | undefined) {
    this.memory.activeTask = activeTask;
  }
}
