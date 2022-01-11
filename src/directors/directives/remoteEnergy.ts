import { TaskType } from 'tasks/task';
import {
  CreepConfig,
  Directive,
  DirectiveAction,
  DirectiveResponse
} from './directive';

export class RemoteEnergyDirective extends Directive {
  protected directiveKey = 'remoteEnergy';

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

  public run(): DirectiveResponse {
    const actions: DirectiveAction[] = [];
    const remoteSources = this.roomDirector.memory.remoteSources;

    if (remoteSources.length === 0) {
      return {
        shouldAct: false,
        actions: [],
      };
    }

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
