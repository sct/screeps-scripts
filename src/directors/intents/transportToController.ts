import { TaskType } from 'tasks/task';
import { CreepConfig, Intent, IntentAction, IntentResponse } from './intent';

export class TransportToControllerIntent extends Intent {
  protected intentKey = 'transportToController';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        return [
          {
            creepCount: 1,
            creepType: 'transport',
            creepSize: 'double',
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

  public run(): IntentResponse {
    const actions: IntentAction[] = [];

    const controller = this.roomDirector.room.controller;
    const storage = this.roomDirector.room.storage;
    if (!controller || !storage) {
      return {
        shouldAct: false,
        actions: [],
      };
    }

    const closestContainer = controller.pos.findInRange<
      FIND_STRUCTURES,
      StructureContainer
    >(FIND_STRUCTURES, 3, {
      filter: (structure) => structure.structureType === STRUCTURE_CONTAINER,
    })?.[0];

    if (!closestContainer) {
      return {
        shouldAct: false,
        actions: [],
      };
    }

    actions.push(
      ...this.assignCreepsToTargets(
        [storage.id],
        TaskType.Transport,
        closestContainer.id
      )
    );

    return {
      shouldAct: actions.length > 0,
      actions,
    };
  }
}
