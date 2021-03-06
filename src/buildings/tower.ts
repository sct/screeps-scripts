export const runTower = (tower: StructureTower): void => {
  const target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  const repairables = tower.room.find(FIND_STRUCTURES, {
    filter: (structure) =>
      (structure.hits < structure.hitsMax &&
        structure.structureType === STRUCTURE_ROAD) ||
      (structure.structureType === STRUCTURE_RAMPART &&
        structure.hits < 10000),
  });

  const lowestHits = repairables.reduce(
    (lowest: AnyStructure | undefined, repairable) => {
      if (!lowest || repairable.hits < lowest.hits) {
        return repairable;
      } else {
        return lowest;
      }
    },
    undefined
  );

  if (target) {
    tower.attack(target);
  }
  // else if (lowestHits) {
  //   tower.repair(lowestHits);
  // }
};
