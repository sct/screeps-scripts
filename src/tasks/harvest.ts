import { Kouhai } from 'creeps/kouhai';
import { Task, TaskType } from './task';

export class HarvestTask extends Task<Source> {
  public taskType = TaskType.Harvest;
  protected remotePosition: RoomPosition | undefined;

  public constructor(
    kouhai: Kouhai,
    targetId?: Id<Source>,
    remotePosition?: RoomPosition
  ) {
    super(kouhai, targetId);
    this.remotePosition = remotePosition;
  }

  public transferToStorage(preferStorage = false): void {
    const isMining = this.kouhai.memory.activeTask?.taskKey.startsWith('mine');
    if (this.kouhai.memory.room !== this.kouhai.creep.room.name) {
      const exitDir = this.kouhai.creep.room.findExitTo(
        this.kouhai.memory.room
      );
      if (exitDir !== -2 && exitDir !== -10) {
        const exit = this.kouhai.creep.pos.findClosestByRange(exitDir);
        if (exit) {
          this.kouhai.creep.travelTo(exit);
        }
      }
      return;
    }
    const closestSpawn = this.kouhai.creep.pos.findClosestByPath(
      FIND_STRUCTURES,
      {
        filter: (structure) =>
          (structure.structureType === STRUCTURE_EXTENSION ||
            structure.structureType === STRUCTURE_SPAWN) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
      }
    );

    const closestStorage = this.kouhai.creep.pos.findClosestByPath(
      FIND_STRUCTURES,
      {
        filter: (structure) =>
          isMining
            ? (structure.structureType === STRUCTURE_CONTAINER ||
                structure.structureType === STRUCTURE_TERMINAL) &&
              structure.store.getFreeCapacity(RESOURCE_EXTRACT) > 0
            : (structure.structureType === STRUCTURE_CONTAINER ||
                structure.structureType === STRUCTURE_STORAGE ||
                structure.structureType === STRUCTURE_TOWER) &&
              structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
              structure.pos.findInRange(FIND_MINERALS, 3).length === 0,
      }
    );

    const tryFirst = preferStorage ? closestStorage : closestSpawn;
    const trySecond = preferStorage ? closestSpawn : closestStorage;
    if (
      tryFirst &&
      this.kouhai.creep.transfer(
        tryFirst,
        isMining ? RESOURCE_KEANIUM : RESOURCE_ENERGY
      ) === ERR_NOT_IN_RANGE
    ) {
      this.kouhai.creep.travelTo(tryFirst);
    } else if (
      trySecond &&
      this.kouhai.creep.transfer(
        trySecond,
        isMining ? RESOURCE_KEANIUM : RESOURCE_ENERGY
      ) === ERR_NOT_IN_RANGE
    ) {
      this.kouhai.creep.travelTo(trySecond);
    }
  }

  public run(): void {
    if (this.kouhai.memory.working && this.currentStore() === 0) {
      this.kouhai.memory.working = false;
      this.kouhai.creep.say('🔄 harvest');
    }

    if (
      !this.kouhai.memory.working &&
      this.kouhai.creep.store.getFreeCapacity() === 0
    ) {
      this.kouhai.memory.working = true;
      this.kouhai.creep.say('📦 storing energy');
    }

    const targetSource = this.targetId
      ? Game.getObjectById(this.targetId)
      : this.getClosestSource();

    if (this.kouhai.memory.working) {
      const containersInRange = targetSource?.pos.findInRange(
        FIND_STRUCTURES,
        3,
        {
          filter: (structure) =>
            structure.structureType === STRUCTURE_CONTAINER &&
            structure.store.getFreeCapacity() > 0,
        }
      );

      const transportersAvailable = Object.values(Game.creeps)
        .map((creep) => new Kouhai(creep))
        .some(
          (kouhai) =>
            kouhai.creep.room.name === this.kouhai.creep.room.name &&
            kouhai.activeTask?.taskType === TaskType.Transport &&
            kouhai.activeTask?.taskKey.startsWith('transportToStorage')
        );
      const preferStorage =
        (this.kouhai.creep.room.controller?.level ?? 0) >= 4 &&
        !!containersInRange?.[0] &&
        transportersAvailable;

      this.transferToStorage(preferStorage);
    } else {
      if (targetSource) {
        this.moveAndHarvest(targetSource);
      } else if (this.remotePosition) {
        // try to move to remote position
        this.kouhai.creep.travelTo(this.remotePosition);
      }
    }
  }
}
