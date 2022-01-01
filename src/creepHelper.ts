import { BuilderCreep } from "creeps/builder";
import { CreepWrapper, Role } from "creeps/creepWrapper";
import { HarvesterCreep } from "creeps/harvester";
import { UpgraderCreep } from "creeps/upgrader";

const creepWorkforce: Record<Role, number> = {
  [Role.Harvester]: 10,
  [Role.Builder]: 8,
  [Role.Upgrader]: 12
};

export const spawnCreep = (targetSpawn: string, room: string, role: Role): void => {
  const newName = `${role}-${Game.time}`;

  if (
    Game.spawns[targetSpawn].spawnCreep([WORK, CARRY, MOVE], newName, {
      memory: { role, room, working: false }
    }) === OK
  ) {
    console.log(`Spawning new ${role} named ${newName}`);
  }
};

export const creepSpawner = (room: string, spawner: string): void => {
  (Object.entries(creepWorkforce) as [Role, number][])
    .filter(
      ([role, count]) =>
        _.filter(Game.creeps, creep => creep.memory.role === role).length <
        count
    )
    .forEach(([role]) => {
      switch (role) {
        case Role.Harvester:
          HarvesterCreep.spawn(room, spawner);
          break;
        case Role.Builder:
          BuilderCreep.spawn(room, spawner);
          break;
        case Role.Upgrader:
          UpgraderCreep.spawn(room, spawner);
          break;
      }
    });

  const spawningCreep = CreepWrapper.getSpawningCreep("Main");

  if (spawningCreep) {
    Game.spawns.Main.room.visual.text(
      "🛠️" + spawningCreep.memory.role,
      Game.spawns.Main.pos.x + 1,
      Game.spawns.Main.pos.y,
      { align: "left", opacity: 0.8 }
    );
  }
};
