import log from 'utils/logger';

// eslint-disable-next-line no-shadow
export enum Role {
  Upgrader = 'upgrader',
  Builder = 'builder',
  Harvester = 'harvester',
}

export abstract class CreepWrapper<T> {
  protected static role: Role;
  protected static parts: BodyPartConstant[] = [WORK, CARRY, MOVE];

  public static nameCreep(): string {
    return `${this.role}-${Game.time}`;
  }

  public static createCreep(
    room: string,
    targetSpawn: string,
    memory: Record<string, string | number> = {}
  ): void {
    const newName = this.nameCreep();
    if (
      Game.spawns[targetSpawn].spawnCreep(this.parts, newName, {
        memory: {
          role: this.role,
          room,
          working: false,
          ...memory,
        },
      }) === OK
    ) {
      log.info(`Spawning new creep. Name: ${newName} Type: ${this.role}`, {
        label: 'Creep Spawning',
      });
    }
  }

  public static getSpawningCreep(targetSpawn: string): Creep | undefined {
    const spawningName = Game.spawns[targetSpawn].spawning?.name;

    if (spawningName) {
      return Game.creeps[spawningName];
    }

    return undefined;
  }

  protected creep: Creep;

  public constructor(creep: Creep) {
    this.creep = creep;
  }

  public get memory(): typeof this.creep.memory & T {
    return this.creep.memory as typeof this.creep.memory & T;
  }

  public get working(): boolean {
    return this.memory.working;
  }

  public set working(value: boolean) {
    this.memory.working = value;
  }
}
