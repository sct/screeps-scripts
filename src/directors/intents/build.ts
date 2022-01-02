import { TaskType } from 'tasks/task';
import { CreepConfig, Intent, IntentAction, IntentResponse } from './intent';

export class BuildIntent extends Intent {
  protected intentKey = 'build';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        return [
          {
            creepType: 'drone',
            creepCount: 6,
          },
        ];
      case 5:
      case 4:
      case 3:
      case 2:
        return [
          {
            creepType: 'drone',
            creepCount: 4,
          },
        ];
      default:
        return [
          {
            creepType: 'drone',
            creepCount: 0,
          },
        ];
    }
  }

  public run(): IntentResponse {
    const actions: IntentAction[] = [];
    const constructionSites = this.roomDirector.room.find(
      FIND_CONSTRUCTION_SITES
    );

    if (constructionSites.length === 0) {
      return {
        shouldAct: false,
        actions,
      };
    }

    actions.push(
      ...this.assignCreepsToTargets<ConstructionSite>(
        constructionSites.map((cs) => cs.id),
        TaskType.Build
      )
    );

    return {
      shouldAct: true,
      actions,
    };
  }
}
