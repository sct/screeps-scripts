import { RoomDirector } from 'directors/roomDirector';
import { TaskType } from 'tasks/task';

interface IntentSetup {
  roomDirector: RoomDirector;
}

export interface IntentAction {
  taskType: TaskType;
  assignedCreeps: number;
  targetId?: Id<AnyStructure | Source>;
}

export interface IntentResponse {
  shouldAct: boolean;
  actions: IntentAction[];
}

export abstract class Intent {
  protected roomDirector: RoomDirector;

  public constructor(setup: IntentSetup) {
    this.roomDirector = setup.roomDirector;
  }

  public abstract run(): IntentResponse;
}
