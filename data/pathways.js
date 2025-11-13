export const PATHWAYS = {
  FOOL: {
    name: "Fool",
    emoji: "🃏",
    group: "The Fool",
    sequences: [
      { seq: 9, name: "Seer", risk: 5 },
      { seq: 8, name: "Clown", risk: 8 },
      { seq: 7, name: "Magician", risk: 12 },
      { seq: 6, name: "Faceless", risk: 15 },
      { seq: 5, name: "Marionettist", risk: 20 },
      { seq: 4, name: "Bizarro Sorcerer", risk: 25 },
      { seq: 3, name: "Scholar of Yore", risk: 30 },
      { seq: 2, name: "Miracle Invoker", risk: 40 },
      { seq: 1, name: "Attendant of Mysteries", risk: 50 },
      { seq: 0, name: "Fool", risk: 0 }
    ]
  },
  
  ERROR: {
    name: "Error",
    emoji: "⚡",
    group: "The Fool",
    sequences: [
      { seq: 9, name: "Savant", risk: 8 },
      { seq: 8, name: "Archaeologist", risk: 12 },
      { seq: 7, name: "Appraiser", risk: 15 },
      { seq: 6, name: "Wind-blessed", risk: 20 },
      { seq: 5, name: "Astromancer", risk: 25 },
      { seq: 4, name: "Mysticologist", risk: 30 },
      { seq: 3, name: "Clairvoyant", risk: 35 },
      { seq: 2, name: "Prophet", risk: 45 },
      { seq: 1, name: "Soothsayer", risk: 55 },
      { seq: 0, name: "Error", risk: 0 }
    ]
  },
  
  DOOR: {
    name: "Door",
    emoji: "🚪",
    group: "The Fool",
    sequences: [
      { seq: 9, name: "Apprentice", risk: 7 },
      { seq: 8, name: "Trickmaster", risk: 10 },
      { seq: 7, name: "Scribe", risk: 15 },
      { seq: 6, name: "Traveler", risk: 25 },
      { seq: 5, name: "Secrets Sorcerer", risk: 35 },
      { seq: 4, name: "Mystic", risk: 40 },
      { seq: 3, name: "Wanderer", risk: 50 },
      { seq: 2, name: "Planeswalker", risk: 60 },
      { seq: 1, name: "Key of Stars", risk: 70 },
      { seq: 0, name: "Door", risk: 0 }
    ]
  },

  VISIONARY: {
    name: "Visionary",
    emoji: "👁️",
    group: "The Fool",
    sequences: [
      { seq: 9, name: "Spectator", risk: 10 },
      { seq: 8, name: "Telepathist", risk: 15 },
      { seq: 7, name: "Psyche Analyst", risk: 20 },
      { seq: 6, name: "Dreamwalker", risk: 30 },
      { seq: 5, name: "Dream Stealer", risk: 40 },
      { seq: 4, name: "Manipulator", risk: 50 },
      { seq: 3, name: "Discerner", risk: 60 },
      { seq: 2, name: "Author", risk: 70 },
      { seq: 1, name: "Omniscient Eye", risk: 80 },
      { seq: 0, name: "Visionary", risk: 0 }
    ]
  },

  SUN: {
    name: "Sun",
    emoji: "☀️",
    group: "Eternal Blazing Sun",
    sequences: [
      { seq: 9, name: "Bard", risk: 3 },
      { seq: 8, name: "Notary", risk: 5 },
      { seq: 7, name: "Solar High Priest", risk: 8 },
      { seq: 6, name: "Professor of Enlightenment", risk: 10 },
      { seq: 5, name: "Priest of Light", risk: 15 },
      { seq: 4, name: "Unshadowed", risk: 20 },
      { seq: 3, name: "Justice Mentor", risk: 25 },
      { seq: 2, name: "Lightker", risk: 35 },
      { seq: 1, name: "Hand of God", risk: 45 },
      { seq: 0, name: "Sun", risk: 0 }
    ]
  },

  TYRANT: {
    name: "Tyrant",
    emoji: "⚔️",
    group: "Lord of Storms",
    sequences: [
      { seq: 9, name: "Sailor", risk: 6 },
      { seq: 8, name: "Folk of Rage", risk: 12 },
      { seq: 7, name: "Seafarer", risk: 18 },
      { seq: 6, name: "Wind-blessed", risk: 22 },
      { seq: 5, name: "Ocean Songster", risk: 28 },
      { seq: 4, name: "Cataclysmic Interrer", risk: 35 },
      { seq: 3, name: "Sea King", risk: 42 },
      { seq: 2, name: "Calamity of Destruction", risk: 50 },
      { seq: 1, name: "Thunder God", risk: 60 },
      { seq: 0, name: "Tyrant", risk: 0 }
    ]
  },

  WHITE_TOWER: {
    name: "White Tower",
    emoji: "🗼",
    group: "God of Knowledge",
    sequences: [
      { seq: 9, name: "Savant", risk: 5 },
      { seq: 8, name: "Archaeologist", risk: 8 },
      { seq: 7, name: "Appraiser", risk: 12 },
      { seq: 6, name: "Polymath", risk: 16 },
      { seq: 5, name: "Astromancer", risk: 20 },
      { seq: 4, name: "Philosopher", risk: 25 },
      { seq: 3, name: "Sage", risk: 32 },
      { seq: 2, name: "Omniscient", risk: 40 },
      { seq: 1, name: "Eye of Wisdom", risk: 50 },
      { seq: 0, name: "White Tower", risk: 0 }
    ]
  },

  HANGED_MAN: {
    name: "Hanged Man",
    emoji: "🎣",
    group: "Lord of Storms",
    sequences: [
      { seq: 9, name: "Secrets Supplicant", risk: 6 },
      { seq: 8, name: "Listener", risk: 10 },
      { seq: 7, name: "Spirit Guide", risk: 14 },
      { seq: 6, name: "Seafarer", risk: 18 },
      { seq: 5, name: "Druid", risk: 24 },
      { seq: 4, name: "Spirit Walker", risk: 30 },
      { seq: 3, name: "Sea God", risk: 38 },
      { seq: 2, name: "Weather Warlock", risk: 45 },
      { seq: 1, name: "Tyrant", risk: 55 },
      { seq: 0, name: "Hanged Man", risk: 0 }
    ]
  },

  DARKNESS: {
    name: "Darkness",
    emoji: "🌑",
    group: "Evernight Goddess",
    sequences: [
      { seq: 9, name: "Sleepless", risk: 4 },
      { seq: 8, name: "Midnight Poet", risk: 7 },
      { seq: 7, name: "Nightmare", risk: 10 },
      { seq: 6, name: "Requiem", risk: 14 },
      { seq: 5, name: "Gatekeeper", risk: 18 },
      { seq: 4, name: "Soul Assurer", risk: 24 },
      { seq: 3, name: "Ferryman", risk: 30 },
      { seq: 2, name: "Pale Emperor", risk: 38 },
      { seq: 1, name: "Prince of Concealment", risk: 48 },
      { seq: 0, name: "Darkness", risk: 0 }
    ]
  },

  DEATH: {
    name: "Death",
    emoji: "💀",
    group: "Death",
    sequences: [
      { seq: 9, name: "Corpse Collector", risk: 8 },
      { seq: 8, name: "Gravedigger", risk: 14 },
      { seq: 7, name: "Spirit Medium", risk: 20 },
      { seq: 6, name: "Shaman", risk: 28 },
      { seq: 5, name: "Gatekeeper", risk: 36 },
      { seq: 4, name: "Undying", risk: 45 },
      { seq: 3, name: "Ferryman", risk: 55 },
      { seq: 2, name: "Death Consul", risk: 65 },
      { seq: 1, name: "Pale Emperor", risk: 75 },
      { seq: 0, name: "Death", risk: 0 }
    ]
  },

  TWILIGHT_GIANT: {
    name: "Twilight Giant",
    emoji: "⚒️",
    group: "God of Combat",
    sequences: [
      { seq: 9, name: "Warrior", risk: 5 },
      { seq: 8, name: "Pugilist", risk: 8 },
      { seq: 7, name: "Weapon Master", risk: 12 },
      { seq: 6, name: "Dawn Paladin", risk: 16 },
      { seq: 5, name: "Guardian", risk: 22 },
      { seq: 4, name: "Conqueror", risk: 28 },
      { seq: 3, name: "Berserker", risk: 36 },
      { seq: 2, name: "Iron-blooded Knight", risk: 44 },
      { seq: 1, name: "Primordial Hunger", risk: 54 },
      { seq: 0, name: "Twilight Giant", risk: 0 }
    ]
  },

  DEMONESS: {
    name: "Demoness",
    emoji: "💃",
    group: "Primordial Demoness",
    sequences: [
      { seq: 9, name: "Assassin", risk: 7 },
      { seq: 8, name: "Instigator", risk: 12 },
      { seq: 7, name: "Witch", risk: 18 },
      { seq: 6, name: "Pleasure", risk: 26 },
      { seq: 5, name: "Afflictions", risk: 34 },
      { seq: 4, name: "Despair", risk: 42 },
      { seq: 3, name: "Unaging", risk: 52 },
      { seq: 2, name: "Demoness of Catastrophe", risk: 62 },
      { seq: 1, name: "Apocalypse", risk: 72 },
      { seq: 0, name: "Demoness", risk: 0 }
    ]
  },

  RED_PRIEST: {
    name: "Red Priest",
    emoji: "🔥",
    group: "God of War",
    sequences: [
      { seq: 9, name: "Hunter", risk: 6 },
      { seq: 8, name: "Provocateur", risk: 11 },
      { seq: 7, name: "Pyromaniac", risk: 16 },
      { seq: 6, name: "Conspirator", risk: 22 },
      { seq: 5, name: "Reaper", risk: 28 },
      { seq: 4, name: "Iron-blooded Knight", risk: 35 },
      { seq: 3, name: "War Bishop", risk: 43 },
      { seq: 2, name: "Conqueror", risk: 52 },
      { seq: 1, name: "Red Angel", risk: 62 },
      { seq: 0, name: "Red Priest", risk: 0 }
    ]
  },

  MOON: {
    name: "Moon",
    emoji: "🌙",
    group: "Mother Goddess",
    sequences: [
      { seq: 9, name: "Apothecary", risk: 5 },
      { seq: 8, name: "Beast Tamer", risk: 9 },
      { seq: 7, name: "Vampire", risk: 14 },
      { seq: 6, name: "Potions Professor", risk: 19 },
      { seq: 5, name: "Scarlet Scholar", risk: 25 },
      { seq: 4, name: "Shaman King", risk: 32 },
      { seq: 3, name: "Ferryman", risk: 40 },
      { seq: 2, name: "Zombie", risk: 48 },
      { seq: 1, name: "Beauty Goddess", risk: 58 },
      { seq: 0, name: "Moon", risk: 0 }
    ]
  },

  MOTHER: {
    name: "Mother",
    emoji: "🌾",
    group: "Mother Goddess",
    sequences: [
      { seq: 9, name: "Planter", risk: 4 },
      { seq: 8, name: "Biologist", risk: 7 },
      { seq: 7, name: "Harvester", risk: 11 },
      { seq: 6, name: "Herbalist", risk: 15 },
      { seq: 5, name: "Druid", risk: 20 },
      { seq: 4, name: "Shaman King", risk: 26 },
      { seq: 3, name: "Ancient Alchemist", risk: 33 },
      { seq: 2, name: "Fecundity", risk: 42 },
      { seq: 1, name: "Nature Walker", risk: 52 },
      { seq: 0, name: "Mother", risk: 0 }
    ]
  },

  ABYSS: {
    name: "Abyss",
    emoji: "🕳️",
    group: "Chained God",
    sequences: [
      { seq: 9, name: "Criminal", risk: 10 },
      { seq: 8, name: "Madman", risk: 18 },
      { seq: 7, name: "Serial Killer", risk: 26 },
      { seq: 6, name: "Devil", risk: 35 },
      { seq: 5, name: "Desire Apostle", risk: 45 },
      { seq: 4, name: "Torture", risk: 55 },
      { seq: 3, name: "Silent Disciple", risk: 65 },
      { seq: 2, name: "Demon of Knowledge", risk: 75 },
      { seq: 1, name: "Dark Angel", risk: 85 },
      { seq: 0, name: "Abyss", risk: 0 }
    ]
  },

  CHAINED: {
    name: "Chained",
    emoji: "⛓️",
    group: "Chained God",
    sequences: [
      { seq: 9, name: "Prisoner", risk: 8 },
      { seq: 8, name: "Lunatic", risk: 15 },
      { seq: 7, name: "Werewolf", risk: 23 },
      { seq: 6, name: "Living Corpse", risk: 32 },
      { seq: 5, name: "Wraith", risk: 41 },
      { seq: 4, name: "Zombie", risk: 51 },
      { seq: 3, name: "Reaper", risk: 61 },
      { seq: 2, name: "Pale Emperor", risk: 71 },
      { seq: 1, name: "Dark Side of the Universe", risk: 81 },
      { seq: 0, name: "Chained", risk: 0 }
    ]
  },

  JUSTICIAR: {
    name: "Justiciar",
    emoji: "⚖️",
    group: "Eternal Blazing Sun",
    sequences: [
      { seq: 9, name: "Arbiter", risk: 3 },
      { seq: 8, name: "Sheriff", risk: 6 },
      { seq: 7, name: "Interrogator", risk: 9 },
      { seq: 6, name: "Judge", risk: 13 },
      { seq: 5, name: "Disciplinary Paladin", risk: 17 },
      { seq: 4, name: "Imperative Mage", risk: 23 },
      { seq: 3, name: "Chaos Hunter", risk: 30 },
      { seq: 2, name: "Balance", risk: 38 },
      { seq: 1, name: "Adjudicator", risk: 48 },
      { seq: 0, name: "Justiciar", risk: 0 }
    ]
  },

  PARAGON: {
    name: "Paragon",
    emoji: "🛡️",
    group: "God of Steam",
    sequences: [
      { seq: 9, name: "Generalist", risk: 4 },
      { seq: 8, name: "Polymath", risk: 7 },
      { seq: 7, name: "Artisan", risk: 10 },
      { seq: 6, name: "Alchemist", risk: 14 },
      { seq: 5, name: "Artisan", risk: 18 },
      { seq: 4, name: "Arcanist", risk: 24 },
      { seq: 3, name: "Arcane Scholar", risk: 31 },
      { seq: 2, name: "Master of Mysteries", risk: 39 },
      { seq: 1, name: "Omniscient", risk: 49 },
      { seq: 0, name: "Paragon", risk: 0 }
    ]
  },

  BLACK_EMPEROR: {
    name: "Black Emperor",
    emoji: "👑",
    group: "Black Emperor",
    sequences: [
      { seq: 9, name: "Lawyer", risk: 6 },
      { seq: 8, name: "Barbarian", risk: 11 },
      { seq: 7, name: "Briber", risk: 17 },
      { seq: 6, name: "Baron of Corruption", risk: 24 },
      { seq: 5, name: "Mentor of Disorder", risk: 31 },
      { seq: 4, name: "Earl of the Fallen", risk: 39 },
      { seq: 3, name: "Duke of Entropy", risk: 47 },
      { seq: 2, name: "Prince of Abolition", risk: 57 },
      { seq: 1, name: "Emperor of Rules", risk: 67 },
      { seq: 0, name: "Black Emperor", risk: 0 }
    ]
  },

  HERMIT: {
    name: "Hermit",
    emoji: "📚",
    group: "Hidden Sage",
    sequences: [
      { seq: 9, name: "Secrets Supplicant", risk: 9 },
      { seq: 8, name: "Melee Scholar", risk: 16 },
      { seq: 7, name: "Warlock", risk: 24 },
      { seq: 6, name: "Scrolls Professor", risk: 33 },
      { seq: 5, name: "Mysticologist", risk: 42 },
      { seq: 4, name: "Sage", risk: 52 },
      { seq: 3, name: "Soothsayer", risk: 62 },
      { seq: 2, name: "Clairvoyant", risk: 72 },
      { seq: 1, name: "Knowledge Emperor", risk: 82 },
      { seq: 0, name: "Hermit", risk: 0 }
    ]
  },

  WHEEL_OF_FORTUNE: {
    name: "Wheel of Fortune",
    emoji: "🎰",
    group: "Antigonus",
    sequences: [
      { seq: 9, name: "Monster", risk: 7 },
      { seq: 8, name: "Lucky One", risk: 13 },
      { seq: 7, name: "Winner", risk: 19 },
      { seq: 6, name: "Calamity Priest", risk: 26 },
      { seq: 5, name: "Dreamwalker", risk: 34 },
      { seq: 4, name: "Fate Mentor", risk: 42 },
      { seq: 3, name: "Chaos Hunter", risk: 51 },
      { seq: 2, name: "Prophet", risk: 61 },
      { seq: 1, name: "Soothsayer", risk: 71 },
      { seq: 0, name: "Wheel of Fortune", risk: 0 }
    ]
  }
};

export function getPathway(name) {
  return Object.values(PATHWAYS).find(p => 
    p.name.toLowerCase() === name.toLowerCase()
  );
}

export function getSequence(pathway, seq) {
  return pathway.sequences.find(s => s.seq === seq);
}

export function getAllPathwayNames() {
  return Object.values(PATHWAYS).map(p => ({
    name: p.name.toLowerCase(),
    display: `${p.emoji} ${p.name}`
  }));
}
