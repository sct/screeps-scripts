RoomPosition.prototype.isVisible = function (): boolean {
  return Game.rooms[this.roomName] != undefined;
};

RoomPosition.prototype.isWalkable = function (ignoreCreeps = false): boolean {
  // Is terrain passable?
  if (
    Game.map.getRoomTerrain(this.roomName).get(this.x, this.y) ==
    TERRAIN_MASK_WALL
  )
    return false;
  if (this.isVisible()) {
    // Are there creeps?
    if (ignoreCreeps == false && this.lookFor(LOOK_CREEPS).length > 0)
      return false;
    // Are there structures?
    if (
      _.filter(this.lookFor(LOOK_STRUCTURES), (s: Structure) => !s.isWalkable)
        .length > 0
    )
      return false;
  }
  return true;
};

RoomPosition.prototype.isEdge = function (): boolean {
  return this.x === 0 || this.x === 49 || this.y === 0 || this.y === 49;
};

RoomPosition.prototype.coordName = function (): string {
  return `${this.x}:${this.y}`;
};

RoomPosition.prototype.roomCoords = function (): Coord {
  const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(this.roomName);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let x = parseInt(parsed![1], 10);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let y = parseInt(parsed![2], 10);
  if (this.roomName.includes('W')) x = -x;
  if (this.roomName.includes('N')) y = -y;
  return { x, y } as Coord;
};

RoomPosition.prototype.getMultiRoomRangeTo = function (
  pos: RoomPosition
): number {
  if (this.roomName == pos.roomName) {
    return this.getRangeTo(pos);
  } else {
    const from = this.roomCoords();
    const to = pos.roomCoords();
    const dx = Math.abs(50 * (to.x - from.x) + pos.x - this.x);
    const dy = Math.abs(50 * (to.y - from.y) + pos.y - this.y);
    return _.max([dx, dy]);
  }
};

RoomPosition.prototype.room = function () {
  return Game.rooms[this.roomName];
};

RoomPosition.prototype.around = function () {
  const positions: { x: number; y: number }[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (!(x === 0 && y === 0)) {
        positions.push({ x: this.x + x, y: this.y + y });
      }
    }
  }

  return positions;
};
