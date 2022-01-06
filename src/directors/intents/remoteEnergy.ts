import { TaskType } from 'tasks/task';
import { CreepConfig, Intent, IntentAction, IntentResponse } from './intent';

export class RemoteEnergyIntent extends Intent {
  protected intentKey = 'remoteEnergy';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        return [
          {
            creepCount: 4,
            creepType: 'drone',
            creepSize: 'distance',
          },
        ];
      case 5:
      case 4:
        return [
          {
            creepCount: 2,
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
        targets: remoteSources.map((source) => ({
          main: source.id,
          targetRoom: source.room,
          data: source.x
            ? {
                x: source.x,
                y: source.y,
              }
            : undefined,
        })),
        taskType: TaskType.Harvest,
      })
    );

    return {
      shouldAct: actions.length > 0,
      actions,
    };
  }
}
