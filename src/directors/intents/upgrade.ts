import { TaskType } from 'tasks/task';
import {
  CreepConfig,
  CreepsRecord,
  Intent,
  IntentAction,
  IntentResponse
} from './intent';

export class UpgradeIntent extends Intent {
  protected intentKey = 'upgrade';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        return [
          {
            creepType: 'drone',
            creepSize: 'double',
            creepCount: 1,
          },
        ];
      case 5:
      case 4:
        return [
          {
            creepType: 'drone',
            creepSize: 'standard',
            creepCount: 2,
          },
        ];
      case 3:
      case 2:
        return [
          {
            creepType: 'drone',
            creepCount: 3,
          },
        ];
      default:
        return [
          {
            creepType: 'drone',
            creepCount: 1,
          },
        ];
    }
  }

  public run(): IntentResponse {
    const actions: IntentAction[] = [];

    const assignedCreeps = this.getAssignedCreeps();
    const totalCreeps = assignedCreeps.reduce(
      (total, creepConfig) => total + creepConfig.creepCount,
      0
    );
    const creeps = assignedCreeps.reduce(
      (acc, cc) => ({
        ...acc,
        [`${cc.creepType}:${cc.creepSize ?? 'default'}`]: cc,
      }),
      {} as CreepsRecord
    );

    actions.push({
      id: this.getTaskKey(
        TaskType.Build,
        totalCreeps,
        this.roomDirector.memory.roomController
      ),
      taskType: TaskType.Upgrade,
      targetId: this.roomDirector.memory.roomController,
      creeps,
      totalCreeps,
    });

    return {
      shouldAct: true,
      actions,
    };
  }
}
