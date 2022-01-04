import { TaskType } from 'tasks/task';
import { CreepConfig, Intent, IntentAction, IntentResponse } from './intent';

export class EnergyIntent extends Intent {
  protected intentKey = 'energy';
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
    const emergency =
      harvesterCreeps.length < EnergyIntent.HARVESTER_EMERGENCY_THRESHOLD;
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

  public run(): IntentResponse {
    const actions: IntentAction[] = [];

    actions.push(
      ...this.assignCreepsToTargets<Source>(
        this.roomDirector.sources,
        TaskType.Harvest
      )
    );

    return {
      actions,
      shouldAct: true,
    };
  }
}
