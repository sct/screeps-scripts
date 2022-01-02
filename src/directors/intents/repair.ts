import { TaskType } from 'tasks/task';
import { Intent, IntentAction, IntentResponse } from './intent';


// Config for structures defining the threshold for repair
const StructureRepairConfig: { [K in StructureConstant]?: number } = {
  [STRUCTURE_ROAD]: 0.3,
  [STRUCTURE_RAMPART]: 0.1,
};

export class RepairIntent extends Intent {
  protected intentKey = 'repair';

  private getAssignedCreeps(): number {
    switch (this.roomDirector.memory.rcl) {
      case 8:
      case 7:
      case 6:
      case 5:
      case 4:
      case 3:
      case 2:
        return 3;
      default:
        return 0;
    }
  }

  private needsRepair(structure: AnyStructure) {
    return (
      structure.hits <
      structure.hitsMax *
        (StructureRepairConfig[structure.structureType] ?? 0.05)
    );
  }

  public run(): IntentResponse {
    const actions: IntentAction[] = [];
    const damagedStructures = this.roomDirector.room.find(FIND_STRUCTURES, {
      filter: (structure) => this.needsRepair(structure),
    });

    if (damagedStructures.length === 0) {
      return {
        shouldAct: false,
        actions,
      };
    }

    const availableStructures = damagedStructures.reduce(
      (acc, structure) => ({
        ...acc,
        [structure.id]: {
          assignedCreeps: 0,
        },
      }),
      {} as { [structureId: Id<AnyStructure>]: { assignedCreeps: number } }
    );

    [...Array(this.getAssignedCreeps()).keys()].forEach(() => {
      const leastAssignedStructureId = (
        Object.entries(availableStructures) as [
          Id<AnyStructure>,
          { assignedCreeps: number }
        ][]
      ).reduce((accStructureId, [structureId, site]) => {
        if (
          site.assignedCreeps <
          availableStructures[accStructureId].assignedCreeps
        ) {
          return structureId;
        }
        return accStructureId;
      }, Object.keys(availableStructures)[0] as Id<AnyStructure>);

      availableStructures[leastAssignedStructureId].assignedCreeps += 1;
    });

    actions.push(
      ...(
        Object.entries(availableStructures) as [
          Id<AnyStructure>,
          { assignedCreeps: number }
        ][]
      )
        .filter(([, structure]) => structure.assignedCreeps > 0)
        .map(([structureId, structure]): IntentAction => {
          return {
            id: this.getTaskKey(
              TaskType.Build,
              structure.assignedCreeps,
              structureId
            ),
            taskType: TaskType.Repair,
            targetId: structureId,
            assignedCreeps: structure.assignedCreeps,
            creepType: 'drone',
          };
        })
    );

    return {
      shouldAct: true,
      actions,
    };
  }
}
