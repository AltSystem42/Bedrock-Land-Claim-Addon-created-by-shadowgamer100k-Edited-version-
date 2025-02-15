import {
  world,
  system,
  BlockVolumeBase,
  BlockVolume,
} from "@minecraft/server";
import Vector3 from "./vector.js";
export class ProtectedAreas {
  constructor() {
    if (!world.getDynamicProperty("protectedAreas")) {
      world.setDynamicProperty("protectedAreas", JSON.stringify([]));
    }
    if (!world.getDynamicProperty("protectedAreasAdmins")) {
      world.setDynamicProperty("protectedAreasAdmins", JSON.stringify([]));
    }
  }

  //GET

  getProtectedAreas() {
    return JSON.parse(world.getDynamicProperty("protectedAreas"));
  }

  getArea({ id }) {
    const protectedAreas = this.getProtectedAreas();
    return protectedAreas.find((area) => area.id == id);
  }

  getAreaWhitelist({ id }) {
    const areas = this.getProtectedAreas();
    const area = areas.find((area) => area.id === id);
    return area ? area.whitelist : undefined;
}


  getAllAreaKeys() {
    const protectedAreas = this.getProtectedAreas();
    return protectedAreas.map((area) => area.key);
  }

  getAdmins() {
    return JSON.parse(world.getDynamicProperty("protectedAreasAdmins"));
  }

  //SET
  areaWhitelistAdd({ id, player }) {
    const whitelist = this.getAreaWhitelist({ id: id });
    if (whitelist) {
        const isDuplicated = whitelist.some((name) => name === player);
        if (!isDuplicated) {
            whitelist.push(player);
            this.updateAreaWhitelist({ id, data: whitelist });
            console.warn(`§b${player}§f §eadded to ${id} whitelist!§f`);
        }
    } else {
        // If the whitelist is undefined, initialize it with the player
        const newWhitelist = [player];
        this.updateAreaWhitelist({ id, data: newWhitelist });
        console.warn(`§b${player}§f §eadded to ${id} whitelist!§f`);
    }
}


  

  addAdmin({ player }) {
    const admins = this.getAdmins();
    const isInAdminList = admins.some((admin) => admin == player);
    if (!isInAdminList) {
      admins.push(player);
      console.warn(`§b${player}§f §eadded to the admins list!`);
      this.updateAdmins({ data: admins });
    }
  }

  getAreaNameByKey({ key }) {
    const protectedAreas = this.getProtectedAreas();
    const area = protectedAreas.find((area) => area.key == key);
    return area ? area.id : null;
  }

  getAreaDimension({ id }) {
    const protectedAreas = this.getProtectedAreas();
    const area = protectedAreas.find((area) => area.id == id);
    return area.dimension;
  }

  setArea({ name, from, to, owner, originalcr, key, dimension, areaOptions }) {
    const protectedAreas = this.getProtectedAreas();
    const hasDuplicatedId = protectedAreas.find((area) => area.id === name);
    if (hasDuplicatedId) {
        console.error(`§b${name}§f §eis already in use, try another area name!`);
        return;
    }

    if (from instanceof Vector3 && to instanceof Vector3) {
        const newArea = {
            id: name,
            whitelist: [],
            from: { x: from.x, y: from.y, z: from.z },
            to: { x: to.x, y: to.y, z: to.z },
            owner,
            originalcr: { x: originalcr.x, y: originalcr.y, z: originalcr.z },
            key,
            dimension,  // Ensure dimension data is saved here
            areaOptions: { kickPlayers: false }  // Store areaOptions here, default to empty object if not provided
        };

        const hasIntersection = protectedAreas.some(
            (area) =>
                new BlockVolume(area.from, area.to).intersects(
                    new BlockVolume(newArea.from, newArea.to)
                ) === 2 && area.dimension === newArea.dimension.id
        );

        if (!hasIntersection) {
            protectedAreas.push(newArea);
            this.update({ data: protectedAreas });
            console.warn(`§b${name}§f §eadded to protected areas!§f`);
        } else {
            console.warn(`§b${name}§f §ecan't be created because it intersects with another area boundary!`);
        }
    } else {
        console.error(`§eParams not match to the required param types! expected§f §bVector3§f`);
    }
}


    

