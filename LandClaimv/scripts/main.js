import {
  world,
  system,
  BlockVolumeBase,
  BlockVolume,
  BlockPermutation
} from "@minecraft/server";
import { ProtectedAreas, AreaUtils } from "./ProtectedAreaHandler.js";
import { Storage } from "./database/storage.js";
import convert from "./arabicCon/arabicCon.js";
import Vector3 from "./vector.js";
import {
  ModalFormData,
  ActionFormData,
  MessageFormData,
} from "@minecraft/server-ui";

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
  // Check if the item used is a "protection:lock" and the player is not sneaking
  if (itemStack.typeId === "protection:lock" && !source.isSneaking) {
      select(source); // Call the select function for "protection:lock"
  }
});
const protectedAreas = new ProtectedAreas();
const mesageDataBase = new Storage("mesageDataBase");
const areaDataBase = new Storage ('areaDataBase')
const LandDateData = new Storage ('LandDateData')
const limitData = new Storage('limitData')
const cooldownPeriod = 1000;
const selectedCoordinates = new Map(); // Map to track cooldown for each player
const playerParticles = new Map(); // Map to track particles for each player

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  const { block, player, itemStack } = data;
  const { x, y, z } = block.location;
  const centerX = x + 0.5; // Calculate the center X coordinate
  const centerY = y + 1.5; // Calculate the Y coordinate for the top surface
  const centerZ = z + 0.5; // Calculate the center Z coordinate
  const Vec3 = { x: centerX, y: centerY, z: centerZ };
  const currentTime = Date.now();
  if (!selectedCoordinates.has(player)) {
    selectedCoordinates.set(player, { lastExecutionTime: 0, coords: [] });
  }

  if (!playerParticles.has(player)) {
    playerParticles.set(player, []);
  }

  const playerCooldown = selectedCoordinates.get(player);
  const playerParticlesList = playerParticles.get(player);

  if (currentTime - playerCooldown.lastExecutionTime >= cooldownPeriod) {
    playerCooldown.lastExecutionTime = currentTime;

    if (player.isSneaking && itemStack?.typeId === "protection:lock") {
      if (
        playerCooldown.coords.length === 0 ||
        playerCooldown.coords.length === 1
      ) {
        if (
          playerCooldown.coords[playerCooldown.coords.length - 1] !==
          `${x} ${y} ${z}`
        ) {
          playerCooldown.coords.push(`${x} ${y} ${z}`);
        }

        const dimensions = ["overworld", "nether", "the_end"];

        for (const dimension of dimensions) {
          const Particle = system.runInterval(() => {
            player.dimension.spawnParticle(
              "minecraft:balloon_gas_particle",
              Vec3
            );
          });
          playerParticlesList.push(Particle);
        }

        system.run(() => {
          player.playSound("random.levelup");
          player.sendMessage(`§e ${x}, ${y}, ${z}§r §bhas been saved!`);
        });
      } else {
        player.sendMessage(
          "§bThe values have been set before open the form to create the land with this coords!"
        );
        system.run(() => player.playSound("random.pop"));
      }
    }
  }
});
function generateUniqueId(length = 8) {
  let id = '';

  do {
      id = '';
      for (let i = 0; i < length; i++) {
          id += Math.floor(Math.random() * 10); // Random number between 0 and 9
      }
  } while (idExists(id)); // Check if the generated ID already exists

  return id;
}
// Function to check if ID already exists
function idExists(id) {
  // Check if the generated ID already exists in an array or database
  // For demonstration purposes, let's assume there's an array called 'generatedIds'
  return generatedIds.includes(id);
}
let generatedIds = protectedAreas.getAllAreaKeys();
function generateUniqueIds(count, length) {
  const uniqueIds = [];
  for (let i = 0; i < count; i++) {
    let newId;
    do {
      newId = generateUniqueId(length);
    } while (uniqueIds.includes(newId) || generatedIds.includes(newId));
    uniqueIds.push(newId);
  }
  return uniqueIds;
}

