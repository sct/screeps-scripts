import { TaskType } from 'tasks/task';
import {
  CreepConfig,
  Directive,
  DirectiveAction,
  DirectiveResponse
} from './directive';

interface StructureRepairConfigData {
  repairThreshold: number;
  repairedThreshold: number;
}
// Config for structures defining the threshold for repair
const StructureRepairConfig: {
  [K in StructureConstant]?: StructureRepairConfigData;
} = {
  [STRUCTURE_ROAD]: {
    repairThreshold: 0.5,
    repairedThreshold: 1.0,
  },
  [STRUCTURE_RAMPART]: {
    repairThreshold: 0.0025,
    repairedThreshold: 0.005,
  },
  [STRUCTURE_WALL]: {
    repairThreshold: 0.0002,
    repairedThreshold: 0.0005,
  },
  [STRUCTURE_CONTAINER]: {
    repairThreshold: 0.2,
    repairedThreshold: 0.4,
  },
};

export class RepairDirective extends Directive {
  protected directiveKey = 'repair';

  public getAssignedCreeps(): CreepConfig[] {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
      case 5:
      case 4:
      case 3:
      case 2:
        return [
          {
            creepType: 'drone',
            creepCount: 3,
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

  private needsRepair(structure: AnyStructure) {
    const inProgress = this.roomDirector.memory.activeDirectiveActions.some(
      (action) =>
        action.targetId === structure.id && action.taskType === TaskType.Repair
    );

    const damagedPercent = structure.hits / structure.hitsMax;
    const repairConfig = StructureRepairConfig[structure.structureType] ?? {
      repairThreshold: 0.05,
      repairedThreshold: 0.1,
    };

    if (inProgress && damagedPercent < repairConfig.repairedThreshold) {
      return true;
    }

    return damagedPercent < repairConfig.repairThreshold;
  }

  public run(): DirectiveResponse {
    const actions: DirectiveAction[] = [];
    const damagedStructures: AnyStructure[] = [];
    damagedStructures.push(
      ...this.roomDirector.room.find(FIND_STRUCTURES, {
        filter: (structure) => this.needsRepair(structure),
      })
    );

    // Get expansion room repairables
    this.roomDirector.memory.expansionRooms.forEach((r) => {
      const room = Game.rooms[r.roomName];

      if (room) {
        damagedStructures.push(
          ...room.find(FIND_STRUCTURES, {
            filter: (structure) => this.needsRepair(structure),
          })
        );
      }
    });

    if (damagedStructures.length === 0) {
      return {
        shouldAct: false,
        actions,
      };
    }

    actions.push(
      ...this.assignCreepsToTargets<AnyStructure>({
        targets: damagedStructures.map((structure) => ({
          main: structure.id,
          targetRoom: structure.room.name,
        })),
        taskType: TaskType.Repair,
      })
    );

    return {
      shouldAct: true,
      actions,
    };
  }
}
