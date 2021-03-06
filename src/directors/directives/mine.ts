import { TaskType } from 'tasks/task';
import { CreepConfig, Directive, DirectiveAction, DirectiveResponse } from './directive';

export class MineDirective extends Directive {
  protected directiveKey = 'mine';

  public getAssignedCreeps(): CreepConfig[] {
    if (this.roomDirector.memory.rcl >= 6 && this.roomDirector.room.terminal) {
      const extractor = this.roomDirector.room.find<
        FIND_STRUCTURES,
        StructureExtractor
      >(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_EXTRACTOR,
      })?.[0];

      const mineralDeposits = this.roomDirector.room.find(FIND_MINERALS, {
        filter: (mineral) => mineral.mineralAmount > 0,
      })?.[0];

      if (extractor && mineralDeposits) {
        return [
          {
            creepType: 'drone',
            creepSize: 'standard',
            creepCount: 1,
          },
        ];
      }
    }
    return [];
  }

  public run(): DirectiveResponse {
    const actions: DirectiveAction[] = [];
    const mineral = this.roomDirector.room.find(FIND_MINERALS)?.[0];

    if (mineral) {
      actions.push(
        ...this.assignCreepsToTargets({
          targets: [{ main: mineral.id }],
          taskType: TaskType.Mine,
        })
      );
    }

    return {
      shouldAct: actions.length > 0,
      actions,
    };
  }
}
