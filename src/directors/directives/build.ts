import { TaskType } from 'tasks/task';
import {
  CreepConfig,
  Directive,
  DirectiveAction,
  DirectiveResponse
} from './directive';

export class BuildDirective extends Directive {
  protected directiveKey = 'build';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        return [
          {
            creepType: 'drone',
            creepCount: 4,
            creepSize: 'heavy',
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

  public run(): DirectiveResponse {
    const actions: DirectiveAction[] = [];
    const constructionSites: ConstructionSite<BuildableStructureConstant>[] =
      [];
    constructionSites.push(
      ...this.roomDirector.room.find(FIND_MY_CONSTRUCTION_SITES)
    );

    // Get expansion room sites
    this.roomDirector.memory.expansionRooms.forEach((r) => {
      const room = Game.rooms[r.roomName];

      if (room) {
        constructionSites.push(...room.find(FIND_MY_CONSTRUCTION_SITES));
      }
    });

    if (constructionSites.length === 0) {
      return {
        shouldAct: false,
        actions,
      };
    }

    actions.push(
      ...this.assignCreepsToTargets<ConstructionSite>({
        targets: constructionSites
          .slice(0, 2)
          .map((cs) => ({ main: cs.id, targetRoom: cs.room?.name })),
        taskType: TaskType.Build,
      })
    );

    return {
      shouldAct: true,
      actions,
    };
  }
}
