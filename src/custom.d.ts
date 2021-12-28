interface Creep {
  travelTo(destination: { pos: RoomPosition } | RoomPosition, ops?: any): any;
}
