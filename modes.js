const GAME_MODES = {
  bollywood: {
    id: "bollywood",
    label: "Bollywood Celebrities",
    extensions: [".jpg", ".jpeg", ".png"],
    characters: [
      { id: "shah_rukh_khan", name: "Shah Rukh Khan", accent: ["#4568dc", "#b06ab3"] },
      { id: "salman_khan", name: "Salman Khan", accent: ["#11998e", "#38ef7d"] },
      { id: "aamir_khan", name: "Aamir Khan", accent: ["#1d2b64", "#f8cdda"] },
      { id: "hrithik_roshan", name: "Hrithik Roshan", accent: ["#4b6cb7", "#182848"] },
      { id: "ranbir_kapoor", name: "Ranbir Kapoor", accent: ["#c33764", "#1d2671"] },
      { id: "ranveer_singh", name: "Ranveer Singh", accent: ["#f46b45", "#eea849"] },
      { id: "ajay_devgn", name: "Ajay Devgn", accent: ["#134e5e", "#71b280"] },
      { id: "akshay_kumar", name: "Akshay Kumar", accent: ["#3a1c71", "#d76d77"] },
      { id: "amitabh_bachchan", name: "Amitabh Bachchan", accent: ["#42275a", "#734b6d"] },
      { id: "saif_ali_khan", name: "Saif Ali Khan", accent: ["#0f2027", "#2c5364"] },
      { id: "deepika_padukone", name: "Deepika Padukone", accent: ["#355c7d", "#6c5b7b"] },
      { id: "priyanka_chopra", name: "Priyanka Chopra", accent: ["#614385", "#516395"] },
      { id: "alia_bhatt", name: "Alia Bhatt", accent: ["#ff758c", "#ff7eb3"] },
      { id: "kareena_kapoor", name: "Kareena Kapoor", accent: ["#cc2b5e", "#753a88"] },
      { id: "katrina_kaif", name: "Katrina Kaif", accent: ["#7f00ff", "#e100ff"] },
      { id: "anushka_sharma", name: "Anushka Sharma", accent: ["#11998e", "#0575e6"] },
      { id: "madhuri_dixit", name: "Madhuri Dixit", accent: ["#ff512f", "#dd2476"] },
      { id: "kajol", name: "Kajol", accent: ["#8360c3", "#2ebf91"] },
      { id: "vidya_balan", name: "Vidya Balan", accent: ["#41295a", "#2f0743"] },
      { id: "kiara_advani", name: "Kiara Advani", accent: ["#4776e6", "#8e54e9"] }
    ]
  },
  clashofclans: {
    id: "clashofclans",
    label: "Clash of Clans",
    extensions: [".webp", ".png"],
    characters: [
      { id: "barbarian", name: "Barbarian", accent: ["#d4881f", "#f5a623"] },
      { id: "archer", name: "Archer", accent: ["#bd10e0", "#7a0e9b"] },
      { id: "giant", name: "Giant", accent: ["#7ed321", "#5d9c1c"] },
      { id: "wizard", name: "Wizard", accent: ["#4a90e2", "#2d6eb5"] },
      { id: "dragon", name: "Dragon", accent: ["#f5a623", "#b8a04f"] },
      { id: "goblin", name: "Goblin", accent: ["#7ed321", "#56a816"] },
      { id: "pekka", name: "PEKKA", accent: ["#4a90e2", "#1a3d70"] },
      { id: "miner", name: "Miner", accent: ["#f5a623", "#a67b28"] },
      { id: "archer_queen", name: "Archer Queen", accent: ["#bd10e0", "#9a10b8"] },
      { id: "barbarian_king", name: "Barbarian King", accent: ["#f5a623", "#c98818"] },
      { id: "valkyrie", name: "Valkyrie", accent: ["#d4881f", "#f5a623"] },
      { id: "witch", name: "Witch", accent: ["#4a90e2", "#332ab8"] },
      { id: "healer", name: "Healer", accent: ["#f5a623", "#e8c265"] },
      { id: "balloon", name: "Balloon", accent: ["#f5a623", "#aa7b1a"] },
      { id: "baby_dragon", name: "Baby Dragon", accent: ["#7ed321", "#4d8a12"] },
      { id: "yeti", name: "Yeti", accent: ["#4a90e2", "#86b4f5"] },
      { id: "electro_dragon", name: "Electro Dragon", accent: ["#f5a623", "#bfb026"] },
      { id: "ice_golem", name: "Ice Golem", accent: ["#4a90e2", "#2d5696"] },
      { id: "root_rider", name: "Root Rider", accent: ["#7ed321", "#3d7a10"] },
      { id: "druid", name: "Druid", accent: ["#7ed321", "#4c8c1b"] },
      { id: "lava_hound", name: "Lava Hound", accent: ["#d4881f", "#da7c20"] },
      { id: "golem", name: "Golem", accent: ["#f5a623", "#a67b28"] },
      { id: "wall_breaker", name: "Wall Breaker", accent: ["#d4881f", "#f5a623"] },
      { id: "hog_rider", name: "Hog Rider", accent: ["#7ed321", "#5d9c1c"] },
      { id: "bowler", name: "Bowler", accent: ["#4a90e2", "#2d6eb5"] },
      { id: "dragon_duke", name: "Dragon Duke", accent: ["#f5a623", "#b8a04f"] },
      { id: "dragon_rider", name: "Dragon Rider", accent: ["#f5a623", "#b8a04f"] },
      { id: "grand_warden", name: "Grand Warden", accent: ["#4a90e2", "#86b4f5"] },
      { id: "minion", name: "Minion", accent: ["#7ed321", "#5d9c1c"] },
      { id: "minion_prince", name: "Minion Prince", accent: ["#7ed321", "#5d9c1c"] },
      { id: "thrower", name: "Thrower", accent: ["#4a90e2", "#2d6eb5"] },
      { id: "headhunter", name: "Headhunter", accent: ["#4a90e2", "#2d6eb5"] },
      { id: "meteor_golem", name: "Meteor Golem", accent: ["#f5a623", "#a67b28"] },
      { id: "royal_champion", name: "Royal Champion", accent: ["#bd10e0", "#9a10b8"] },
      { id: "battle_copter", name: "Battle Copter", accent: ["#4a90e2", "#2d6eb5"] },
      { id: "battle_machine", name: "Battle Machine", accent: ["#4a90e2", "#2d6eb5"] },
      { id: "apprentice_warden", name: "Apprentice Warden", accent: ["#4a90e2", "#86b4f5"] },
      { id: "electro_titan", name: "Electro Titan", accent: ["#f5a623", "#bfb026"] },
      { id: "furnace", name: "Furnace", accent: ["#f5a623", "#aa7b1a"] }
    ]
  }
};

function getAvailableModes() {
  return Object.keys(GAME_MODES).map(key => ({
    id: key,
    label: GAME_MODES[key].label
  }));
}

function getModeById(modeId) {
  return GAME_MODES[modeId] || null;
}

function getCharacterCountForMode(modeId) {
  const mode = getModeById(modeId);
  return mode ? mode.characters.length : 0;
}

function populateModeSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = "";
  const modes = getAvailableModes();
  modes.forEach(mode => {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = mode.label;
    select.appendChild(option);
  });
}