function FromTo(player) {
  const FromToo = new ModalFormData();
  FromToo.title("Choose your area range");
  FromToo.textField("§o§a[!]§f - Area Name :", "Add the name of the area");

  // Check if selectedCoordinates.get(player) exists
  const playerCoords = selectedCoordinates.get(player);

  if (playerCoords && playerCoords.coords && playerCoords.coords[0]) {
    FromToo.textField(
      "§o§a[!]§f - From (x, y, z) :",
      "the (x, y, z) of the beginning",
      playerCoords.coords[0]
    );
  } else {
    FromToo.textField("§o§a[!]§f - From (x, y, z) :", "the (x, y, z) of the beginning");
  }

  if (playerCoords && playerCoords.coords && playerCoords.coords[1]) {
    FromToo.textField(
      "§o§a[!]§f - To (x, y, z) :",
      "the (x, y, z) of the ending",
      playerCoords.coords[1]
    );
  } else {
    FromToo.textField("§o§a[!]§f - To (x, y, z) :", "the (x, y, z) of the ending");
  }

  // Show the form
  FromToo.show(player).then(({ canceled, formValues }) => {
    // Handle form cancellation
    if (canceled) {
      player.sendMessage("§bThe area selection process has been canceled!");
      player.playSound("random.pop");
      for (const Particle of playerParticles.get(player)) {
        system.clearRun(Particle);
      }
      selectedCoordinates.delete(player);
      playerParticles.delete(player);
      return; // Exit early if canceled
    }

    // Check if formValues is undefined or incomplete
    if (!formValues || formValues.length !== 3) {
      console.error("Form values are invalid:", formValues);
      player.sendMessage("§cInvalid form values. Please fill all fields.");
      player.playSound("random.break");
      return;
    }

    const [name, FromCoordinates, ToCoordinates] = formValues;

    // Ensure no fields are empty
    if (name === "" || FromCoordinates === "" || ToCoordinates === "") {
      player.sendMessage("§n[!] Please fill in all the fields.");
      player.playSound("random.break");
      return;
    }

    // Split the coordinates and parse them as floats
    const [fx, fy, fz] = FromCoordinates.split(" ").map(parseFloat);
    const [tx, ty, tz] = ToCoordinates.split(" ").map(parseFloat);

    // Validate coordinates
    if (isNaN(fx) || isNaN(fy) || isNaN(fz) || isNaN(tx) || isNaN(ty) || isNaN(tz)) {
      player.sendMessage("§c[!] Invalid coordinates. Ensure that all coordinates are valid numbers.");
      player.playSound("random.break");
      return;
    }

    // Check if the area overlaps with any existing protected areas
    const protectedAreas = new ProtectedAreas();
    const hasDuplicatedId = protectedAreas.getArea({ id: name });
    const areas = protectedAreas.getProtectedAreas();
    const playerAreaLength = areas.filter(area => area.owner === player.name);
    const limit = limitData.get("limit");

    // Check if the player reached their land limit
    if (playerAreaLength.length + 1 > limit) {
      player.sendMessage('§c[!] You have reached the maximum number of lands!');
      player.playSound('random.break');
      return;
    }

    // Check for overlapping areas
    const hasIntersection = protectedAreas
      .getProtectedAreas()
      .some((area) =>
        new BlockVolume(area.from, area.to).intersects(
          new BlockVolume(
            new Vector3(fx, fy + 60, fz),
            new Vector3(tx, ty - 10, tz)
          )
        ) && area.dimension === player.dimension.id
      );

    // Handle specific validation errors
    if (hasDuplicatedId) {
      player.sendMessage(`§c[!] The name §e${name}§r §bhas already been used, try another name!`);
      player.playSound("random.break");
    } else if (hasIntersection) {
      player.sendMessage("§c[!] This area intersects with another protected area.");
      player.playSound("random.break");
    } else {
      // Generate unique IDs and save the area
      const numberOfIds = 1;
      const idLength = 8;
      const uniqueIds = generateUniqueIds(numberOfIds, idLength);
      const dimension = player.dimension.id;

      console.warn("Generated IDs:", uniqueIds);
      const id = convert(name);

      // Save the area with the unique ID and player data
      protectedAreas.setArea({
        name: id,
        from: new Vector3(fx, -64, fz),
        to: new Vector3(tx, 319, tz),
        owner: player.name,
        originalcr: new Vector3(fx, fy, fz),
        key: uniqueIds,
        dimension: dimension
      });

      protectedAreas.areaWhitelistAdd({
        id: id,
        player: player.name,
      });

      // Store metadata related to the area
      LandDateData.set(uniqueIds[0], new Date().toLocaleString());
      areaDataBase.set(uniqueIds[0], { owner: player.name, messages: [] });

      console.warn("Area ID:", uniqueIds[0]);
      player.sendMessage("§aYour area has been saved!");
      player.playSound("random.levelup");
    }

    // Clean up particles and coordinates after submission
    for (const Particle of playerParticles.get(player)) {
      system.clearRun(Particle);
    }
    selectedCoordinates.delete(player);
    playerParticles.delete(player);
  }).catch((error) => {
    // Handle any unexpected errors
    //console.error("Error in the form submission:", error);
    //player.sendMessage("§cAn error occurred during form submission.");
    player.playSound("random.break");
  });
}


