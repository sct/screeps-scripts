export const upgrader = {
  run: (creep: Creep) => {

    if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.working = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
      creep.memory.working = true;
      creep.say('🚧 upgrade');
    }

    if (creep.memory.working && creep.room.controller) {
      if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.travelTo(creep.room.controller);
      }
    } else {
      const source = creep.pos.findClosestByPath(FIND_SOURCES);
      if (source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.travelTo(source);
      }
    }
  }
};
