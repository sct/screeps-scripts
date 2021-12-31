import { CreepFactory, CreepWrapper, Role } from "./creepWrapper";

interface HarvesterMemory {
  role: Role.Harvester;
  harvestSource?: string;
}

export class HarvesterCreep<T> extends CreepWrapper<T & HarvesterMemory> {
  protected static role = Role.Harvester;
  protected static parts: BodyPartConstant[] = [
    WORK,
    WORK,
    CARRY,
    CARRY,
    CARRY,
    MOVE,
    MOVE
  ];

  public static spawn(
    room: string,
    spawn: string,
    harvestSource?: string
  ): void {
    this.createCreep(room, spawn, harvestSource ? { harvestSource } : {});
  }

  public currentStoredEnergy() {
    return this.creep.store[RESOURCE_ENERGY];
  }

  public getClosestSource() {
    return this.creep.pos.findClosestByPath(FIND_SOURCES);
  }

  public getClosestContainerEnergy(): AnyStructure | undefined {
    const containers = this.creep.room.find<
      FIND_STRUCTURES,
      StructureContainer
    >(FIND_STRUCTURES, {
      filter: structure =>
        structure.structureType === STRUCTURE_CONTAINER &&
        structure.store.energy > 0
    });

    return containers.reduce((a: StructureContainer | undefined, container) => {
      if (!a) {
        return container;
      } else {
        return a.store.energy > container.store.energy ? a : container;
      }
    }, undefined);
  }

  public moveAndHarvest(source: Source | Mineral<MineralConstant> | Deposit) {
    if (this.creep.harvest(source) === ERR_NOT_IN_RANGE) {
      this.creep.travelTo(source);
    }
  }

  public moveAndCollectEnergy(targetStructure: AnyStructure) {
    if (
      this.creep.withdraw(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(targetStructure);
    }
  }

  public transferToStorage() {
    const closestSpawn = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure =>
        (structure.structureType === STRUCTURE_EXTENSION ||
          structure.structureType === STRUCTURE_SPAWN) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    const closestStorage = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure =>
        (structure.structureType === STRUCTURE_CONTAINER ||
          structure.structureType === STRUCTURE_STORAGE ||
          structure.structureType === STRUCTURE_TOWER) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (
      closestSpawn &&
      this.creep.transfer(closestSpawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(closestSpawn);
    } else if (
      closestStorage &&
      this.creep.transfer(closestStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE
    ) {
      this.creep.travelTo(closestStorage);
    }
  }

  public run() {
    if (this.memory.working && this.currentStoredEnergy() === 0) {
      this.memory.working = false;
      this.creep.say("🔄 harvest");
    }

    if (!this.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.memory.working = true;
      this.creep.say("📦 storing energy");
    }

    if (this.memory.working) {
      this.transferToStorage();
    } else {
      const closestSource = this.getClosestSource();

      if (closestSource) {
        this.moveAndHarvest(closestSource);
      }
    }
  }
}
