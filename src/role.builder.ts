export const builder = {
  run: (creep: Creep) => {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.working = false;
      creep.say("🔄 harvest");
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
      creep.memory.working = true;
      creep.say("🚧 build");
    }

    if (creep.memory.working) {
      const constructionSite = creep.pos.findClosestByPath(
        FIND_CONSTRUCTION_SITES
      );
      const damagedStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure => structure.hits < structure.hitsMax
      });

      const damagedWalls = creep.room.find(FIND_STRUCTURES, {
        filter: structure => structure.hits < structure.hitsMax
      });

      const mostDamagedWall = damagedWalls.reduce(
        (a: AnyStructure | undefined, wall) => {
          if (!a) {
            return wall;
          } else {
            return a.hits < wall.hits ? a : wall;
          }
        },
        undefined
      );

      if (
        constructionSite &&
        creep.build(constructionSite) == ERR_NOT_IN_RANGE
      ) {
        creep.travelTo(constructionSite);
      } else if (
        mostDamagedWall &&
        creep.repair(mostDamagedWall) == ERR_NOT_IN_RANGE
      ) {
        creep.travelTo(mostDamagedWall);
      }
    } else {
      const source = creep.pos.findClosestByPath(FIND_SOURCES);
      if (source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.travelTo(source);
      }
    }
  }
};
