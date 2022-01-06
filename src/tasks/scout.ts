import { Kouhai } from 'creeps/kouhai';
import { Task, TaskType } from './task';

interface ScoutTaskData {
  currentRoom: string;
  lastRoom?: string;
  exitX: number;
  exitY: number;
  exitName: string;
}

export class ScoutTask extends Task {
  public taskType: TaskType = TaskType.Scout;

  public constructor(kouhai: Kouhai) {
    super(kouhai);
    if (this.kouhai.memory.activeTask) {
      _.defaults(this.kouhai.memory.activeTask, {
        data: {
          currentRoom: kouhai.creep.room.name,
        },
      });
    }
  }

  public getTaskData(): ScoutTaskData {
    return this.kouhai.getTaskData<ScoutTaskData>();
  }

  public setTaskData(data: Partial<ScoutTaskData>): void {
    this.kouhai.setTaskData<ScoutTaskData>(data);
  }

  public run(): void {
    const taskData = this.getTaskData();

    taskData.currentRoom = this.kouhai.creep.room.name;
    this.setTaskData({ currentRoom: this.kouhai.creep.room.name });

    if (taskData.currentRoom !== taskData.lastRoom) {
      const exits = this.kouhai.creep.room.find(FIND_EXIT);

      const randomExit = exits[Math.floor(Math.random() * exits.length)];

      taskData.exitX = randomExit.x;
      taskData.exitY = randomExit.y;
      taskData.exitName = randomExit.roomName;
      taskData.lastRoom = this.kouhai.creep.room.name;
      this.kouhai.setTaskData<ScoutTaskData>(taskData);
    }
    if (taskData.exitX >= 0 && taskData.exitY >= 0 && taskData.exitName) {
      const x = taskData.exitX;
      const y = taskData.exitY;
      const roomName = taskData.exitName;
      const exitPosition = new RoomPosition(x, y, roomName);
      this.kouhai.creep.travelTo(exitPosition);
    }
  }
}
