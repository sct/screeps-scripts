import { TaskType } from 'tasks/task';
import { Intent, IntentAction, IntentResponse } from './intent';

export class BuildIntent extends Intent {
  protected intentKey = 'build';

  private getAssignedCreeps(): number {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
      case 5:
      case 4:
      case 3:
      case 2:
        return 4;
      default:
        return 0;
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
      }
    }

    const availableSites = constructionSites.reduce((acc, site) => ({
      ...acc,
      [site.id]: {
        assignedCreeps: 0,
      },
    }), {} as { [sourceId: Id<ConstructionSite>]: { assignedCreeps: number } });

    [...Array(this.getAssignedCreeps()).keys()].forEach(() => {
      const leastAssignedSiteId = (
        Object.entries(availableSites) as [
          Id<ConstructionSite>,
          { assignedCreeps: number }
        ][]
      ).reduce((accSiteId, [siteId, site]) => {
        if (
          site.assignedCreeps < availableSites[accSiteId].assignedCreeps
        ) {
          return siteId;
        }
        return accSiteId;
      }, Object.keys(availableSites)[0] as Id<ConstructionSite>);

      availableSites[leastAssignedSiteId].assignedCreeps += 1;
    });

    actions.push(
      ...(
        Object.entries(availableSites) as [
          Id<ConstructionSite>,
          { assignedCreeps: number }
        ][]
      )
        .filter(([, site]) => site.assignedCreeps > 0)
        .map(([siteId, site]): IntentAction => {
          return {
            id: this.getTaskKey(TaskType.Build, site.assignedCreeps, siteId),
            taskType: TaskType.Build,
            targetId: siteId,
            assignedCreeps: site.assignedCreeps,
            creepType: 'drone',
          };
        })
    );

    return {
      shouldAct: true,
      actions,
    }
  }
}
