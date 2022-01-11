import { TaskType } from 'tasks/task';
import { CreepConfig, Directive, DirectiveAction, DirectiveResponse } from './directive';

export class TransportToStorageDirective extends Directive {
  protected directiveKey = 'transportToStorage';

  protected getAssignedCreeps(): CreepConfig[] {
    // Mainly we are just deciding here if transporters are
    // enabled or not. The # of them is decided further below
    // based on the number of containers near sources/minerals
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
      case 5:
      case 4:
        return [
          {
            creepType: 'transport',
            creepCount: 1,
          },
        ];
      default:
        return [];
    }
  }

  public run(): DirectiveResponse {
    const actions: DirectiveAction[] = [];
    const assignedCreeps = this.getAssignedCreeps();

    const storage = this.roomDirector.room.storage;
    if (!storage || assignedCreeps.length === 0) {
      return {
        shouldAct: false,
        actions: [],
      };
    }

    const energyContainers = this.roomDirector.room.find<
      FIND_STRUCTURES,
      StructureContainer
    >(FIND_STRUCTURES, {
      filter: (structure) =>
        structure.structureType === STRUCTURE_CONTAINER &&
        structure.pos.findInRange(FIND_SOURCES, 2).length > 0,
    });

    const mineralContainers = this.roomDirector.room.find<
      FIND_STRUCTURES,
      StructureContainer
    >(FIND_STRUCTURES, {
      filter: (structure) =>
        structure.structureType === STRUCTURE_CONTAINER &&
        // We will only bother with this container if the mineral is not depleted
        structure.pos.findInRange(FIND_MINERALS, 2)?.[0]?.mineralAmount > 0,
    });

    const terminal = this.roomDirector.room.terminal;

    actions.push(
      ...energyContainers.map(
        (container): DirectiveAction => ({
          id: this.getTaskKey(TaskType.Transport, 1, container.id),
          taskType: TaskType.Transport,
          totalCreeps: 1,
          targetId: container.id,
          subTargetId: storage.id,
          creeps: {
            'transport:default': {
              creepCount: 1,
              creepType: 'transport',
            },
          },
        })
      )
    );

    if (terminal) {
      actions.push(
        ...mineralContainers.map(
          (container): DirectiveAction => ({
            id: this.getTaskKey(TaskType.Transport, 1, container.id),
            taskType: TaskType.Transport,
            totalCreeps: 1,
            targetId: container.id,
            subTargetId: terminal.id,
            creeps: {
              'transport:default': {
                creepCount: 1,
                creepType: 'transport',
              },
            },
          })
        )
      );
    }

    return {
      shouldAct: actions.length > 0,
      actions,
    };
  }
}
