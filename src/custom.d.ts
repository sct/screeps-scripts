interface Creep {
  travelTo(destination: { pos: RoomPosition } | RoomPosition, ops?: any): any;
}

interface Structure {
  around(): { x: number; y: number }[];
}
