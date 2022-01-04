import { runTower } from "buildings/tower";
import { CreepDirector } from "directors/creepDirector";
import { RoomDirector } from "directors/roomDirector";

export class Shachou {
  public creepDirector: CreepDirector;
  public roomDirectors: Record<string, RoomDirector> = {};

  public constructor() {
    this.creepDirector = new CreepDirector(this);
    this.init();
  }

  public init(): void {
    // Initialize room directors
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      const roomDirector = new RoomDirector(room, this);
      this.roomDirectors[roomName] = roomDirector;
    }
  }

  public run(): void {
    for (const roomName in this.roomDirectors) {
      const roomDirector = this.roomDirectors[roomName];
      roomDirector.run();

      const towers = roomDirector.room.find<FIND_STRUCTURES, StructureTower>(
        FIND_STRUCTURES,
        {
          filter: (structure) => structure.structureType === STRUCTURE_TOWER,
        }
      );

      towers.forEach((tower) => {
        runTower(tower);
      });
    }

    this.creepDirector.run();
  }
}
