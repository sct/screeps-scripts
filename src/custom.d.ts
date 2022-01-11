interface Coord {
  x: number;
  y: number;
}

interface Creep {
  travelTo(destination: { pos: RoomPosition } | RoomPosition, ops?: any): any;
}

interface Structure {
  around(): { x: number; y: number }[];
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
}

interface ConstructionSite {
  isWalkable(): boolean;
}
