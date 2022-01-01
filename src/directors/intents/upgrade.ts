import { TaskType } from 'tasks/task';
import { Intent, IntentAction, IntentResponse } from './intent';

export class UpgradeIntent extends Intent {
  private getAssignedCreeps(): number {
    switch (this.roomDirector.memory.rcl) {
      case 2:
        return 3;
      default:
        return 2;
    }
  }

  public run(): IntentResponse {
    const actions: IntentAction[] = [];

    actions.push({
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
