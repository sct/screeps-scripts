import { BuilderCreep } from "creeps/builder";
import { CreepWrapper, Role } from "creeps/creepWrapper";
import { HarvesterCreep } from "creeps/harvester";
import { UpgraderCreep } from "creeps/upgrader";

export const spawnCreep = (targetSpawn: string, room: string, role: Role) => {
  const newName = `${role}-${Game.time}`;

  if (
    Game.spawns[targetSpawn].spawnCreep([WORK, CARRY, MOVE], newName, {
      memory: { role, room, working: false }
    }) == OK
  ) {
    console.log(`Spawning new ${role} named ${newName}`);
  }
};

export const creepSpawner = () => {
  const HARVESTER_COUNT = 6;
  const BUILDER_COUNT = 5;
  const UPGRADER_COUNT = 12;

  const harvesters = _.filter(
    Game.creeps,
    creep => creep.memory.role === "harvester"
  );
  const builders = _.filter(
    Game.creeps,
    creep => creep.memory.role === "builder"
  );
  const upgraders = _.filter(
    Game.creeps,
    creep => creep.memory.role === "upgrader"
  );

  if (harvesters.length <= HARVESTER_COUNT) {
    HarvesterCreep.spawn("W5N8", "Main");
  } else if (builders.length <= BUILDER_COUNT) {
    BuilderCreep.spawn("W5N8", "Main");
  } else if (upgraders.length <= UPGRADER_COUNT) {
    UpgraderCreep.spawn("W5N8", "Main");
  }

  const spawningCreep = CreepWrapper.getSpawningCreep("Main");

  if (spawningCreep) {
    Game.spawns["Main"].room.visual.text(
      "🛠️" + spawningCreep.memory.role,
      Game.spawns["Main"].pos.x + 1,
      Game.spawns["Main"].pos.y,
      { align: "left", opacity: 0.8 }
    );
  }
};