  //UPDATE

  update({ data }) {
    const stringify = JSON.stringify(data);
    world.setDynamicProperty("protectedAreas", stringify);
  }

  updateAdmins({ data }) {
    const stringify = JSON.stringify(data);
    world.setDynamicProperty("protectedAreasAdmins", stringify);
  }

  updateAreaWhitelist({ id, data }) {
    const protectedAreas = this.getProtectedAreas();
    const area = protectedAreas.find((area) => area.id == id);
    if (area) {
      area.whitelist = data;
      this.update({ data: protectedAreas });
    }
  }

  //DELETE

  deleteArea({ id }) {
    const protectedAreas = this.getProtectedAreas();
    const index = protectedAreas.findIndex((area) => area.id == id);
    if (index > -1) {
      const removedArea = protectedAreas.splice(index, 1)[0].id;
      console.warn(`§b${removedArea}§f §edeleted from Protected Areas§f`);
      this.update({ data: protectedAreas });
    }
  }

  deleteAreaByKey({ key }) {
    const protectedAreas = this.getProtectedAreas();
    const index = protectedAreas.findIndex((area) => area.key == key);
    if (index > -1) {
      const removedArea = protectedAreas.splice(index, 1)[0]; // Remove the area object
      console.warn(`§b${removedArea.id}§f §edeleted from Protected Areas§f`); // Access the id property
      this.update({ data: protectedAreas });
    }
  }

  deleteAllAreas() {
    const protectedAreas = this.getProtectedAreas();
    protectedAreas.splice(0);
    console.warn("§eAll areas has been deleted!");
    this.update({ data: protectedAreas });
  }

  clearAreaWhitelist({ id }) {
    const whitelist = this.getAreaWhitelist({ id });
    if (whitelist) {
      whitelist.splice(0);
      console.warn(`§b${key}§f §ewhitelist has been cleared!`);
      this.updateAreaWhitelist({ id, data: whitelist });
    }
  }


  removeAdmin({ player }) {
    const admins = this.getAdmins();
    const isInAdminList = admins.some((admin) => admin == player);
    if (isInAdminList) {
      const index = admins.findIndex((admin) => admin == player);
      if (index > -1) {
        admins.splice(index, 1);
        console.warn(`§b${player}§f §eremoved from admins list!`);
        this.updateAdmins({ data: admins });
      }
    }
  }
  // Within the ProtectedAreas class

  updateAreaOptions({ id, areaOptions }) {
    const protectedAreas = this.getProtectedAreas();
    const area = protectedAreas.find((area) => area.id === id);
    
    if (area) {
      if (areaOptions && Object.keys(areaOptions).length > 0) {
        // Update each option in the area based on the provided options object
        for (const [key, value] of Object.entries(areaOptions)) {
          // Ensure the options object exists before updating
          area.areaOptions[key] = value;
        }
        this.update({ data: protectedAreas });
        console.warn(`Options for area §b${id}§f have been updated.`);
      } else {
        console.warn(`No options provided to update for area §b${id}§f.`);
      }
    } else {
      console.warn(`Area with id §b${id}§f not found.`);
    }
  }
  

  //GET AREA OPTIONS
  getAreaOptions({ id }) {
    const protectedAreas = this.getProtectedAreas();
    const area = protectedAreas.find((area) => area.id === id);
    return area ? area.areaOptions : null;
  }


  removeAllAdmins() {
    const admins = this.getAdmins();
    admins.splice(0);
    this.updateAdmins({ data: admins });
    console.warn(`§eAdmins list cleared!§f`);
  }

  areaWhitelistRemove({ id, player }) {
    const protectedAreas = this.getProtectedAreas();
    const area = protectedAreas.find((area) => area.id === id);
    
    if (area && area.whitelist.length > 0) {
        const index = area.whitelist.findIndex((name) => name === player);
        
        if (index > -1) {
            area.whitelist.splice(index, 1);
            this.updateAreaWhitelist({ id, data: area.whitelist });
            console.warn(
                `§b${player}§f §eremoved from§f §b${id}§f §ewhitelist!§f`
            );
        } else {
            console.warn(`Player ${player} not found in the whitelist of area ${id}.`);
        }
    } else {
        console.warn(`No whitelist found for area ${id}.`);
    }
}


}