function select(player) {
  const select = new ActionFormData()
    .title("LAND CLAIM MENU")
    .body(
      "§bTHIS ADDON MADE BY§r\n     §o§a=> shadowgamer100k <=§r §bEnjoy :) \n§l§8|§r§7 If you encounter any problems, \n§l§8|§r§7 contact a server admin. \n§l§8|§r§7 Check out youtube for updates."
    )
    .button(
      "CREATE AREA\n§o§s[Click Here]",
      "textures/ui/icon_book_writable.png"
    )
    .button("MY AREAS\n§o§s[Click Here]", "textures/ui/icon_map.png")
    .button("GIVE ACCESS\n§o§s[Click Here]", "textures/ui/FriendsDiversity.png")
    .button("DELETE AREA\n§o§s[Click Here]", "textures/ui/icon_trash.png")
  if (player.hasTag("LandAdmin")) {
    select.button("ADMIN PANEL\n§o§s[Click Here]", "textures/ui/op.png");
  }
  select.show(player).then(({ canceled, selection }) => {
    if (canceled) return;
    if (selection === 0) return FromTo(player);
    if (selection === 1) return allMyAreas(player);
    if (selection === 2) return giveAccess(player);
    if (selection === 3) {
      DeleteAreas(player);
    }
    if (selection === 4) {
      AdminPanel(player);
    }
  });
}
function giveAccess(player) {
  const playerName = player.name;
  const areas = protectedAreas.getProtectedAreas();
  const playerAreas = areas.filter(
    (area) => area.owner === playerName || area.owner === playerName
  );
  const areaNames = playerAreas.map((area) => area.id);
  const areaKeys = playerAreas.map((area) => area.key);
  const players = world.getPlayers().map((p) => p.name);
  const allPlayers = world.getPlayers();
  if (areaNames.length === 0) {
    player.sendMessage(
      "§c[!] §nYou don't have access to any areas to grant access to."
    );
    player.playSound("random.break");
    return;
  }
  const accessForm = new ModalFormData()
    .title("§oGive Access")
    .dropdown("§o Here you can select the area and the player to which you want to grant access to your area. They will be able to destroy, place, move stuff in your area.\n\n§e[!]§7 §oselect area name", areaNames, 0)
    .dropdown("§e[!]§7 §oselect player name", players, 0);

  accessForm.show(player).then(({ canceled, formValues }) => {
    if (canceled) return;
    const [areaIndex, playerIndex] = formValues;
    const areaName = areaNames[areaIndex];
    const areaKey = areaKeys[areaIndex];
    const playerNameToAdd = players[playerIndex];
   

    protectedAreas.areaWhitelistAdd({
      id: areaName,
      player: playerNameToAdd,
    });
  
    player.sendMessage(
      `§e${playerNameToAdd}§r §bhas been added to §r§e${areaName} §r§b whitelist.`
    );
    playerNameToAdd.sendMessage(
      `§e${playerName}§r has added you to the whitelist of §r§e${areaName}§r.`
    );
    player.playSound("random.levelup");
    playerNameToAdd.playSound("random.levelup");
  });
}
function DeleteAreas(player) {
  const playerName = player.name;
  const MyAreasList = protectedAreas.getProtectedAreas();
  const MyAreas = MyAreasList.filter(
    (area) => area.owner === playerName || area.whitelist[0] === playerName
  );
  const MyAreasName = MyAreas.map((area) => area.id);
const sectionDelete = new ActionFormData()
       .title("selections")
       .body('here you can delete your areas using key or drop down menu...\n§c[!]§7 < admins can delete your areas >')
       .button("USING KEY\n§o§s[Click Here]", "textures/ui/magnifyingGlass.png")
       .button("USING FORM\n§o§s[Click Here]", "textures/ui/recipe_book_icon")
       .button('CLOSE\n§o§s[Click Here]', 'textures/ui/realms_red_x')
       .show(player).then(({canceled, selection}) => {
       if(canceled) return;
       if(selection === 0){
        const deletebykey = new ModalFormData()

        const tag = player.getTags().find((tag) => tag.startsWith('key:'));
        deletebykey.title('FIND BY KEY');
        if(tag){
          deletebykey.textField('§7Type the area §e[ KEY ]', 'type the key..', tag.split(":")[1]);
        } else {
          deletebykey.textField('§aType the area key. Must consist 8 numbers :\n§o§g EXAMPLE : [ §e79557577§r§o§g ]', '12345678')
        }
        deletebykey.show(player)
        .then(({ canceled, formValues }) => {
          if (canceled) return;
          if (String(formValues).match(/^\d{8}$/)) {
            const [deletedAreaKey] = formValues;
          const area = MyAreasList.find((area) => area.key == deletedAreaKey && area.owner === player.name);
          if (!area) {
            player.sendMessage("§c§c[!] This key is invalid. Try again.");
            player.playSound("random.break");
            return;
        }
          if(area.owner !== player.name){
            player.sendMessage('§c§c[!] Sorry you cant delete this area because it is not yours !')
            player.playSound("random.break")
            return;
          }
          const confirem = new MessageFormData()
              .title('are you sure??')
              .body('whene you click on "im sure" the area will be deleted!')
              .button1('Yes, Im sure')
              .button2('No, keep it')
              .show(player).then(({canceled, selection}) => {
                if(canceled) return;
                if(selection === 0 && deletedAreaKey != null) {
                  protectedAreas.deleteAreaByKey({ key: deletedAreaKey })
                  LandDateData.delete(deletedAreaKey)
                  areaDataBase.delete(deletedAreaKey)
                  mesageDataBase.delete(deletebykey)
                  player.sendMessage(
                    `§b${area.id}§f §edeleted from Protected Areas§f`
                  );
                  console.warn(`${formValues}`)
                }
                if(selection === 1) return;
              })
          }
          else {
            player.sendMessage("§c§c[!] The area key must consists of 8 numbers \n§c§c[!] Example: 12345678")
            player.playSound("random.break")
            return;
          }
        });
       }
      if(selection === 1){
        if(MyAreasName.length == 0){
          player.sendMessage('§c[!] You dont have any areas for now')
          player.playSound('random.break')
          return;
        } else {
          const AresForm = new ModalFormData()
          .title("this is all your areas")
          .dropdown("Select the area", MyAreasName, 0)
          .show(player)
          .then(({ canceled, formValues }) => {
            if (canceled) return;
            const [deletedArea] = formValues;
            protectedAreas.deleteArea({
              id: MyAreasName[deletedArea],
            });
            LandDateData.delete(MyAreas[deletedArea].key[0])
            areaDataBase.delete(MyAreas[deletedArea].key[0])
            mesageDataBase.delete(MyAreas[deletedArea].key[0])
            player.sendMessage(
              `§b${MyAreasName[deletedArea]}§f §edeleted from Protected Areas§f`
            );
            player.playSound("random.levelup");
          });
        }
        
          }
      if(selection === 2) return select(player);
       })
}

