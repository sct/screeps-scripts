import { Kouhai } from 'creeps/kouhai';
import { Shachou } from 'shachou';
import { BuildTask } from 'tasks/build';
import { DefendTask } from 'tasks/defend';
import { HarvestTask } from 'tasks/harvest';
import { RepairTask } from 'tasks/repair';
import { ReserveTask } from 'tasks/reserve';
import { ScoutTask } from 'tasks/scout';
import { TaskType } from 'tasks/task';
import { TransportTask } from 'tasks/transport';
import { UpgradeTask } from 'tasks/upgrade';
import log from 'utils/logger';
import { DirectiveAction } from './directives/directive';
import { RoomDirector } from './roomDirector';

export type CreepType =
  | 'drone'
  | 'transport'
  | 'scout'
  | 'reserver'
  | 'defender';
export type CreepSize =
  | 'emergency'
  | 'default'
  | 'standard'
  | 'double'
  | 'distance';

const CreepSetups: Record<
  CreepType,
  { [K in CreepSize]?: BodyPartConstant[] }
> = {
  drone: {
    emergency: [WORK, CARRY, MOVE],
    default: [WORK, WORK, CARRY, MOVE],
    standard: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE],
    double: [
      WORK,
      WORK,
      WORK,
      WORK,
      WORK,
      WORK,
      WORK,
      WORK,
      WORK,
      WORK,
      CARRY,
      CARRY,
      MOVE,
      MOVE,
      MOVE,
    ],
    distance: [
      WORK,
      WORK,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
    ],
  },
  transport: {
    emergency: [CARRY, CARRY, CARRY, MOVE, MOVE],
    default: [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    standard: [
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
    ],
    double: [
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
    ],
  },
  scout: {
    emergency: [MOVE],
    default: [MOVE],
    standard: [MOVE, MOVE],
    double: [MOVE, MOVE, MOVE, MOVE],
  },
  reserver: {
    default: [CLAIM, CLAIM, MOVE, MOVE, MOVE],
  },
  defender: {
    default: [
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      ATTACK,
      ATTACK,
      ATTACK,
      ATTACK,
      ATTACK,
      HEAL,
      TOUGH,
      TOUGH,
      TOUGH,
      TOUGH,
      TOUGH,
      TOUGH,
      TOUGH,
    ],
  },
};

export class CreepDirector {
  private shachou: Shachou;

  public constructor(shachou: Shachou) {
    this.shachou = shachou;
  }

  public spawnCreep(
    room: Room,
    spawn: StructureSpawn,
    type: CreepType,
    size: CreepSize = 'default'
  ): void {
    const creepName = `${type}-${Game.time}`;
    const creepSetup = CreepSetups[type][size];
    if (
      creepSetup &&
      spawn.spawnCreep(creepSetup, creepName, {
        memory: {
          type,
          size,
          room: room.name,
          working: false,
        },
      }) === OK
    ) {
      log.info(
        `Spawning new creep. Name: ${creepName} Type: ${type} Cost: ${creepSetup.reduce(
          (acc, v) => acc + BODYPART_COST[v],
          0
        )}`,
        {
          label: 'Creep Director',
        }
      );
    }
  }

  public getKouhai(): Kouhai[] {
    return Object.values(Game.creeps).map((creep) => new Kouhai(creep));
  }

  public getActiveKouhai(): Kouhai[] {
    return this.getKouhai().filter((kouhai) => kouhai.activeTask);
  }

  public getInactiveKouhai(): Kouhai[] {
    return this.getKouhai().filter((kouhai) => !kouhai.activeTask);
  }

  public getActiveKouhaiInRoom(room: Room): Kouhai[] {
    return this.getActiveKouhai().filter(
      (kouhai) => kouhai.memory.room === room.name
    );
  }

  public getInactiveKouhaiInRoom(room: Room): Kouhai[] {
    return this.getInactiveKouhai().filter(
      (kouhai) => kouhai.memory.room === room.name
    );
  }