class Area {
  constructor(AreaBox) {
    this.left = Math.min(AreaBox.from.x, AreaBox.to.x);
    this.right = Math.max(AreaBox.from.x, AreaBox.to.x);
    this.back = Math.min(AreaBox.from.z, AreaBox.to.z);
    this.front = Math.max(AreaBox.from.z, AreaBox.to.z);
    this.bottom = Math.min(AreaBox.from.y, AreaBox.to.y);
    this.top = Math.max(AreaBox.from.y, AreaBox.to.y);
  }
}

export class AreaUtils {
  static isInside(BlockLocation, Area) {
    if (
      BlockLocation.x >= Area.left &&
      BlockLocation.x <= Area.right &&
      BlockLocation.z <= Area.front &&
      BlockLocation.z >= Area.back &&
      BlockLocation.y >= Area.bottom &&
      BlockLocation.y <= Area.top
    ) {
      return true;
    } else return false;
  }

  static getAreaFromBlockLocation(BlockLocation, AreaArray) {
    this.area = AreaArray.find(
      (area) =>
        BlockLocation.x >= new Area(area).left &&
        BlockLocation.x <= new Area(area).right &&
        BlockLocation.z <= new Area(area).front &&
        BlockLocation.z >= new Area(area).back &&
        BlockLocation.y >= new Area(area).bottom &&
        BlockLocation.y <= new Area(area).top
    );

    if (this.area) {
      return this.area;
    } else return undefined;
  }

  static intersects(AreaA, AreaB) {
    if (
      AreaA.right < AreaB.left ||
      AreaA.left > AreaB.right ||
      AreaA.front < AreaB.back ||
      AreaA.back > AreaB.front ||
      AreaA.top < AreaB.bottom ||
      AreaA.bottom > AreaB.top
    ) {
      return false;
    } else return true;
  }
}

const protectedAreas = new ProtectedAreas();

function getBlockFromFace(block, face) {
  switch (face) {
    case "Up": {
      return block.above();
    }
    case "Down": {
      return block.below();
    }
    case "North": {
      return block.north();
    }
    case "South": {
      return block.south();
    }
    case "East": {
      return block.east();
    }
    case "West": {
      return block.west();
    }
  }
}

function handlePlayerInteractWithBlocks({ player, block, data }) {
  const areas = protectedAreas.getProtectedAreas();

  const blockInsideProtectedArea = areas.some((area) =>
    AreaUtils.isInside(block.location, new Area(area)) &&
    player.dimension.id === area.dimension // Add this condition to check for dimension match
);


  const playerIsAdmin = protectedAreas.getAdmins().includes(player.name);

  const playerIsWhitelisted = AreaUtils.getAreaFromBlockLocation(
    block.location,
    areas
  )?.whitelist.includes(player.name);

  if (player.hasTag('LandAdmin')) {
    return;
  } else if (blockInsideProtectedArea) {
    data.cancel = !playerIsWhitelisted;
  } else return;
}

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  const { block, player, face } = data;
  const interactedBlock = getBlockFromFace(block, face);
  handlePlayerInteractWithBlocks({ player, block: interactedBlock, data });
});

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  const { block, player } = data;
  handlePlayerInteractWithBlocks({ player, block, data });
});

world.beforeEvents.playerBreakBlock.subscribe((data) => {
  const { block, player } = data;
  handlePlayerInteractWithBlocks({ player, block, data });
});

world.beforeEvents.explosion.subscribe((data) => {
  const areas = protectedAreas.getProtectedAreas();
  const impactedBlocks = data.getImpactedBlocks();
  const blockIsInsideArea = areas.some((area) => {
    return impactedBlocks.some((block) =>
        AreaUtils.isInside(block.location, new Area(area)) &&
        block.dimension.id === area.dimension  // Ensure dimension match here
    );
});

  data.cancel = blockIsInsideArea;
});

