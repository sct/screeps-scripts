import { Role } from "./creepWrapper";
import { HarvesterCreep } from "./harvester";

interface BuilderCreepMemory {
  role: Role.Builder;
}

export class BuilderCreep extends HarvesterCreep<BuilderCreepMemory> {
  protected static role = Role.Builder;
  protected static parts: BodyPartConstant[] = [WORK, CARRY, CARRY, MOVE];

  public getClosestConstructionSite(): ConstructionSite<BuildableStructureConstant> | null {
    return this.creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  }

  public getDamagedStructures(): AnyStructure[] {
    return this.creep.room.find(FIND_STRUCTURES, {
      filter: structure =>
        structure.hits < structure.hitsMax &&
        structure.structureType !== STRUCTURE_WALL
    });
  }

  public getMostDamagedStructure(): AnyStructure | undefined {
    const damagedStructures = this.getDamagedStructures();

    return damagedStructures.reduce(
      (a: AnyStructure | undefined, structure) => {
        if (!a) {
          return structure;
        } else {
          return a.hits < structure.hits ? a : structure;
        }
      },
      undefined
    );
  }

  public construct(
    constructionSite: ConstructionSite<BuildableStructureConstant>
  ): void {
    if (this.creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
      this.creep.travelTo(constructionSite);
    }
  }

  public repair(structure: AnyStructure): void {
    if (this.creep.repair(structure) === ERR_NOT_IN_RANGE) {
      this.creep.travelTo(structure);
    }
  }

  public run(): void {
    if (this.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.creep.memory.working = false;
      this.creep.say("🔄 harvest");
    }
    if (!this.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
      this.creep.say("🚧 build");
    }

    if (this.working) {
      const constructionSite = this.getClosestConstructionSite();
      const damagedStructure = this.getMostDamagedStructure();

      if (constructionSite) {
        this.construct(constructionSite);
      } else if (damagedStructure) {
        this.repair(damagedStructure);
      }
    } else {
      const containerEnergy = this.getClosestContainerEnergy();
      const source = this.getClosestSource();
      if (containerEnergy) {
        this.moveAndCollectEnergy(containerEnergy);
      } else if (source) {
        this.moveAndHarvest(source);
      }
    }
  }
}
