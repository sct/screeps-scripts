export const harvester = {
  run: (creep: Creep) => {
    const source = creep.pos.findClosestByPath(FIND_SOURCES);

    if (source && creep.store.getFreeCapacity() > 0) {
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.travelTo(source);
      }
    } else {
      const closestStorage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure =>
          (structure.structureType === STRUCTURE_EXTENSION ||
            structure.structureType === STRUCTURE_SPAWN ||
            structure.structureType === STRUCTURE_TOWER) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });
      if (
        closestStorage &&
        creep.transfer(closestStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE
      ) {
        creep.travelTo(closestStorage);
      }
    }
  }
};
