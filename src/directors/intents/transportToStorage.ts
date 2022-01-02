import { TaskType } from 'tasks/task';
import { CreepConfig, Intent, IntentAction, IntentResponse } from './intent';

export class TransportToStorageIntent extends Intent {
  protected intentKey = 'transportToStorage';

  protected getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
        return [
          {
            creepType: 'transport',
            creepCount: 3,
          },
        ];
      case 5:
      case 4:
        return [
          {
            creepType: 'transport',
            creepCount: 2,
          },
        ];
      default:
        return [
          {
            creepType: 'transport',
            creepCount: 0,
          },
        ];
    }
  }

  public run(): IntentResponse {
    const actions: IntentAction[] = [];

    const storage = this.roomDirector.room.storage;
    if (!storage) {
      return {
        shouldAct: false,
        actions: [],
      };
    }

    const containers: StructureContainer[] = [];

    this.roomDirector.room.find(FIND_SOURCES).forEach((source) => {
      const container = source.pos.findInRange<
        FIND_STRUCTURES,
        StructureContainer
      >(FIND_STRUCTURES, 4, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER,
      })[0];

      if (container) {
        containers.push(container);
      }
    });

    if (containers.length === 0) {
      return {
        shouldAct: false,
        actions: [],
      };
    }

    actions.push(
      ...this.assignCreepsToTargets<StructureContainer>(
        containers.map((c) => c.id),
        TaskType.Transport,
        storage.id
      )
    );

    return {
      shouldAct: true,
      actions,
    };
  }
}
