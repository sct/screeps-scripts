import { Role } from 'creeps/creepWrapper';
import log from 'utils/logger';
import { RoomDirector } from './roomDirector';

export type CreepType = 'drone' | 'transport';
export type CreepSize = 'emergency' | 'default' | 'standard' | 'double';

const CreepSetups: Record<CreepType, { [K in CreepSize]: BodyPartConstant[] }> =
  {
    drone: {
      emergency: [WORK, CARRY, MOVE],
      default: [WORK, WORK, CARRY, MOVE],
      standard: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE],
      double: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
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
  };

export class CreepDirector {
  private roomDirector: RoomDirector;

  public constructor(roomDirector: RoomDirector) {
    this.roomDirector = roomDirector;
  }

  public spawnCreep(
    spawn: StructureSpawn,
    type: CreepType,
    size: CreepSize = 'default'
  ): void {
    const creepName = `${type}-${Game.time}`;
    if (
      spawn.spawnCreep(CreepSetups[type][size], creepName, {
        memory: {
          role: Role.Harvester,
          type,
          size,
          room: this.roomDirector.room.name,
          working: false,
        },
      }) === OK
    ) {
      log.info(
        `Spawning new creep. Name: ${creepName} Type: ${type} Cost: ${CreepSetups[
          type
        ][size].reduce((acc, v) => acc + BODYPART_COST[v], 0)}`,
        {
          label: 'Creep Director',
        }
      );
    }
  }
}