function allMyAreas(player) {
  const playerName = player.name;
  const areas = protectedAreas.getProtectedAreas();
  const myAreas = areas.filter(
    (area) => area.owner === playerName || area.whitelist[0] === playerName
  );

  if (myAreas.length === 0) {
    player.sendMessage("§c[!]§o You don't have any protected areas.");
    player.playSound("random.break");
  } else {
    const myAreaNames = myAreas.map((area) => area.id);
    const myAreakeys = myAreas.map((area) => area.key);
    const areaFormData = new ActionFormData()
      .title("My Areas")
      .body("§l§8|§r§7 These are all your areas you own. Once you select your area you can change who can access and see admin messages to your area.");

    for (const myAreaName of myAreaNames) {
      areaFormData.button(
        `${myAreaName}\n§o§s[Click Here]`,
        "textures/ui/world_glyph_color.png"
      );
    }

    areaFormData.show(player).then(({ canceled, selection }) => {
      if (canceled) return;
      const AreaId = myAreaNames[selection];
      const araeKEy = myAreakeys[selection];
      const selectedArea = myAreas[selection];
      const accessLists = selectedArea.whitelist;

      const sv = new ActionFormData()
      .title('Manage Area')
      .body('§a[!]§b Menu options :\n§l§8|§r§7 Allow player to build/place -> permissions \n§l§8|§r§7 See admin messages -> messages \n§l§8|§r§7 kick players out -> options')
      .button('PERMISSION\n§o§s[Click Here]', 'textures/ui/conduit_power_effect.png')
      .button('MESSAGES\n§o§s[Click Here]', 'textures/ui/icon_book_writable')
      .button('OPTIONS\n§o§s[Click Here]', 'textures/ui/color_picker')
      .button('CLOSE\n§o§s[Click Here]', 'textures/ui/realms_red_x')
      .show(player).then(({canceled, selection}) => {
        if(canceled) return;
         switch(selection){
          case 0:
            if (accessLists.length === 0) {
              player.sendMessage("§c[!]§o This area has no access permissions.");
            } else {
              const accessFormData = new ActionFormData()
                .title("Whitelist")
                .body("§o§a[!]§7 select player to manage :");
              for (let i = 0; i < accessLists.length; i++) {
                const accessList = accessLists[i];
                const isOwner = i === 0;
                const texture = isOwner
                  ? "textures/ui/op.png"
                  : "textures/ui/permissions_member_star.png";
                accessFormData.button(`${accessList}\n§o§s[Click Here]`, texture);
              }
              accessFormData.show(player).then(({ canceled, selection }) => {
                if (canceled) return;
                const selectedPlayer = accessLists[selection];
                const manageAccessFormData = new ActionFormData()
                  .title("Manage Access")
                  .body("§o§a[!]§7 What setting do you want to change with this player?");
                manageAccessFormData.button(
                  "Remove from Access\n§o§s[Click Here]",
                  "textures/ui/permissions_visitor_hand.png"
                );
                manageAccessFormData.show(player).then(({ canceled, selection }) => {
                  if (canceled) return;
                  switch (selection) {
                    case 0:
                      if (selectedPlayer === playerName) {
                        player.sendMessage("§c[!]§o You can't remove yourself!");
                        player.playSound("random.break");
                      } else if (selectedPlayer === accessLists[0]) {
                        player.sendMessage(
                          "§c[!]§o You can't remove the owner of this area!"
                        );
                        player.playSound("random.break");
                      } else {
                        const Accsp = new MessageFormData()
                          .title("Are you sure!")
                          .body("Do you want to remove this player from accessing the area?")
                          .button1("Yes")
                          .button2("No");
      
                        Accsp.show(player).then(({ canceled, selection }) => {
                          if (selection === 0) {
                            console.warn(AreaId)
                            protectedAreas.areaWhitelistRemove({
                              id: AreaId,
                              player: selectedPlayer,
                            });
                            const selectedPlayerON = world.getPlayers().find(p => p.name == selectedPlayer)
                            player.sendMessage(
                              `§b${selectedPlayer}§r §eremoved from the area.`
                            );
                            selectedPlayerON.sendMessage(`${accessLists[0]} removed you from one of their area(s)!`)
                            selectedPlayerON.playSound('random.pop')
                            player.playSound("random.levelup");
                          }
                        });
                      }
                      break;
                  }
                });
              });
            }
          break;
          case 1:
    const areaFor = areas.find(area => area.id === AreaId),
        areaData = areaDataBase.get(areaFor.key[0]),
        { messages, owner } = areaData;
        const messageLen = messages.length;
    if(messageLen !== 0) {
        const messagesform = new ActionFormData()
           .title(`${areaFor.id} Message's`)
           .body('§o§e[!]§7 This is all messages for this area')

        for (let i = 0; i < messageLen; i++){
          const senderOfMessage = messages[i].sender
          messagesform.button(`§8§a${i+1}§8] §a§oNew Message recieved §r\n§oby ${senderOfMessage}`, 'textures/ui/icon_map')
        }
        messagesform.show(player).then(({canceled, selection}) => {
          const messageIndex = selection;
          const objet = messages[selection];
            const form = new ActionFormData()
                 form.title(`FROM ${objet.sender}`)
                 form.button(`DELETE MESSAGE\n§o§s[Click Here]`, `textures/ui/icon_trash`)
                 form.button('CLOSE\n§o§s[Click Here]', 'textures/ui/realms_red_x')
                 form.body(`§o§c[!] Message From ${objet.sender}\n§bDate : ${objet.date} :\n=>§r§7§o ${objet.message}`)
                 form.show(player).then(({canceled, selection}) => {    
                  switch(selection){
                    case 0: 
                const cn = new MessageFormData()
                     .title('Confirmation')
                     .body('§c[!] are you sure?\n Message will be gone forever! ')
                     .button1('Yes')
                     .button2('No')
                     .show(player).then(({canceled, selection}) => {
                        if(selection === 0) {
                          
                          areaDataBase.overwrite(areaFor.key[0], (value) => {
                            value.messages.splice(messageIndex, 1)
                            return value
                          })
                          player.sendMessage(`§e[!] message deleted successfully`)
                          player.playSound('random.levelup')
                        }
                     })
                    break;
                    case 1:
                       return;
                    break;
                  }           
                 })
        })
    } else {
        player.sendMessage('§c§ Your area has no messages')
        player.playSound('random.break')
    } 
    break;          
   // Updated case 2
case 2:
  const options = new ModalFormData()
    .title("Area Options")
    .toggle("Kick players out", false); // Default value here; it could be dynamically set if available  
  options.show(player).then(({ canceled, formValues }) => {
    if (canceled) {
      allMyAreas(player);
      return;
    }   
    const [kick] = formValues;
    console.warn(`Kick players option set to: ${kick}`);
    console.warn(`AreaId before conversion: ${AreaId}`);

    // Use AreaId directly since it's likely a string and should match the expected format
    const otipnAreaID = AreaId; // No need for Number conversion if AreaId is already in the right format
    console.warn(`Option Area ID: ${otipnAreaID}`);

    // Update the area options with the new value
    protectedAreas.updateAreaOptions({
      id: otipnAreaID,
      areaOptions: {
        kickPlayers: kick // Use the value from the toggle
      }
    });
    player.sendMessage(`§aThe area options have been updated!`);
  });
  break;

    
           case 3:
          allMyAreas(player)
           break;
  }
      })
    });
  }
}
function AdminPanel(player) {
  try {
    const allPlayerAreas = protectedAreas.getProtectedAreas();
    const panel = new ActionFormData()
      .title("ADMIN PANEL")
      .body("§o§7 Welcome to the Admin panel. Use with caution. \n §a[!] §cADMIN ONLY")
      .button("FIND BY KEY\n§o§s[Click Here]", "textures/ui/magnifyingGlass.png")
      .button("AREA LIMIT\n§o§s[Click Here]", "textures/ui/ChainSquare.png")
      .button("ALL AREAS\n§o§s[Click Here]", "textures/ui/saleribbon.png")
      .button("CLEAR ALL AREAS\n§o§s[Click Here]", "textures/ui/icon_trash.png")
      .button("CLOSE\n§o§s[Click Here]", "textures/ui/redX1.png");

    panel.show(player).then((response) => {
      if (response.canceled) return;

      switch (response.selection) {     
        case 0:
          const tag = player.getTags().find((tag) => tag.startsWith('key:'));
          let form = new ModalFormData();
          form.title('FIND BY KEY');
          if (tag) {
            const key = tag.split(":")[1];
            form.textField('§o§7 Go to one of the players area and sneak and jump. The §ekey will be saved automatically§7. Once you open this menu again the key will be here', 'type the key...', key);
          } else {
            form.textField('§o§7 Go to one of the players area and sneak and jump. The §ekey will be saved automatically§7. Once you open this menu again the key will be here.', 'type the key...');
          }

          form.show(player).then(({ canceled, formValues }) => {
            if (String(formValues).match(/^\d{8}$/)) {
            const [key] = formValues;
            if (canceled) return;

            try {
              // Check if the key is empty or invalid
              if (!key || isNaN(key)) {
                throw new Error('The key must be a valid number!');
              }  
              const area = allPlayerAreas.find((area) => area.key == key);
              if (!area) {
                throw new Error('Invalid key, we can’t find this area!');
              }

              const areaOwner = protectedAreas.getAreaWhitelist({ id: area.id });
              const dimension = area.dimension;
              if (area !== undefined) {
                const DetailsByKey = new ActionFormData()
                  .title("Area Info")
                  .body(
                    `Area Owner: §b${area.owner}§r\nArea Name: §a${area.id}\n§rArea From: §aX: ${Math.floor(area.from.x)} Y: ${Math.floor(area.from.y)} Z: ${Math.floor(area.from.z)}\n§rArea To: §aX: ${Math.floor(area.to.x)} Y: ${Math.floor(area.to.y)} Z: ${Math.floor(area.to.z)}\n§rArea Surface: §a§a${calculateSurfaceArea(Math.floor(area.from.x), Math.floor(area.from.z), Math.floor(area.to.x), Math.floor(area.to.z))} Block\n§rArea Key: §a${key}\n§rArea dimension : §a${dimension.split(":")[1]}\n§rArea Date: §a${LandDateData.get(key)}`
                  )
                  .button("REMOVE\n§o§s[Click Here]", "textures/ui/icon_trash.png")
                  .button("TELEPORT\n§o§s[Click Here]", "textures/ui/icon_blackfriday.png")
                  .button("SEND MESSAGE\n§o§s[Click Here]", "textures/ui/invite_base.png");
                DetailsByKey.show(player).then((Dtselection) => {
                  if (Dtselection.canceled) return;
                  switch (Dtselection.selection) {
                    case 0:
                      const deletedArea = area.id;
                      protectedAreas.deleteArea({ id: deletedArea });
                      player.sendMessage(`The ${deletedArea} has been deleted!`);
                      LandDateData.delete(key);
                      areaDataBase.delete(key);
                      mesageDataBase.delete(key);
                      player.playSound("random.levelup");
                      break;
                    case 1:
                      const { x, y, z } = area.originalcr;
                      let midAreaX = ((area.from.x + area.to.x) / 2) + 0.5
                      let midAreaZ = ((area.from.z + area.to.z) / 2) + 0.5
                      player.teleport({x: midAreaX, y: y + 1, z: midAreaZ}, { dimension: world.getDimension(dimension) });
                      break;
                    case 2:
                      const send = new ModalFormData()
                        .title('Leave message')
                        .textField('§b[!] §aPlease type the message you want to send to the owner of this area...', 'example < hey...>')
                        .show(player).then(({ canceled, formValues }) => {
                          const [msg] = formValues;
                          const text = convert(msg);
                          addMessageToArea(key, text, player.name);
                          player.sendMessage(`§e[!] Your message has been sent to ${player.name}`);
                        });
                      break;
                  }
                });
              } else {
                throw new Error(`Area with key ${key} not found.`);
              }
            } catch (error) {
              player.sendMessage(`§c§c[!] ${error.message}`);
              player.playSound("random.break");
            }
          }});
          break;

        case 1:
          const limit = limitData.get("limit");
          const limitForm = new ModalFormData()
            .title('Lands limit')
            .textField(`§7 Set the area size limit for each player! \n§e Current limt:§l${limit} `, '§oset limit')
            .show(player).then(({ canceled, formValues }) => {
              if (String(formValues).match(/^\d{6}$/)) {
              const numberLand = formValues[0];
              if (!isNaN(numberLand)) {
                limitData.set("limit", parseFloat(numberLand));
                player.sendMessage('§athe limit set perfectly');
                player.playSound('random.levelup'); 
              } else {
                player.sendMessage('§c[!] The value should be a number!');
                player.playSound('random.break');
              }  
            }
          else {
            player.sendMessage("§c§c[!] Area limit can only be 6 numbers long.")
            player.playSound("random.break");
          }});
          break;

        case 2:
          if (allPlayerAreas.length === 0) {
            player.sendMessage("There are no protected areas.");
          } else {
            const playerAreas = new ActionFormData()
              .title("All Player's Areas")
              .body(`§o§7 These are all the players' areas. Sometimes located in the nether or end.\nOverall areas: §e${allPlayerAreas.length}`);

            for (const playerArea of allPlayerAreas) {
              playerAreas.button(
                `${playerArea.id}\n§o§j[ ${playerArea.owner} ]`,
                "textures/ui/icon_recipe_nature.png"
              );
            }

            playerAreas.show(player).then((areaResponse) => {
              if (areaResponse.canceled) return;
              const areaSelection = areaResponse.selection;

              if (areaSelection !== undefined) {
                const selectedAreaKey = allPlayerAreas[areaSelection].key;
                const selectedArea = allPlayerAreas[areaSelection];
                const areaOwner = protectedAreas.getAreaWhitelist({
                  id: selectedArea.id,
                });
                const dimension = selectedArea.dimension;
                const Details = new ActionFormData()
                  .title("Area Info")
                  .body(
                    `Area Owner: §b${selectedArea.owner}§r\nArea Name: §a${selectedArea.id}\n§rArea From: §aX: ${Math.floor(selectedArea.from.x)} Y: ${Math.floor(selectedArea.from.y)} Z: ${Math.floor(selectedArea.from.z)}\n§rArea To: §aX: ${Math.floor(selectedArea.to.x)} Y: ${Math.floor(selectedArea.to.y)} Z: ${Math.floor(selectedArea.to.z)}\n§rArea Surface: §a§a${calculateSurfaceArea(Math.floor(selectedArea.from.x), Math.floor(selectedArea.from.z), Math.floor(selectedArea.to.x), Math.floor(selectedArea.to.z))} Block\n§rArea Key: §a${selectedAreaKey}\n§rArea dimension : §a${dimension.split(":")[1]}\n§rArea Date: §a${LandDateData.get(selectedArea.key[0])}`
                  )
                  .button("REMOVE\n§o§s[Click Here]", "textures/ui/icon_trash.png")
                  .button("TELEPORT\n§o§s[Click Here]", "textures/ui/icon_blackfriday.png")
                  .button("SEND MESSAGE\n§o§s[Click Here]", "textures/ui/invite_base.png");

                Details.show(player).then((Dtselection) => {
                  if (Dtselection.canceled) return;
                  switch (Dtselection.selection) {
                    case 0:
                      const deletedArea = selectedArea.id;
                      const key = selectedArea.key;
                      protectedAreas.deleteArea({ id: deletedArea });
                      player.sendMessage(`The ${deletedArea} has been deleted!`);
                      LandDateData.delete(key.toString());
                      player.playSound("random.levelup");
                      break;
                    case 1:
                      const { x, y, z } = selectedArea.originalcr;
                      let midAreaX = ((selectedArea.from.x + selectedArea.to.x) / 2) + 0.5
                      let midAreaZ = ((selectedArea.from.z + selectedArea.to.z) / 2) + 0.5
                      player.teleport({x: midAreaX, y: y + 1, z: midAreaZ}, { dimension: world.getDimension(dimension) });
                      break;
                    case 2:
                      const send = new ModalFormData()
                        .title('Leave message')
                        .textField('§b[!] §aPlease type the message you want to send to the owner of this area...', 'type your message here..')
                        .show(player).then(({ canceled, formValues }) => {
                          const [msg] = formValues;
                          const text = convert(msg);
                          addMessageToArea(selectedArea.key[0], text, player.name);
                          player.sendMessage(`§e[!] Your message has been sent to ${player.name}`);
                          player.playSound('random.pop');
                        });
                      break;
                  }
                });
              }
            });
          }
          break;

        case 3:
          const confirme = new MessageFormData()
            .title("Area you sure?")
            .body("Do you really want to delete all protected areas?")
            .button1("Yes, I want this")
            .button2("No, cancel");
          confirme.show(player).then((Conselection) => {
            switch (Conselection.selection) {
              case 0:
                protectedAreas.deleteAllAreas();
                areaDataBase.clear();
                LandDateData.clear();
                player.sendMessage("§6All the areas have been deleted!");
                break;
              case 1:
                player.sendMessage("§6The operation has been canceled");
                player.playSound("random.pop");
                break;
            }
          });
          break;

        case 4:
          return;
      }
    });
  } catch (error) {
    player.sendMessage(`§c§c[!] An error occurred: ${error.message}`);
    player.playSound("random.break");
  }
}





// this will calculate the surface but without testing every single block, so no getBlock ( means no error ^^ )
function calculateSurfaceArea (x1, z1, x2, z2) {
  const sx = Math.min(x1, x2)
  const ex = Math.max(x1, x2)
  const sz = Math.min(z1, z2)
  const ez = Math.max(z1, z2)
  return (1 + ex - sx) * (1 + ez - sz)
}

function addMessageToArea(areaId, message, sender) {
  areaDataBase.overwrite(areaId, (oldAreaValue) => {
      let newAreaValue = oldAreaValue
      newAreaValue.messages.push({ sender: sender, message: message, date: new Date().toLocaleString() })
      return newAreaValue
  })
}
