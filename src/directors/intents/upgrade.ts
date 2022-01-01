import { TaskType } from 'tasks/task';
import { Intent, IntentAction, IntentResponse } from './intent';

export class UpgradeIntent extends Intent {
  protected intentKey = 'upgrade';

  private getAssignedCreeps(): number {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        return 8;
      case 5:
      case 4:
        return 5;
      case 3:
      case 2:
        return 3;
      default:
        return 2;
    }
  }

  public run(): IntentResponse {
    const actions: IntentAction[] = [];

    actions.push({
      id: this.getTaskKey(TaskType.Build, this.getAssignedCreeps(), this.roomDirector.memory.roomController),
      taskType: TaskType.Upgrade,
      targetId: this.roomDirector.memory.roomController,
      assignedCreeps: this.getAssignedCreeps(),
      creepType: 'drone',
    });

    return {
      shouldAct: true,
      actions,
    };
  }
}
