import { TaskType } from 'tasks/task';
import { CreepConfig, Directive, DirectiveAction, DirectiveResponse } from './directive';

export class TransportToControllerDirective extends Directive {
  protected directiveKey = 'transportToController';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        return [
          {
            creepCount: 1,
            creepType: 'transport',
            creepSize: 'standard',
          },
        ];
      case 5:
      case 4:
        return [
          {
            creepCount: 1,
            creepType: 'transport',
            creepSize: 'standard',
          },
        ];
      default:
        return [
          {
            creepCount: 0,
            creepType: 'transport',
          },
        ];
    }
  }

  public run(): DirectiveResponse {
    const actions: DirectiveAction[] = [];

    const controller = this.roomDirector.room.controller;
    const storage = this.roomDirector.room.storage;
    if (!controller || !storage) {
      return {
        shouldAct: false,
        actions: [],
      };
    }

    const link = storage.pos.findInRange<FIND_STRUCTURES, StructureLink>(
      FIND_STRUCTURES,
      2,
      { filter: (structure) => structure.structureType === STRUCTURE_LINK }
    )?.[0];

    const closestContainer = controller.pos.findInRange<
      FIND_STRUCTURES,
      StructureContainer
    >(FIND_STRUCTURES, 3, {
      filter: (structure) => structure.structureType === STRUCTURE_CONTAINER,
    })?.[0];

    if (link) {
      actions.push(
        ...this.assignCreepsToTargets({
          targets: [{ main: storage.id, sub: link.id }],
          taskType: TaskType.Transport,
        })
      );
    } else if (closestContainer) {
      actions.push(
        ...this.assignCreepsToTargets({
          targets: [{ main: storage.id, sub: closestContainer.id }],
          taskType: TaskType.Transport,
        })
      );
    }

    return {
      shouldAct: actions.length > 0,
      actions,
    };
  }
}
