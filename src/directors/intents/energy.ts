import { TaskType } from 'tasks/task';
import log from 'utils/logger';
import { Intent, IntentAction, IntentResponse } from './intent';

export class EnergyIntent extends Intent {
  public static ENERGY_EMERGENCY_THRESHOLD = 0.1;

  private getAssignedCreeps(): number {
    const emergency =
      this.roomDirector.memory.availableSpawnEnergy /
        this.roomDirector.memory.spawnCapacity <
      EnergyIntent.ENERGY_EMERGENCY_THRESHOLD;
    switch (this.roomDirector.memory.rcl) {
      case 2:
        if (emergency) {
          return 5;
        }
        return 3;
      default:
        if (emergency) {
          return 3;
        }
        return 2;
    }
  }

  public run(): IntentResponse {
    const actions: IntentAction[] = [];

    const availableSources = this.roomDirector.sources.reduce(
      (acc, source) => ({
        ...acc,
        [source]: {
          assignedCreeps: 0,
        },
      }),
      {} as { [sourceId: Id<Source>]: { assignedCreeps: number } }
    );

    [...Array(this.getAssignedCreeps()).keys()].forEach(() => {
      const leastAssignedSourceId = (
        Object.entries(availableSources) as [
          Id<Source>,
          { assignedCreeps: number }
        ][]
      ).reduce((accSourceId, [sourceId, source]) => {
        if (
          source.assignedCreeps < availableSources[accSourceId].assignedCreeps
        ) {
          return sourceId;
        }
        return accSourceId;
      }, Object.keys(availableSources)[0] as Id<Source>);
      log.debug('Least Assigned Source ID', {
        sourceId: leastAssignedSourceId,
      });

      availableSources[leastAssignedSourceId].assignedCreeps += 1;
    });

    log.debug('Available Sources', { availableSources });

    actions.push(
      ...(
        Object.entries(availableSources) as [
          Id<Source>,
          { assignedCreeps: number }
        ][]
      )
        .filter(([, source]) => source.assignedCreeps > 0)
        .map(([sourceId, source]): IntentAction => {
          return {
            taskType: TaskType.Harvest,
            targetId: sourceId,
            assignedCreeps: source.assignedCreeps,
            creepType: 'drone',
          };
        })
    );

    return {
      actions,
      shouldAct: true,
    };
  }
}
