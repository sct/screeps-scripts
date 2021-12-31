export const runTower = (tower: StructureTower): void => {
  const target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  const repairables = tower.room.find(FIND_STRUCTURES, {
    filter: structure => structure.hits < structure.hitsMax
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
