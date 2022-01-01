import { Role } from 'creeps/creepWrapper';
import log from 'utils/logger';
import { RoomDirector } from './roomDirector';

export type CreepType = 'drone';
export type CreepSize = 'emergency' | 'default' | 'standard';

const CreepSetups: Record<CreepType, Record<CreepSize, BodyPartConstant[]>> = {
  drone: {
    emergency: [WORK, CARRY, MOVE],
    default: [WORK, WORK, CARRY, MOVE],
    standard: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE],
  },
};

export class CreepDirector {
  private roomDirector: RoomDirector;

  public static PartCost: Record<BodyPartConstant, number> = {
    [MOVE]: 50,
    [WORK]: 100,
    [CARRY]: 50,
    [ATTACK]: 80,
    [RANGED_ATTACK]: 150,
    [HEAL]: 250,
    [TOUGH]: 10,
    [CLAIM]: 600,
  };

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
          room: this.roomDirector.room.name,
          working: false,
        },
      }) === OK
    ) {
      log.info(`Spawning new creep. Name: ${creepName} Type: ${type}`, {
        label: 'Creep Director',
      });
    }
  }
}
