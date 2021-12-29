export enum Role {
  Upgrader = "upgrader",
  Builder = "builder",
  Harvester = "harvester"
}

export interface CreepFactory<T> {
  spawn(memory: T & CreepMemory): InstanceType<typeof CreepWrapper>;
}

export abstract class CreepWrapper<T> {
  protected static role: Role;
  protected static parts: BodyPartConstant[] = [WORK, CARRY, MOVE];

  public static nameCreep() {
    return `${this.role}-${Game.time}`;
  }

  public static createCreep(
    room: string,
    targetSpawn: string,
    memory: Record<string, string | number> = {}
  ) {
    const newName = this.nameCreep();
    if (Game.spawns[targetSpawn].spawnCreep(this.parts, newName, {
      memory: {
        role: this.role,
        room: room,
        working: false,
        ...memory
      }
    }) == OK) {
      console.log(`Spawning new ${this.role} named ${newName}`);
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

  constructor(creep: Creep) {
    this.creep = creep;
  }

  get memory(): typeof this.creep.memory & T {
    return this.creep.memory as typeof this.creep.memory & T;
  }

  get working(): boolean {
    return this.memory.working;
  }

  set working(value: boolean) {
    this.memory.working = value;
  }
}
