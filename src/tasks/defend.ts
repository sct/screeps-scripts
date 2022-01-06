import { Task, TaskType } from './task';

export class DefendTask extends Task {
  public taskType: TaskType = TaskType.Defend;

  public run(): void {
    const targetRoom = this.kouhai.memory.activeTask?.targetRoom;

    if (!targetRoom) {
      return;
    }

    // If we are not in the target room, head there
    // TODO: make this work across multiple rooms
    if (targetRoom !== this.kouhai.creep.room.name) {
      const exitDir = this.kouhai.creep.room.findExitTo(targetRoom);
      if (exitDir !== -2 && exitDir !== -10) {
        const exit = this.kouhai.creep.pos.findClosestByRange(exitDir);
        if (exit) {
          this.kouhai.creep.travelTo(exit);
        }
      }
      return;
    }

    const target =
      this.kouhai.creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

    if (target) {
      if (this.kouhai.creep.attack(target) === ERR_NOT_IN_RANGE) {
        this.kouhai.creep.travelTo(target);
      }
    } else if (this.kouhai.creep.room.controller) {
      this.kouhai.creep.travelTo(this.kouhai.creep.room.controller, { range: 3 });
    }
  }
}