let playerTimers = new Map(); // Store running timers for each player

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const block = player.dimension.getBlock({
      x: player.location.x,
      y: player.location.y - 1,
      z: player.location.z,
    });

    const areas = protectedAreas.getProtectedAreas();
    const area = AreaUtils.getAreaFromBlockLocation(block.location, areas);

    if (area && player.dimension.id === area.dimension) {
      const playerIsWhitelisted = area.whitelist.includes(player.name);
      const isOwner = area.owner === player.name;

      // Check if the kickPlayers option is enabled
      const areaOptions = protectedAreas.getAreaOptions({ id: area.id });
      if (areaOptions && areaOptions.kickPlayers && !isOwner && !playerIsWhitelisted && !player.hasTag("LandAdmin")) {
        if (!playerTimers.has(player.name)) {
          let kickTimer = 10; // Reset the timer when a player enters the area
          
          const timerInterval = system.runInterval(() => {
            if (kickTimer > 0) {
              player.sendMessage(`§cYou have ${kickTimer} seconds to leave this area!`);
              kickTimer -= 1;

              // Check if the player has left the area
              const currentBlock = player.dimension.getBlock({
                x: player.location.x,
                y: player.location.y - 1,
                z: player.location.z,
              });
              const isStillInArea = AreaUtils.getAreaFromBlockLocation(currentBlock.location, [area]);

              if (!isStillInArea) {
                system.clearRun(timerInterval);
                playerTimers.delete(player.name); // Remove player from active timers
                player.sendMessage("§aYou have left the area.");
              }
            } else {
              // If the timer runs out, teleport the player out if they are still inside the area
              const currentBlock = player.dimension.getBlock({
                x: player.location.x,
                y: player.location.y - 1,
                z: player.location.z,
              });
              const isStillInArea = AreaUtils.getAreaFromBlockLocation(currentBlock.location, [area]);
              if (isStillInArea) {
                let playerDimension = player.dimension;
                let fx = area.from.x
                let fy = player.location.y
                let fz = area.from.z
                let playerSpawnPoint = player.getSpawnPoint();

                const finalSafeLocation = findSafeTeleportLocation(
                  fx, 
                  fy, 
                  fz, 
                  playerDimension, // FIX: Pass the dimension ID as a string
                  playerSpawnPoint
                );
                console.warn(`${finalSafeLocation.dimension.heightRange.max}`)
              
                player.teleport({x: finalSafeLocation.x, y: finalSafeLocation.y, z: finalSafeLocation.z}, {dimension: finalSafeLocation.dimension});
                player.sendMessage("§cYou have been removed from the area.");
              }

              system.clearRun(timerInterval);
              playerTimers.delete(player.name);
            }
          }, 20); // Runs every second (20 ticks)

          playerTimers.set(player.name, timerInterval);
        }
      }

      // Other interactions for owners, whitelisted players, and effects
      const tag = player.getTags().find((tag) => tag.startsWith('key:'));
      const key = area.key;
      if (isOwner && player.isJumping && player.isSneaking || player.hasTag('LandAdmin') && player.isJumping && player.isSneaking) {
        if (tag && player.hasTag(tag)) {
          player.removeTag(tag);
          player.addTag(`key:${key}`);
          player.sendMessage(`§a[!] You already saved the key §e${key}§a. The key has been updated.`);
          player.playSound('random.levelup');
        } else {
          player.addTag(`key:${key}`);
          player.sendMessage(`§a[!] §eThe key has been saved §b§o${key}`);
          player.playSound('random.levelup');
        }
      }

      if (!playerIsWhitelisted && !player.hasTag('LandAdmin')) {
        player.addEffect("weakness", 20, { amplifier: 255, showParticles: false });
      }

      if (player.isSneaking) {
        let from = new Vector3(area.from.x + 0.5, -64, area.from.z + 0.5);
        let to = new Vector3(area.to.x + 0.5, 319, area.to.z + 0.5);
        let Dimension = world.getDimension(area.dimension);

        for (let y = from.y; y <= 319; y += 4) {
          Dimension.spawnParticle("minecraft:balloon_gas_particle", new Vector3(from.x, y, from.z));
          Dimension.spawnParticle("minecraft:balloon_gas_particle", new Vector3(from.x, y, to.z));
          Dimension.spawnParticle("minecraft:balloon_gas_particle", new Vector3(to.x, y, to.z));
          Dimension.spawnParticle("minecraft:balloon_gas_particle", new Vector3(to.x, y, from.z));
        }

        const corner1 = { x: from.x, y: player.location.y, z: from.z };
        const corner4 = { x: to.x, y: player.location.y, z: to.z };
        const corner3 = { x: to.x, y: player.location.y, z: corner1.z };
        const corner2 = { x: corner1.x, y: player.location.y, z: to.z };

        drawline(corner1, corner2, Dimension, 1);
        drawline(corner2, corner4, Dimension, 1);
        drawline(corner4, corner3, Dimension, 1);
        drawline(corner3, corner1, Dimension, 1);

        player.onScreenDisplay.setActionBar(
          `§l§i-§r§i §oArea owner :§r §s${area.owner}\n` +
          `§l§i-§r§i §oArea name :§r §s${area.id}\n` +
          `§l§i-§r§i §oArea key :§r §s${area.key}`
        );
      }
    } else {
      // If player is no longer in a protected area, remove their timer
      if (playerTimers.has(player.name)) {
        system.clearRun(playerTimers.get(player.name));
        playerTimers.delete(player.name);
      }
    }
  }
}, 20);





