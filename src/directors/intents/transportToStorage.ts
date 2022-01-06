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
        structure.pos.findInRange(FIND_MINERALS, 2).length > 0,
    });

    const terminal = this.roomDirector.room.terminal;

    actions.push(
      ...this.assignCreepsToTargets<
        StructureContainer,
        StructureStorage | StructureTerminal
      >({
        targets: terminal
          ? [
              ...energyContainers.map((c) => ({ main: c.id, sub: storage.id })),
              ...mineralContainers.map((c) => ({
                main: c.id,
                sub: terminal.id,
              })),
            ]
          : energyContainers.map((c) => ({ main: c.id, sub: storage.id })),
        taskType: TaskType.Transport,
      })
    );

    return {
      shouldAct: actions.length > 0,
      actions,
    };
  }
}
