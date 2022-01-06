import { TaskType } from 'tasks/task';
import { CreepConfig, Intent, IntentAction, IntentResponse } from './intent';

export class RemoteEnergyIntent extends Intent {
  protected intentKey = 'remoteEnergy';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
      case 5:
      case 4:
        return [
          {
            creepCount: 1,
            creepType: 'drone',
            creepSize: 'distance',
          },
        ];
      default:
        return [
          {
            creepCount: 0,
            creepType: 'drone',
          },
        ];
    }
  }

  public run(): IntentResponse {
    const actions: IntentAction[] = [];
    const remoteSources = this.roomDirector.memory.remoteSources;

    actions.push(
      ...this.assignCreepsToTargets({
        targets: remoteSources.map((source) => source.id),
        taskType: TaskType.Harvest,
      })
    );

    return {
      shouldAct: true,
      actions,
    };
  }
}
