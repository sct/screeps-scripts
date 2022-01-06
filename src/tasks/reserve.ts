import { DEFAULT_SIGN, Task, TaskType } from './task';

export class ReserveTask extends Task {
  public taskType: TaskType = TaskType.Reserve;

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
    // Sign the controller ;)
    if (
      this.kouhai.creep.room.controller &&
      this.kouhai.creep.room.controller.sign?.text !== DEFAULT_SIGN
    ) {
      this.signController();
    }
    // If we are in the room, reserve the controller
    else if (
      this.kouhai.creep.room.controller &&
      this.kouhai.creep.reserveController(this.kouhai.creep.room.controller) ===
        ERR_NOT_IN_RANGE
    ) {
      this.kouhai.creep.travelTo(this.kouhai.creep.room.controller);
    }
  }
}
