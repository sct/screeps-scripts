ConstructionSite.prototype.isWalkable = function (): boolean {
  return (
    this.structureType == STRUCTURE_ROAD ||
    this.structureType == STRUCTURE_CONTAINER ||
    this.structureType == STRUCTURE_RAMPART
  );
};