  public assignCreeps(
    roomDirector: RoomDirector,
    action: DirectiveAction
  ): void {
    Object.values(action.creeps).forEach((creepConfig) => {
      const workingThisType = this.getActiveKouhaiInRoom(
        roomDirector.room
      ).filter(
        (kouhai) =>
          kouhai.memory.activeTask?.taskKey === action.id &&
          kouhai.memory.size === (creepConfig.creepSize ?? 'default') &&
          kouhai.memory.type === creepConfig.creepType
      ).length;

      if (workingThisType < creepConfig.creepCount) {
        const difference = creepConfig.creepCount - workingThisType;
        let remaining = difference;
        [...Array(difference).keys()].forEach(() => {
          const unassignedCreep = this.getInactiveKouhaiInRoom(
            roomDirector.room
          ).find(
            (kouhai) =>
              kouhai.memory.type === creepConfig.creepType &&
              kouhai.memory.size === (creepConfig.creepSize ?? 'default')
          );

          if (unassignedCreep) {
            unassignedCreep.type = creepConfig.creepType;
            unassignedCreep.size = creepConfig.creepSize ?? 'default';
            unassignedCreep.activeTask = {
              taskKey: action.id,
              taskType: action.taskType,
              targetId: action.targetId,
              subTargetId: action.subTargetId,
              targetRoom: action.targetRoom,
              data: action.data ?? {},
            };
            log.debug('Assigned creep', {
              key: unassignedCreep.activeTask.taskKey,
              taskType: unassignedCreep.activeTask.taskType,
            });
            remaining -= 1;
          }
        });

        if (remaining) {
          const spawn = Game.getObjectById(roomDirector.spawns[0]);
          if (
            spawn &&
            !spawn.spawning &&
            (roomDirector.memory.lastSpawn ?? 0) + 21 < Game.time
          ) {
            this.spawnCreep(
              roomDirector.room,
              spawn,
              creepConfig.creepType,
              creepConfig.creepSize
            );
            roomDirector.memory.lastSpawn = Game.time;
          }
        }
      }
    });
  }

  public run(): void {
    this.getKouhai().forEach((activeKouhai) => {
      switch (activeKouhai.activeTask?.taskType) {
        case TaskType.Upgrade: {
          const task = new UpgradeTask(activeKouhai);
          task.run();
          break;
        }
        case TaskType.Build: {
          const task = new BuildTask(
            activeKouhai,
            activeKouhai.activeTask.targetId
          );
          task.run();
          break;
        }
        case TaskType.Repair: {
          const task = new RepairTask(
            activeKouhai,
            activeKouhai.activeTask.targetId
          );
          task.run();
          break;
        }
        case TaskType.Transport: {
          const task = new TransportTask(
            activeKouhai,
            activeKouhai.activeTask.targetId,
            activeKouhai.activeTask.subTargetId,
            activeKouhai.activeTask.taskKey.startsWith('transportToController')
          );
          task.run();
          break;
        }
        case TaskType.Scout: {
          const task = new ScoutTask(activeKouhai);
          task.run();
          break;
        }
        case TaskType.Reserve: {
          const task = new ReserveTask(activeKouhai);
          task.run();
          break;
        }
        case TaskType.Defend: {
          const task = new DefendTask(activeKouhai);
          task.run();
          break;
        }
        case TaskType.Mine:
        case TaskType.Harvest:
        default: {
          const task = new HarvestTask(
            activeKouhai,
            activeKouhai.activeTask?.targetId,
            activeKouhai.activeTask?.data?.x &&
            activeKouhai.activeTask?.data?.y &&
            activeKouhai.activeTask?.targetRoom
              ? new RoomPosition(
                  activeKouhai.activeTask.data.x as number,
                  activeKouhai.activeTask.data.y as number,
                  activeKouhai.activeTask.targetRoom
                )
              : undefined
          );
          task.run();
          break;
        }
      }
    });

    // Clean up any creeps that no longer have an active directive
    _.forEach(this.getActiveKouhai(), (kouhai) => {
      if (
        kouhai.activeTask &&
        !this.shachou.roomDirectors[
          kouhai.memory.room
        ].memory.activeDirectiveActions.find(
          (action) => kouhai.activeTask?.taskKey === action.id
        )
      ) {
        log.debug('Clearing dead task for creep', {
          id: kouhai.id,
          task: kouhai.activeTask?.taskKey,
        });
        kouhai.activeTask = null;
      }
    });
  }
}
