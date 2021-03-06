import { TaskType } from 'tasks/task';
import { CreepConfig, Directive, DirectiveAction, DirectiveResponse } from './directive';

export class EnergyDirective extends Directive {
  protected directiveKey = 'energy';
  public static ENERGY_EMERGENCY_THRESHOLD = 0.1;
  public static HARVESTER_EMERGENCY_THRESHOLD = 2;

  protected getAssignedCreeps(): CreepConfig[] {
    const harvesterCreeps = Object.values(
      this.roomDirector.shachou.creepDirector.getInactiveKouhaiInRoom(
        this.roomDirector.room
      )
    ).filter(
      (kouhai) =>
        kouhai.activeTask?.taskType === TaskType.Harvest || !kouhai.activeTask
    );
    const emergency = false;
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        if (emergency) {
          return [
            {
              creepType: 'drone',
              creepCount: 6,
            },
            {
              creepType: 'drone',
              creepSize: 'standard',
              creepCount: 1,
            },
          ];
        }
        return [
          {
            creepType: 'drone',
            creepSize: 'standard',
            creepCount: 2,
          },
        ];
      case 5:
      case 4:
        if (emergency) {
          return [
            {
              creepType: 'drone',
              creepCount: 5,
            },
            {
              creepType: 'drone',
              creepSize: 'standard',
              creepCount: 1,
            },
          ];
        }
        return [
          {
            creepType: 'drone',
            creepSize: 'standard',
            creepCount: 2,
          },
        ];
      case 3:
      case 2:
        if (emergency) {
          return [
            {
              creepType: 'drone',
              creepCount: 5,
            },
          ];
        }
        return [
          {
            creepType: 'drone',
            creepCount: 3,
          },
        ];
      default:
        if (emergency) {
          return [
            {
              creepType: 'drone',
              creepCount: 3,
            },
          ];
        }
        return [
          {
            creepType: 'drone',
            creepCount: 2,
          },
        ];
    }
  }

  public run(): DirectiveResponse {
    const actions: DirectiveAction[] = [];

    actions.push(
      ...this.assignCreepsToTargets<Source>({
        targets: this.roomDirector.sources.map((id) => ({
          main: id,
        })),
        taskType: TaskType.Harvest,
      })
    );

    return {
      actions,
      shouldAct: true,
    };
  }
}
