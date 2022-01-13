interface Coord {
  x: number;
  y: number;
}

interface Creep {
  travelTo(destination: { pos: RoomPosition } | RoomPosition, ops?: any): any;
}

interface Structure {
  around(): Coord[];
  isWalkable(): boolean;
}

interface RoomPosition {
  isWalkable(): boolean;
  isVisible(): boolean;
  isEdge(): boolean;
  coordName(): string;
  getMultiRoomRangeTo(pos: RoomPosition): number;
  roomCoords(): Coord;
  room(): Room;
  around(): Coord[];
}

interface ConstructionSite {
  isWalkable(): boolean;
}

interface Source {
  around(): Coord[];
}
