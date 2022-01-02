import { CreepType } from 'directors/creepDirector';
import { RoomDirector } from 'directors/roomDirector';
import { TaskType } from 'tasks/task';

interface IntentSetup {
  roomDirector: RoomDirector;
}

export interface IntentAction {
  id: string;
  taskType: TaskType;
  assignedCreeps: number;
  creepType: CreepType;
  targetId?: Id<AnyStructure | Source | ConstructionSite>;
}

export interface IntentResponse {
  shouldAct: boolean;
  actions: IntentAction[];
}

export abstract class Intent {
  protected abstract intentKey: string;
  protected roomDirector: RoomDirector;

  public constructor(setup: IntentSetup) {
    this.roomDirector = setup.roomDirector;
  }

  protected getTaskKey(taskType: TaskType, creeps: number, targetId = 'none'): string {
    return `${this.intentKey}:${taskType}:${creeps}:${targetId.slice(-7)}`;
  }

  public abstract run(): IntentResponse;
}
