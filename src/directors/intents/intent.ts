import { CreepSize, CreepType } from 'directors/creepDirector';
import { RoomDirector } from 'directors/roomDirector';
import { TaskType } from 'tasks/task';

interface IntentSetup {
  roomDirector: RoomDirector;
}

export interface CreepConfig {
  creepType: CreepType;
  creepSize?: CreepSize;
  renew?: boolean;
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
  data?: Record<string, unknown>;
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

  protected assignCreepsToTargets<T, ST = void>({
    targets,
    taskType,
  }: {
    targets: {
      main: Id<T>;
      sub?: Id<ST>;
      targetRoom?: string;
      data?: Record<string, unknown>;
    }[];
    taskType: TaskType;
  }): IntentAction[] {
    const actions: IntentAction[] = [];

    const availableTargets = targets.reduce(
      (acc, target) => ({
        ...acc,
        [target.main]: {},
      }),
      {} as { [targetId: Id<T>]: CreepsRecord }
    );

    this.getAssignedCreeps().forEach((cc) => {
      [...Array(cc.creepCount).keys()].forEach(() => {
        const leastAssignedTargetId = (
          Object.entries(availableTargets) as [Id<T>, CreepsRecord][]
        ).reduce((accTargetId, [targetId, creepConfigs]) => {
          const totalCreeps = Object.values(creepConfigs).reduce(
            (acc, creep) => acc + creep.creepCount,
            0
          );
          const totalInSource = Object.values(
            availableTargets[accTargetId]
          ).reduce((acc, creep) => acc + creep.creepCount, 0);

          if (totalCreeps < totalInSource) {
            return targetId;
          }
          return accTargetId;
        }, Object.keys(availableTargets)[0] as Id<T>);

        if (
          availableTargets[leastAssignedTargetId][
            `${cc.creepType}:${cc.creepSize ?? 'default'}`
          ]
        ) {
          availableTargets[leastAssignedTargetId][
            `${cc.creepType}:${cc.creepSize ?? 'default'}`
          ].creepCount++;
        } else {
          availableTargets[leastAssignedTargetId][
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
      ...(Object.entries(availableTargets) as [Id<T>, CreepsRecord][])
        .filter(
          ([, target]) =>
            Object.values(target).reduce((acc, v) => acc + v.creepCount, 0) > 0
        )
        .map(([targetId, creeps]): IntentAction => {
          const totalCreeps = Object.values(creeps).reduce(
            (acc, v) => acc + v.creepCount,
            0
          );
          const origTarget = targets.find((t) => t.main === targetId);
          return {
            id: this.getTaskKey(taskType, totalCreeps, targetId),
            taskType,
            targetId,
            creeps,
            totalCreeps,
            subTargetId: origTarget?.sub,
            targetRoom: origTarget?.targetRoom,
            data: origTarget?.data,
          };
        })
    );

    return actions;
  }
  protected abstract getAssignedCreeps(): CreepConfig[];
  public abstract run(): IntentResponse;
}
