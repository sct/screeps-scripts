import { TaskType } from 'tasks/task';
import {
  CreepConfig,
  CreepsRecord,
  Intent,
  IntentAction,
  IntentResponse
} from './intent';

export class ScoutIntent extends Intent {
  protected intentKey = 'scout';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 6:
        return [
          {
            creepCount: 4,
            creepType: 'scout',
          },
        ];
      default:
        return [
          {
            creepCount: 1,
            creepType: 'scout',
            creepSize: 'default',
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
        TaskType.Scout,
        totalCreeps,
        this.roomDirector.room.name
      ),
      taskType: TaskType.Scout,
      creeps,
      totalCreeps,
    });

    return {
      shouldAct: true,
      actions,
    };
  }
}