function drawline(from, to, dimension, gap) {
  let locations = [];
  let direction = Vector3.multiply(Vector3.subtract(to, from).normalized(), gap),
    counts = Math.ceil(Vector3.distance(from, to) / gap);
  for (let loc = from; counts--; )
    locations.push((loc = Vector3.add(loc, direction)));
  for (const loc of locations)
    dimension.spawnParticle("minecraft:balloon_gas_particle", loc);
}


function findSafeTeleportLocation(fx, fy, fz, playerDimension, playerSpawnPoint) {
  // Move just outside the area
  fx -= 0.5;
  fz -= 0.5;

  // Set the height limit for the Nether
  const buildHeightLimit = (playerDimension.id === "minecraft:nether") ? 126 : 255;

  // Get the highest block at the specified XZ location
  let topBlock = playerDimension.getTopmostBlock({ x: fx, z: fz });

  if (topBlock) {
    let topY = topBlock.y; // Y position of the highest block
    let bottemY = fy

    // Nether check: If topY >= 126, ensure block at 126 is air
    if (playerDimension === "minecraft:nether" && topY >= 126) {
      const blockAt126 = playerDimension.getBlock({ fx, y: 126, fz });
      if (blockAt126 && !blockAt126.isAir) {
        // No safe spot found in the Nether
        return null;
      }
    }

    // Start from the bottem block and search upwards for an air block
    for (let checkY = bottemY; checkY <= buildHeightLimit; checkY++) {
      const blockAtCurrentHeight = playerDimension.getBlock({ x: fx, y: checkY, z: fz });

      if (blockAtCurrentHeight && blockAtCurrentHeight.isAir) {
        return { x: fx, y: checkY, z: fz , dimension: playerDimension };
      }
    }
  }

  // If no safe spot is found, teleport to the world's default spawn point
  console.warn("No safe teleport spot found, trying player's spawn point");
  if (playerSpawnPoint == null) {
    console.warn("No safe teleport spot found, trying overworld spawn")
  const worldDimension = world.getDimension("minecraft:overworld");
  const worldSpawnPoint = world.getDefaultSpawnLocation();
  const topMostOverWorld = worldDimension.getTopmostBlock({ 
    x: worldSpawnPoint.x, 
    z: worldSpawnPoint.z 
  });

  console.warn(`Fallback to Overworld: ${worldDimension.id}`);
  console.warn(`Spawn X: ${worldSpawnPoint.x}, Spawn Z: ${worldSpawnPoint.z}`);
  console.warn(`Highest Y at spawn: ${topMostOverWorld.y}`);

  return {
    x: worldSpawnPoint.x,
    y: topMostOverWorld.y + 1,
    z: worldSpawnPoint.z,
    dimension: worldDimension // FIXED: Pass the actual dimension object
  };}
    else {
    return { x: playerSpawnPoint.x,
             y: playerSpawnPoint.y + 1,
             z: playerSpawnPoint.z,
             dimension: playerSpawnPoint.dimension 
    }
  }
}




