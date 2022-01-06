import { CreepSize, CreepType } from 'directors/creepDirector';
import { RoomDirector } from 'directors/roomDirector';
import { TaskType } from 'tasks/task';

interface IntentSetup {
  roomDirector: RoomDirector;
}

export interface CreepConfig {
  creepType: CreepType;
  creepSize?: CreepSize;
  creepCount: number;
}

export type CreepsRecord = Record<`${CreepType}:${CreepSize}`, CreepConfig>;

export interface IntentAction {
  id: string;
  taskType: TaskType;
  creeps: CreepsRecord;
  totalCreeps: number;
  targetId?: Id<any>;
  subTargetId?: Id<any>;
  targetRoom?: string;
}

export interface IntentResponse {
  shouldAct: boolean;
  actions: IntentAction[];
}

export abstract class Intent {
  protected abstract intentKey: string;
  protected roomDirector: RoomDirector;

  public constructor(setup: IntentSetup) {
    this.roomDirector = setup.roomDirector;
  }

  protected getTaskKey(
    taskType: TaskType,
    creeps: number,
    targetId = 'none'
  ): string {
    return `${this.intentKey}:${taskType}:${creeps}:${targetId.slice(-7)}`;
  }

  protected getTotalCreeps(): number {
    const assignedCreeps = this.getAssignedCreeps();

    return assignedCreeps.reduce(
      (total, creepConfig) => total + creepConfig.creepCount,
      0
    );
  }

  protected assignCreepsToTargets<T>({
    targets,
    taskType,
    subTargetId,
    targetRoom,
  }: {
    targets: Id<T>[];
    taskType: TaskType;
    subTargetId?: Id<any>;
    targetRoom?: string;
  }): IntentAction[] {
    const actions: IntentAction[] = [];

    const availableSources = targets.reduce(
      (acc, source) => ({
        ...acc,
        [source]: {},
      }),
      {} as { [sourceId: Id<T>]: CreepsRecord }
    );

    this.getAssignedCreeps().forEach((cc) => {
      [...Array(cc.creepCount).keys()].forEach(() => {
        const leastAssignedSourceId = (
          Object.entries(availableSources) as [Id<T>, CreepsRecord][]
        ).reduce((accSourceId, [sourceId, creepConfigs]) => {
          const totalCreeps = Object.values(creepConfigs).reduce(
            (acc, creep) => acc + creep.creepCount,
            0
          );
          const totalInSource = Object.values(
            availableSources[accSourceId]
          ).reduce((acc, creep) => acc + creep.creepCount, 0);

          if (totalCreeps < totalInSource) {
            return sourceId;
          }
          return accSourceId;
        }, Object.keys(availableSources)[0] as Id<T>);

        if (
          availableSources[leastAssignedSourceId][
            `${cc.creepType}:${cc.creepSize ?? 'default'}`
          ]
        ) {
          availableSources[leastAssignedSourceId][
            `${cc.creepType}:${cc.creepSize ?? 'default'}`
          ].creepCount++;
        } else {
          availableSources[leastAssignedSourceId][
            `${cc.creepType}:${cc.creepSize ?? 'default'}`
          ] = {
            creepType: cc.creepType,
            creepSize: cc.creepSize,
            creepCount: 1,
          };
        }
      });
    });

    actions.push(
      ...(Object.entries(availableSources) as [Id<Source>, CreepsRecord][])
        .filter(
          ([, source]) =>
            Object.values(source).reduce((acc, v) => acc + v.creepCount, 0) > 0
        )
        .map(([sourceId, source]): IntentAction => {
          const totalCreeps = Object.values(source).reduce(
            (acc, v) => acc + v.creepCount,
            0
          );
          return {
            id: this.getTaskKey(taskType, totalCreeps, sourceId),
            taskType,
            targetId: sourceId,
            creeps: source,
            totalCreeps,
            subTargetId,
            targetRoom,
          };
        })
    );

    return actions;
  }
  protected abstract getAssignedCreeps(): CreepConfig[];
  public abstract run(): IntentResponse;
}
