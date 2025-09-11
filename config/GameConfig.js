// Game Configuration Module
// Centralized configuration for HexQuest game

export const GameConfig = {
  // Hex Grid Settings
  HEX_SIZE: 25,
  
  // Game Mechanics
  NUM_DICE: 4, // Default number of dice, can increase with horses
  
  // Entity Counts
  ENTITIES: {
    SPEARMEN: 0,
    ARCHERS: 6,
    DRAGONS: 0,
    HORSES: 4,
    SHIPS: 5,
    TREASURES: 8,
    TRAPS: 10,
    BOW_DEFENDERS: 0,
    SEA_MONSTERS: 1,
    CASTLES: 2
  },
  
  // Game Features
  FEATURES: {
    TELEPORTERS: true,
    PATH_DRAWING: false,
    EXPORT_BUTTON: false
  },
  
  // Cube Directions (1 = North, 2 = Northeast, ..., 6 = Northwest)
  CUBE_DIRECTIONS: [
    { x: 0, y: 1, z: -1 },   // 1. North
    { x: 1, y: 0, z: -1 },   // 2. Northeast
    { x: 1, y: -1, z: 0 },   // 3. Southeast
    { x: 0, y: -1, z: 1 },   // 4. South
    { x: -1, y: 0, z: 1 },   // 5. Southwest
    { x: -1, y: 1, z: 0 }    // 6. Northwest
  ],
  
  // Game Phases
  GAME_PHASES: {
    INTRO: 'intro',
    ROLL: 'roll',
    SELECT: 'select',
    MOVE: 'move',
    BATTLE: 'battle',
    GAMEOVER: 'gameover',
    CONFIRM_MOVE: 'confirmMove',
    END: 'end',
    NO_MOVE: 'noMove',
    BATTLE_END: 'battleEnd'
  },
  
  // UI Settings
  UI: {
    BUTTON_WIDTH: 100,
    BUTTON_HEIGHT: 40,
    DIE_SIZE: 80,
    DIE_SPACING: 15,
    DICE_Y_OFFSET: 150
  },
  
  // Colors
  COLORS: {
    PLAYER_1: 'red',
    PLAYER_2: 'blue',
    BACKGROUND: 220,
    HIGHLIGHT: [255, 255, 0, 100],
    BATTLE_HIGHLIGHT: [255, 0, 0],
    DIE_PLAYER: 255,
    DIE_ENEMY: 0
  },
  
  // Terrain Colors
  TERRAIN_COLORS: {
    MOUNTAIN: [139, 69, 19],
    GRASS: [124, 200, 0],
    FOREST: [34, 139, 34],
    BEACH: [238, 214, 175],
    CASTLE: [200, 200, 200],
    SWAMP: [50, 107, 47],
    WATER: [70, 130, 180],
    TELEPORTER: [255, 60, 180]
  },
  
  // Default Values
  DEFAULTS: {
    SEED: 0,
    NUM_PLAYERS: 1,
    DICE_VISIBLE: true
  }
};