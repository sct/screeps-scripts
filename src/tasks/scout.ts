import { Kouhai } from 'creeps/kouhai';
import { Task, TaskType } from './task';

export class ScoutTask extends Task {
  public taskType: TaskType = TaskType.Scout;

  public constructor(kouhai: Kouhai) {
    super(kouhai);
    _.defaults(this.kouhai.memory, {
      data: {
        currentRoom: kouhai.creep.room.name,
      },
    });
  }

  public run(): void {
    if (this.kouhai.memory.data) {
      this.kouhai.memory.data.currentRoom = this.kouhai.creep.room.name;
    }

    if (
      this.kouhai.memory.data?.currentRoom !== this.kouhai.memory.data?.lastRoom
    ) {
      const exits = this.kouhai.creep.room.find(FIND_EXIT);

      const randomExit = exits[Math.floor(Math.random() * exits.length)];
      if (!this.kouhai.memory.data) {
        this.kouhai.memory.data = {};
      }
      this.kouhai.memory.data.exitX = randomExit.x;
      this.kouhai.memory.data.exitY = randomExit.y;
      this.kouhai.memory.data.exitName = randomExit.roomName;
      this.kouhai.memory.data.lastRoom = this.kouhai.creep.room.name;
    }
    if (
      this.kouhai.memory?.data?.exitX as number >= 0 &&
      this.kouhai.memory?.data?.exitY as number >= 0 &&
      this.kouhai.memory?.data?.exitName
    ) {
      const x = this.kouhai.memory?.data?.exitX as number;
      const y = this.kouhai.memory?.data?.exitY as number;
      const roomName = this.kouhai.memory?.data?.exitName as string;
      const exitPosition = new RoomPosition(x, y, roomName);
      this.kouhai.creep.travelTo(exitPosition);
    }
  }
}
