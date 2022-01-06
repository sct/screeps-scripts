import { TaskType } from 'tasks/task';
import {
  CreepConfig,
  CreepsRecord,
  Intent,
  IntentAction,
  IntentResponse
} from './intent';

export class ReserveIntent extends Intent {
  protected intentKey = 'reserve';

  public getAssignedCreeps(): CreepConfig[] {
    return [
      {
        creepCount: this.roomDirector.memory.expansionRooms.length,
        creepType: 'reserver',
      },
      {
        creepCount: 1,
        creepType: 'defender',
      },
    ];
  }

  public run(): IntentResponse {
    const expansionRooms = this.roomDirector.memory.expansionRooms;

    if (expansionRooms.length === 0) {
      return {
        shouldAct: false,
        actions: [],
      };
    }

    const actions: IntentAction[] = [];

    const assignedCreeps = this.getAssignedCreeps();
    const reserverCreeps = assignedCreeps
      .filter((cc) => cc.creepType === 'reserver')
      .reduce(
        (acc, cc): CreepsRecord => ({
          ...acc,
          [`${cc.creepType}:${cc.creepSize ?? 'default'}`]: {
            // There should only be one reserver per room
            creepCount: 1,
            creepType: cc.creepType,
          },
        }),
        {} as CreepsRecord
      );

    const defenderCreeps = assignedCreeps
      .filter((cc) => cc.creepType === 'defender')
      .reduce(
        (acc, cc): CreepsRecord => ({
          ...acc,
          [`${cc.creepType}:${cc.creepSize ?? 'default'}`]: {
            // There should only be one initial defender per room
            creepCount: 1,
            creepType: cc.creepType,
          },
        }),
        {} as CreepsRecord
      );

    actions.push(
      ...[
        ...expansionRooms.map((expansionRoom) => {
          return {
            id: this.getTaskKey(TaskType.Reserve, 1, expansionRoom.roomName),
            creeps: reserverCreeps,
            totalCreeps: 1,
            taskType: TaskType.Reserve,
            targetRoom: expansionRoom.roomName,
          };
        }),
        ...expansionRooms.map((expansionRoom) => {
          return {
            id: this.getTaskKey(TaskType.Defend, 1, expansionRoom.roomName),
            creeps: defenderCreeps,
            totalCreeps: 1,
            taskType: TaskType.Defend,
            targetRoom: expansionRoom.roomName,
          };
        }),
      ]
    );

    return {
      shouldAct: true,
      actions,
    };
  }
}
