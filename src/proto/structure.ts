Structure.prototype.around = function () {
  const positions: { x: number; y: number }[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (!(x === 0 && y === 0)) {
        positions.push({ x: this.pos.x + x, y: this.pos.y + y });
      }
    }
  }

  return positions;
};

Structure.prototype.isWalkable = function (): boolean {
  return (
    this.structureType === STRUCTURE_ROAD ||
    this.structureType === STRUCTURE_CONTAINER ||
    (this.structureType === STRUCTURE_RAMPART &&
      ((this as StructureRampart).my || (this as StructureRampart).isPublic))
  );
};
