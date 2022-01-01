/* eslint-disable @typescript-eslint/no-namespace */
import { runTower } from 'buildings/tower';
import { Role } from 'creeps/creepWrapper';
import { CreepType } from 'directors/creepDirector';
import { RoomDirector } from 'directors/roomDirector';
import { ErrorMapper } from 'utils/ErrorMapper';
import 'utils/traveler';

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    role: Role;
    type?: CreepType;
    room: string;
    working: boolean;
    harvestTarget?: string;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  // console.log(`Current game tick is ${Game.time}`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    const roomDirector = new RoomDirector(room);
    roomDirector.run();

    const spawns = room.find(FIND_MY_SPAWNS);

    // spawns.forEach((spawn) => {
    //   creepSpawner(roomName, spawn.name);
    // });
  }

  const towerId = '61cba8ca4b54e4004cb15463' as Id<StructureTower>;
  const onlyTower = Game.getObjectById(towerId);

  if (onlyTower) {
    runTower(onlyTower);
  }

  // Move harvesters to source and return to spawn
  // for (const creepName in Game.creeps) {
  //   const creep = Game.creeps[creepName];

  //   switch (creep.memory.role) {
  //     case Role.Harvester: {
  //       const harvester = new HarvesterCreep(creep);
  //       harvester.run();
  //       break;
  //     }
  //     case Role.Upgrader: {
  //       const upgrader = new UpgraderCreep(creep);
  //       upgrader.run();
  //       break;
  //     }
  //     case Role.Builder: {
  //       const builder = new BuilderCreep(creep);
  //       builder.run();
  //       break;
  //     }
  //   }
  // }
});
