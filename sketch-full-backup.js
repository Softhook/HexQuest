
// Test basic loading
console.log('sketch.js: Starting to load');

// Import modules
import { GameConfig } from './config/GameConfig.js';
import { isPointInHex, calculateHexPosition, calculateCubeCoordinates, cubeDistance, getDirectionName, getNeighbors } from './utils/MathUtils.js';
import { isHexFullyVisible, isLandHex, isWaterHex, isMountainHex, isEdgeWaterHex, isTraversable, isEnemyTraversable } from './utils/ValidationUtils.js';
import { Hexagon } from './hexgrid/Hexagon.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/enemies/Enemy.js';
import { Archer } from './entities/enemies/Archer.js';
import { BowDefender } from './entities/enemies/BowDefender.js';
import { DragonEnemy } from './entities/enemies/DragonEnemy.js';
import { SeaMonster } from './entities/enemies/SeaMonster.js';
import { Ship } from './entities/Ship.js';
import { Horse } from './entities/Horse.js';
import { Treasure } from './entities/Treasure.js';

console.log('All modules loaded successfully');

// Extract commonly used configuration values
const { 
  NUM_DICE, 
  CUBE_DIRECTIONS, 
  ENTITY_COUNTS: {
    HORSES: numberHorses,
    TRAPS: numberTraps,
    TREASURES: numberTreasure,
    SPEARMEN: numberSpearman,
    DRAGONS: numberDragons,
    SEA_MONSTERS: numberSeaMonsters,
    ARCHERS: numberArchers,
    BOW_DEFENDERS: numberBowDefenders,
    SHIPS: numberShips,
    CASTLES: castleCount
  },
  FEATURES: { TELEPORTERS: teleporters }
} = GameConfig;

let seedInput, generateSeedButton;
let seed = 0; // Default seed



// Global Variables
let cols, rows;
let hexGrid = [];
let treasures = [];
let enemies = [];
let ships = [];
let players = [];
let horses = [];
let currentTrappedHexes = [];
let teleportHex1, teleportHex2; // Teleportation hexes
let hasTeleportedThisMove = false; // Flag to prevent multiple teleportations per move
let currentPlayerIndex = 0;
let diceRolls = [];
let gamePhase = GameConfig.GAME_PHASES.INTRO; // Phases: 'intro', 'roll', 'select', 'move', 'battle', 'gameover', 'confirmMove', 'end', 'noMove', 'battleEnd'
let gameResult = ''; // 'victory' or 'defeat' for the game over screen
let message = ''; // To display feedback messages
let font;

// Variables for Dice Selection
let selectedDiceIndices = []; // Indices of selected dice for direction and distance
let selectionPhase = false;
let toggleDiceButton; // New Toggle Dice Button
let diceVisible = GameConfig.DEFAULTS.DICE_VISIBLE; // Variable to track dice visibility

// Variables for Battle Phase
let enemyBattleRoll = 0;
let playerBattleRoll = 0;
let bonus = 0;
let battlePlayer = null; // Global variable to track the player in battle
let battleenemy = null;
let totalPlayerRoll;
let enemyDefeated = false;
let playerDefeated = false
let enemiesHaveMoved = false;


// Global Variables for Buttons
let rollButton;
let nextButton;

// Variable for current movement path
let currentPath = [];

// Variables for Intro Screen
let numPlayers = GameConfig.DEFAULTS.NUM_PLAYERS;
let pathDrawing = GameConfig.FEATURES.PATH_DRAWING;
let onePlayerButton, twoPlayersButton, pathToggleButton, exportToggleButton, startGameButton;
let restartButton; // For the game over screen
;

// Export Button
let exportButton;
let exportShow = GameConfig.FEATURES.EXPORT_BUTTON;

function preload() {
  font = loadFont('wonderland.ttf');
  svgKnight = loadImage('knight.svg');
  svgBowDefender = loadImage('bowdefender.svg');
  svgArcher = loadImage('archer.svg');
  svgSpearman = loadImage('spearman.svg');
  svgDragon = loadImage('dragon.svg');
  svgKraken = loadImage('kraken.svg');
  svgHorse = loadImage('horse.svg');
}



function getNextStepTowards(start, target) {
  let bestStep = null;
  let minDist = Infinity;

  for (let direction of GameConfig.CUBE_DIRECTIONS) {
    let nextHexCoords = {
      x: start.gridX + direction.x,
      y: start.gridY + direction.y,
      z: start.gridZ + direction.z
    };

    let targetObj = { gridX: target.gridX, gridY: target.gridY, gridZ: target.gridZ };
    let distVal = cubeDistance(
      { gridX: nextHexCoords.x, gridY: nextHexCoords.y, gridZ: nextHexCoords.z },
      targetObj
    );
    if (distVal < minDist) {
      minDist = distVal;
      bestStep = nextHexCoords;
    }
  }

  return bestStep;
}

/**
 * Calculates the grid dimensions based on canvas size.
 */
function calculateGridDimensions() {
  cols = ceil(width / (GameConfig.HEX_SIZE * 1.5)) + 1; // Number of columns to cover the width
  rows = ceil(height / (GameConfig.HEX_SIZE * sqrt(3))) + 1; // Number of rows to cover the height
}



/**
 * Populates the hex grid with hexagons based on terrain.
 */
function populateHexGrid() {
  hexGrid = [];

  // Adjust the ranges of q and r to cover the screen
  for (let q = -cols; q <= cols; q++) {
    for (let r = -rows; r <= rows; r++) {
      let { x, y } = calculateHexPosition(q, r, width, height);

      // Proceed only if the hex is within the canvas bounds
      if (x < -GameConfig.HEX_SIZE || x > width + GameConfig.HEX_SIZE || y < -GameConfig.HEX_SIZE || y > height + GameConfig.HEX_SIZE) {
        continue; // Skip hexes outside the canvas
      }

      let { cubeX, cubeY, cubeZ } = calculateCubeCoordinates(q, r);
      hexGrid.push(new Hexagon(q, r, x, y, GameConfig.HEX_SIZE, seed));
    }
  }
}

/**
 * Checks if a hex is occupied by any element (player, enemy, teleporter, treasure, ship, trap).
 * @param {Hexagon} hex - The hexagon to check.
 * @returns {boolean} - True if the hex is occupied, false otherwise.
 */
function isHexOccupied(hex) {
  // Check if any player is on the hex
  let playerOnHex = players.some(p => p.gridX === hex.cubeX && p.gridY === hex.cubeY && p.gridZ === hex.cubeZ);

  // Check if any enemy is on the hex
  let enemyOnHex = enemies.some(m => m.gridX === hex.cubeX && m.gridY === hex.cubeY && m.gridZ === hex.cubeZ);

  // Check if the hex is a teleporter
  let isTeleporterHex = (hex.type === 'teleporter');

  // Check if any treasure is on the hex
  let treasureOnHex = treasures.some(t => t.hex.cubeX === hex.cubeX && t.hex.cubeY === hex.cubeY && t.hex.cubeZ === hex.cubeZ);

  // Check if any ship is on the hex
  let shipOnHex = ships.some(s => s.gridX === hex.cubeX && s.gridY === hex.cubeY && s.gridZ === hex.cubeZ);

  // Check if the hex has a trap
  let hexHasTrap = hex.hasTrap;

  return playerOnHex || enemyOnHex || isTeleporterHex || treasureOnHex || shipOnHex || hexHasTrap;
}

/**
 * Places horses on the map.
 */
function placeHorses() {
  horses = [];
  let landHexes = hexGrid.filter(hex => 
    isLandHex(hex) && 
    hex.type !== 'mountain' && 
    hex.type !== 'castle' && 
    hex.type !== 'beach' && 
    isHexFullyVisible(hex)
  );

  for (let i = 0; i < numberHorses; i++) { // Adjust the number of horses as needed
    if (landHexes.length === 0) break;
    let randomHex = random(landHexes);
    if (!horses.some(h => h.gridX === randomHex.cubeX && h.gridY === randomHex.cubeY && h.gridZ === randomHex.cubeZ)) {
      horses.push(new Horse(randomHex));
      landHexes = landHexes.filter(h => h !== randomHex); // Prevent duplicates
    }
  }
}

/**
 * Places traps on the map.
 */
function placeTraps() {
  let landHexes = hexGrid.filter(hex => 
    isLandHex(hex) && 
    hex.type !== 'castle' && 
    hex.type !== 'teleporter' && 
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex) // Ensure the hex is not occupied
  );

  // Ensure there are enough land hexes to place traps
  if (landHexes.length < numberTraps) {
    console.error("Not enough land hexes to place traps.");
    return;
  }

  for (let i = 0; i < numberTraps; i++) {
    let randomHex = random(landHexes);
    // Assign a trap to the hex
    randomHex.hasTrap = true;
    // Remove the hex from the pool to prevent multiple traps on the same hex
    landHexes = landHexes.filter(h => h !== randomHex);
  }
}


/**
 * Places teleporters on the map.
 */
/**
 * Places teleporters on the map, avoiding occupied hexes.
 */
function placeTeleporters() {
  if (!teleporters) return;
  // Filter land hexes excluding castles and occupied hexes
  let landHexes = hexGrid.filter(hex => 
    isLandHex(hex) && 
    hex.type !== 'castle' && 
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex) // Ensure the hex is not occupied
  );

  // Ensure there are enough land hexes to place teleporters
  if (landHexes.length < 2) {
    console.error("Not enough land hexes to place teleporters.");
    return;
  }

  // Randomly select two distinct hexes
  teleportHex1 = random(landHexes);
  landHexes = landHexes.filter(hex => hex !== teleportHex1);
  teleportHex2 = random(landHexes);

  // Set their type to 'teleporter'
  teleportHex1.type = 'teleporter';
  teleportHex2.type = 'teleporter';
}


/**
 * Places treasures on the map, avoiding occupied hexes.
 */
function placeTreasures() {
  treasures = [];
  let allHexes = hexGrid.filter(hex => isHexFullyVisible(hex) && !isHexOccupied(hex)); // Use only fully visible and unoccupied hexes

  for (let i = 0; i < numberTreasure; i++) {
    if (allHexes.length === 0) break;
    let randomHex = random(allHexes);
    treasures.push({ hex: randomHex, collected: false });
    allHexes = allHexes.filter(h => h !== randomHex); // Remove to prevent duplicates
  }
}

/**
 * Places castles on the map.
 */
function placeCastles() {
  let suitableHexes = hexGrid.filter(hex => isLandHex(hex) && hex.type !== 'mountain' && isHexFullyVisible(hex));

  for (let i = 0; i < castleCount; i++) {
    if (suitableHexes.length === 0) break;
    let randomHex = random(suitableHexes);
    randomHex.type = 'castle';
    suitableHexes = suitableHexes.filter(h => h !== randomHex);
    
    let neighbors = getNeighbors(randomHex.cubeX, randomHex.cubeY, randomHex.cubeZ);
    neighbors.forEach(neighborCoords => {
      let neighborHex = getHexAt(neighborCoords.x, neighborCoords.y, neighborCoords.z);
      if (neighborHex) {
        neighborHex.castleVicinity = true;
      }
    });
  }
}


/**
 * Places enemies on the map, avoiding occupied hexes.
 */
function placeenemies() {
  enemies = [];
  let landHexes = hexGrid.filter(hex => 
    isLandHex(hex) && 
    hex.type !== 'mountain' && 
    hex.type !== 'castle' && 
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex) // Ensure the hex is not occupied
  );

  // Place regular enemies
  for (let i = 0; i < numberSpearman; i++) {
    if (landHexes.length === 0) break;
    let randomHex = random(landHexes);
    enemies.push(new enemy(randomHex));
    landHexes = landHexes.filter(h => h !== randomHex); // Prevent duplicates
  }

  // Place Dragon enemies
  for (let i = 0; i < numberDragons; i++) {
    if (landHexes.length === 0) break;
    let DragonHex = random(landHexes);
    enemies.push(new DragonEnemy(DragonHex));
    landHexes = landHexes.filter(h => h !== DragonHex);
  }
  
    // Place Sea Monsters
  for (let i = 0; i < numberSeaMonsters; i++) {
      let waterHexes = hexGrid.filter(hex => 
    isWaterHex(hex));
    
    if (waterHexes.length === 0) break;
    let seaMonsterHex = random(waterHexes);
    enemies.push(new SeaMonster(seaMonsterHex));
    waterHexes = waterHexes.filter(h => h !== seaMonsterHex); // Prevent duplicates
  }

  // Place archers
  for (let i = 0; i < numberArchers; i++) {
    if (landHexes.length === 0) break;
    let archerHex = random(landHexes);
    enemies.push(new Archer(archerHex));
    landHexes = landHexes.filter(h => h !== archerHex); // Prevent duplicates
  }

  // Place BowDefenders
  let possibleDefenderHexes = [];

  // Collect neighbor hexes next to treasures
  for (let treasure of treasures) {
    let neighborHexes = getNeighbors(treasure.hex.cubeX, treasure.hex.cubeY, treasure.hex.cubeZ)
      .map(coords => getHexAt(coords.x, coords.y, coords.z))
      .filter(hex => hex && isLandHex(hex) && !isHexOccupied(hex));

    possibleDefenderHexes = possibleDefenderHexes.concat(neighborHexes);
  }

  // Collect neighbor hexes next to teleporters
  if (teleporters && teleportHex1 && teleportHex2) {
    let teleportHexes = [teleportHex1, teleportHex2];
    for (let teleHex of teleportHexes) {
      if (!teleHex) continue; // Skip if undefined
      let neighborHexes = getNeighbors(teleHex.cubeX, teleHex.cubeY, teleHex.cubeZ)
        .map(coords => getHexAt(coords.x, coords.y, coords.z))
        .filter(hex => hex && isLandHex(hex) && !isHexOccupied(hex));

      possibleDefenderHexes = possibleDefenderHexes.concat(neighborHexes);
    }
  }

  // Remove duplicates from possibleDefenderHexes
  possibleDefenderHexes = [...new Set(possibleDefenderHexes)];

  // Filter out any hexes that are now occupied
  possibleDefenderHexes = possibleDefenderHexes.filter(hex => !isHexOccupied(hex));

  // Limit to numberBowDefenders
  let defendersToPlace = Math.min(numberBowDefenders, possibleDefenderHexes.length);

  // Randomly select hexes for BowDefenders
  for (let i = 0; i < defendersToPlace; i++) {
    if (possibleDefenderHexes.length === 0) break;
    let index = floor(random(possibleDefenderHexes.length));
    let defenderHex = possibleDefenderHexes.splice(index, 1)[0];
    enemies.push(new BowDefender(defenderHex));
    landHexes = landHexes.filter(h => h !== defenderHex); // Prevent duplicates
  }

}

/**
 * Places ships on the map, avoiding occupied hexes.
 */
function placeShips() {
  ships = [];
  let edgeWaterHexes = hexGrid.filter(hex => isEdgeWaterHexLocal(hex) && isHexFullyVisible(hex) && !isHexOccupied(hex));

  for (let i = 0; i < numberShips; i++) {
    if (edgeWaterHexes.length === 0) break;
    let randomHex = random(edgeWaterHexes);
    ships.push(new Ship(randomHex));
    edgeWaterHexes = edgeWaterHexes.filter(h => h !== randomHex); // Remove to prevent duplicates
  }
}

/**
 * Retrieves a hexagon at specific cube coordinates.
 * @param {number} cubeX - Cube coordinate x.
 * @param {number} cubeY - Cube coordinate y.
 * @param {number} cubeZ - Cube coordinate z.
 * @returns {Hexagon|null} - The hexagon if found, else null.
 */
function getHexAt(cubeX, cubeY, cubeZ) {
  return hexGrid.find(hex => hex.cubeX === cubeX && hex.cubeY === cubeY && hex.cubeZ === cubeZ) || null;
}

/**
 * Local implementation of edge water hex checking
 * @param {Object} hex - The hexagon to check
 * @returns {boolean} - True if edge water hex
 */
function isEdgeWaterHexLocal(hex) {
  if (hex.type !== 'water') return false;
  let neighbors = getNeighbors(hex.cubeX, hex.cubeY, hex.cubeZ);
  return neighbors.some(neighbor => {
    let neighborHex = getHexAt(neighbor.x, neighbor.y, neighbor.z);
    return neighborHex && isLandHex(neighborHex);
  });
}

/**
 * Checks if a hex is fully visible within the canvas boundaries.
 * @param {Hexagon} hex - The hexagon to check.
 * @returns {boolean} - True if fully visible, false otherwise.
 */
function isHexFullyVisible(hex) {
  // Calculate the positions of the hex's corners
  const cornerDistance = GameConfig.HEX_SIZE; // Since HEX_SIZE is the distance from center to corner
  const left = hex.x - cornerDistance;
  const right = hex.x + cornerDistance;
  const top = hex.y - cornerDistance;
  const bottom = hex.y + cornerDistance;

  // Check if all corners are within the canvas boundaries
  return left >= 0 && right <= width && top >= 0 && bottom <= height;
}

/**
 * Displays the hex grid.
 */
function displayHexGrid() {
  for (let hex of hexGrid) {
    hex.display(); // Defaults to main canvas
  }
}

/**
 * Displays ships on the map.
 */
function displayShips() {
  for (let ship of ships) {
    ship.display(); // Defaults to main canvas
  }
}

/**
 * Displays horses on the map.
 */
function displayHorses() {
  for (let horse of horses) {
    horse.display(); // Defaults to main canvas
  }
}

/**
 * Displays players on the map.
 */
function displayPlayers() {
  for (let player of players) {
    player.display(); // Defaults to main canvas
  }
}

/**
 * Displays player movement paths.
 */
function displayPlayerPaths() {
  for (let player of players) {
    if (player.history.length > 1) {
      stroke(player.color);
      strokeWeight(2);
      noFill();
      beginShape();
      for (let pos of player.history) {
        vertex(pos.x, pos.y);
      }
      endShape();
    }
  }
}

/**
 * Displays treasures on the map.
 */
function displayTreasures() {
  for (let treasure of treasures) {
    if (!treasure.collected) {
      fill(255, 223, 0);
      strokeWeight(2);
      stroke(0);
      ellipse(treasure.hex.x, treasure.hex.y, GameConfig.HEX_SIZE / 2, GameConfig.HEX_SIZE / 2);
    }
  }
}

/**
 * Displays enemies on the map.
 */
function displayenemies() {
  for (let enemy of enemies) {
    enemy.display(); // Defaults to main canvas
  }
}

/**
 * Displays direction numbers around the current player.
 */
function displayDirectionNumbers() {

  if ((gamePhase === 'battle') || (gamePhase === 'battleEnd')) return;
  
  if (players.length === 0) return; // No players initialized

  let currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer.alive) return; // Skip if current player is not alive

  let playerHex = getHexAt(currentPlayer.gridX, currentPlayer.gridY, currentPlayer.gridZ);

  if (playerHex) {
    // Get all neighbors
    let neighbors = getNeighbors(playerHex.cubeX, playerHex.cubeY, playerHex.cubeZ);

    for (let i = 0; i < GameConfig.CUBE_DIRECTIONS.length; i++) {
      let direction = GameConfig.CUBE_DIRECTIONS[i];
      let neighborCoords = {
        x: playerHex.cubeX + direction.x,
        y: playerHex.cubeY + direction.y,
        z: playerHex.cubeZ + direction.z
      };
      let neighborHex = getHexAt(neighborCoords.x, neighborCoords.y, neighborCoords.z);
      if (neighborHex) {
        // Draw the direction number on the neighbor
        fill(255);
        stroke(0);
        strokeWeight(3);
        textSize(24);
        textAlign(CENTER, CENTER);
        text(i + 1, neighborHex.x, neighborHex.y);
      }
    }
  }
}

/**
 * Displays dice roll instructions and information.
 */
function displayDiceRoll() {
  
  textSize(20);
  fill(255);
  textAlign(LEFT, TOP);

  if (players.length === 0) return; // No players initialized

  let currentPlayer = players[currentPlayerIndex];

  // If the current player is not alive, skip displaying their info
  if (!currentPlayer.alive) return;

  text(`${seed} `, width-100, 20);
  if (gamePhase === 'roll') {
    text(`Player ${currentPlayer.index + 1} - ${currentPlayer.getCurrentDiceCount()} horses ${currentPlayer.treasures} treasure `, 10, 20);
  } else if (selectionPhase) {
    text(`Player ${currentPlayer.index + 1} - ${currentPlayer.getCurrentDiceCount()} horses ${currentPlayer.treasures} treasure `, 10, 20);
    text(`Select Dice for Direction and Distance`, 10, 50);
  } else if (gamePhase === 'move') {
    text(`Player ${currentPlayer.index + 1} has moved.`, 10, 20);
  } else if (gamePhase === 'battle') {
    text(`Battle Phase: Click 'Roll Dice' to fight.`, 10, 20);
  } else if (gamePhase === 'end') {
    text(`Game Over! Click 'Next' to continue.`, 10, 20);
  }
}

/**
 * Displays feedback messages to the player.
 */
function displayMessage() {
  if (message !== '') {
    textSize(16);
    fill(255, 0, 0);
    textAlign(CENTER, TOP);
    text(message, width / 2, 80); // Adjusted position for better visibility
  }
}

/**
 * Displays dice on the canvas based on the current game phase.
 */
/**
 * Displays dice on the canvas based on the current game phase.
 */
function displayDice() {
  if (!diceVisible) return; // Only display dice if diceVisible is true
  
  let currentPlayer = players[currentPlayerIndex];
  let diceCount = currentPlayer.getCurrentDiceCount();
  
  // Position dice at the bottom of the canvas
  let dieSize = 80; // Adjust size as needed
  let dieSpacing = 15;
  let totalWidth = diceCount * dieSize + (diceCount - 1) * dieSpacing; // Updated for variable dice
  let startX = (width - totalWidth) / 2;
  let dieY = height - dieSize - 150; // Adjusted to accommodate buttons

  // Display player's dice during 'select', 'confirmMove', and 'end' phases
  if (selectionPhase || gamePhase === 'confirmMove') {
    for (let i = 0; i < diceCount; i++) {
      let dieX = startX + i * (dieSize + dieSpacing);
      drawDie(dieX, dieY, dieSize, diceRolls[i], 'player');
    }

    // Highlight selected dice
    for (let i = 0; i < selectedDiceIndices.length; i++) {
      let dieIndex = selectedDiceIndices[i];
      if (dieIndex >= diceCount) continue; // Prevent out-of-bounds
      let dieX = startX + dieIndex * (dieSize + dieSpacing);
      let dieYPos = dieY;
      stroke(i === 0 ? '#F44336' : '#2196F3'); // Red for direction, Blue for distance
      strokeWeight(5);
      noFill();
      rect(dieX - 5, dieYPos - 5, dieSize + 10, dieSize + 10, 10); // Rounded corners
      noStroke();
    }
  }

  // Display enemy's die during 'battle' or 'end' phase
  if (gamePhase === 'battle' || gamePhase === 'battleEnd' || gamePhase === 'end') {
    let enemyDieSize = 100;
    let enemyDieX = width / 2 - enemyDieSize / 2;
    let enemyDieY = height / 2 - enemyDieSize / 2;
    drawDie(enemyDieX, enemyDieY, enemyDieSize, enemyBattleRoll, 'enemy', enemyDefeated);
    textSize(16);
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text("Enemy's Roll", width / 2, enemyDieY + enemyDieSize + 20);

    // If player has rolled, display their die
    if (playerBattleRoll > 0) {
      let playerDieSize = 100;
      let playerDieX = width / 2 - playerDieSize / 2;
      let playerDieY = height / 2 + enemyDieSize; // Below enemy's die

      drawDie(playerDieX, playerDieY, playerDieSize, totalPlayerRoll, 'player', playerDefeated);
      textSize(16);
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      text(`Roll ${playerBattleRoll} + ${totalPlayerRoll - playerBattleRoll - bonus} treasures + ${bonus} castle bonus`, width / 2, playerDieY + playerDieSize + 20);
    }
  }
}

/**
 * Draws a die face on the given graphics context.
 * @param {number} x - X-coordinate of the die.
 * @param {number} y - Y-coordinate of the die.
 * @param {number} size - Size of the die.
 * @param {number} value - Die value (1-6 or higher).
 * @param {string} role - 'player' or 'enemy'.
 * @param {boolean} dead - Whether to display a 'dead' indicator.
 */
function drawDie(x, y, size, value, role, dead) {
  push();
  translate(x, y);

  // Set die color based on role
  if (role === 'enemy') {
    fill(0); // Black die for enemy
  } else if (role === 'player') {
    fill(255); // White die for player
  } else {
    fill(255); // Default to white
  }

  stroke(0);
  strokeWeight(2);
  rect(0, 0, size, size, 10); // Draw die background with rounded corners

  if (dead === true) {
    stroke(255, 0, 0); // Red 'X' for clarity
    strokeWeight(5);
    line(0, 0, size, size);
    line(size, 0, 0, size);
  }

  // Set dot properties
  if (role === 'player') {
    fill(0); // Black dots on white die
  } else {
    fill(255); // White dots on black die
  }
  noStroke();
  let dotSize = size / 8;
  let offset = size / 4;

  if (value <= 6) {
    // Positions based on die value
    let positions = {
      1: [[size / 2, size / 2]],
      2: [[offset, offset], [size - offset, size - offset]],
      3: [[offset, offset], [size / 2, size / 2], [size - offset, size - offset]],
      4: [
        [offset, offset],
        [offset, size - offset],
        [size - offset, offset],
        [size - offset, size - offset]
      ],
      5: [
        [offset, offset],
        [offset, size - offset],
        [size / 2, size / 2],
        [size - offset, offset],
        [size - offset, size - offset]
      ],
      6: [
        [offset, offset],
        [offset, size / 2],
        [offset, size - offset],
        [size - offset, offset],
        [size - offset, size / 2],
        [size - offset, size - offset]
      ]
    };

    let dots = positions[value] || [];

    for (let pos of dots) {
      ellipse(pos[0], pos[1], dotSize, dotSize);
    }
  } else {
    // For values greater than 6, display the number
    fill(role === 'player' ? 0 : 255);
    textSize(size / 2);
    textAlign(CENTER, CENTER);
    text(value, size / 2, size / 2);
  }

  pop();
}

/**
 * Exports the current game map as an SVG file.
 */
function exportSVG() {
  let svgCanvas = createGraphics(width, height, SVG);
  svgCanvas.background(220); // Set background color (optional)

  // Draw hexes
  for (let hex of hexGrid) {
    hex.display(svgCanvas); // Use the same display method with SVG context
  }

  // Draw treasures
  for (let treasure of treasures) {
    if (!treasure.collected) {
      svgCanvas.fill(255, 223, 0);
      svgCanvas.noStroke();
      svgCanvas.ellipse(treasure.hex.x, treasure.hex.y, GameConfig.HEX_SIZE / 2, GameConfig.HEX_SIZE / 2);
    }
  }

  // Draw ships
  for (let ship of ships) {
    if (ship.carriedBy === null) {
      ship.display(svgCanvas);
    }
  }

  // Draw enemies
  for (let enemy of enemies) {
    enemy.display(svgCanvas);
  }

    // Draw horses
  for (let horse of horses) {
    if (horse.carriedBy === null) {
      horse.display(svgCanvas);
    }
  }
  
  // Draw players
  for (let player of players) {
    player.display(svgCanvas);
  }

  // Optionally, draw paths, highlights, or other game elements here

  // Save the SVG file
  svgCanvas.save(`${seed}_HexQuest_Map.svg`);
}

/**
 * Handles key presses for additional controls.
 */
function keyPressed() {
  // Optional keyboard controls
  if (key.toLowerCase() === 'r') {
    if (gamePhase === 'roll') {
      rollDice();
    } else if (gamePhase === 'battle') {
      rollBattleDice();
    }
  }
  if (key.toLowerCase() === 's') {
    exportSVG();
  }
}

/**
 * Handles mouse press events for dice selection and button interactions.
 */
function mousePressed() {
    const activePhases = ['roll', 'select', 'confirmMove', 'battle', 'battleEnd', 'end', 'noMove'];
  if (!activePhases.includes(gamePhase)) {
    return; // Exit early if not in an active phase
  }

  // Ensure there is a current player
  if (!players || players.length === 0 || currentPlayerIndex >= players.length) {
    console.error('No current player found.');
    return;
  }

  let currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) {
    console.error('Current player is undefined.');
    return;
  }
  
  let diceCount = currentPlayer.getCurrentDiceCount();
  

  // Get the positions and sizes of buttons
  let rollButtonX = rollButton.position().x;
  let rollButtonY = rollButton.position().y;
  let rollButtonW = rollButton.size().width;
  let rollButtonH = rollButton.size().height;

  let nextButtonX = nextButton.position().x;
  let nextButtonY = nextButton.position().y;
  let nextButtonW = nextButton.size().width;
  let nextButtonH = nextButton.size().height;

  // Check if click is on Roll Button
  let clickOnRollButton = mouseX >= rollButtonX && mouseX <= rollButtonX + rollButtonW &&
                          mouseY >= rollButtonY && mouseY <= rollButtonY + rollButtonH;

  // Check if click is on Next Button
  let clickOnNextButton = mouseX >= nextButtonX && mouseX <= nextButtonX + nextButtonW &&
                          mouseY >= nextButtonY && mouseY <= nextButtonY + nextButtonH;

  // Handle Dice Selection Clicks Only If in 'select' Phase or 'battle' Phase
  if ((gamePhase === 'select' && selectionPhase) || (gamePhase === 'battle' && playerBattleRoll === 0)) {
    // Check if a die was clicked
    let dieSize = 80;
    let dieSpacing = 15;
    let totalWidth = diceCount * dieSize + (diceCount - 1) * dieSpacing; // Updated for variable dice
    //let totalWidth = NUM_DICE * dieSize + (NUM_DICE - 1) * dieSpacing; // Updated for variable dice
    let startX = (width - totalWidth) / 2;
    let dieY = height - dieSize - 150;

    let dieClicked = false;
    for (let i = 0; i < diceCount; i++) {
      let dieX = startX + i * (dieSize + dieSpacing);
      if (mouseX >= dieX && mouseX <= dieX + dieSize &&
          mouseY >= dieY && mouseY <= dieY + dieSize) {
        dieClicked = true;
        if (gamePhase === 'select' && selectionPhase) {
          selectDice(i);
        } else if (gamePhase === 'battle') {
          // Player clicks to roll their battle die
          rollBattleDice();
        }
        break;
      }
    }

    if (!dieClicked && !clickOnRollButton && !clickOnNextButton) {
      // Clicked outside dice and buttons, deselect dice
      selectedDiceIndices = [];
      console.log('Deselected dice.');

      // If in 'confirmMove' phase, cancel movement
      if (gamePhase === 'confirmMove') {
        console.log('Movement canceled.');
        for (let hex of currentPath) {
          hex.highlighted = false;
        }
        currentPath = [];
        gamePhase = 'select';
        message = 'Movement canceled. Please select your dice again.';
        selectedDiceIndices = [];
        // Hide Next button and show Roll Dice button
        nextButton.hide();
        rollButton.show();
      }
    }
  } else if (gamePhase === 'confirmMove') {
    if (!clickOnNextButton) {
      // User clicked away, cancel movement
      console.log('Movement canceled.');
      for (let hex of currentPath) {
        hex.highlighted = false;
      }
      currentPath = [];
      gamePhase = 'select';
      message = 'Movement canceled. Please select your dice again.';
      selectedDiceIndices = [];
      // Hide Next button and show Roll Dice button
      nextButton.hide();
      rollButton.hide();
    }
  }
}

function setup() {
  // Make the canvas responsive
  createCanvas(windowWidth, windowHeight); // Reserve some space for buttons

  
  // Create Seed Input and Buttons
  seedInput = createInput();
  seedInput.attribute('placeholder', 'Enter Seed');
  seedInput.size(192, 30);
  seedInput.position(width / 2 - 100, height / 2 + 140);

  generateSeedButton = createButton('Generate Seed');
  generateSeedButton.size(120, 30);
  generateSeedButton.position(width / 2-60, height / 2 + 175);
  generateSeedButton.mousePressed(() => {
    seed = floor(random(1, 1000000)); // Generate a random seed
    seedInput.value(seed);
    console.log(`Generated Seed: ${seed}`);
  });

  // Create Roll Dice Button
  rollButton = createButton('Roll Dice');
  let buttonWidth = 100;
  let buttonHeight = 40;
  rollButton.size(buttonWidth, buttonHeight);
  rollButton.style('font-size', '16px');
  rollButton.style('background-color', '#4CAF50');
  rollButton.style('color', 'white');
  rollButton.style('border', 'none');
  rollButton.style('border-radius', '5px');
  rollButton.position(width / 2 - buttonWidth / 2, height - 70); // Centered
  rollButton.mousePressed(() => {
    if (gamePhase === 'roll') {
      rollDice();
    } else if (gamePhase === 'battle') {
      rollBattleDice();
    }
  });
  
    // Create Toggle Dice Button
  toggleDiceButton = createButton('Toggle Dice');
  toggleDiceButton.size(100, 40);
  toggleDiceButton.style('font-size', '16px');
  toggleDiceButton.style('background-color', '#FF5722');
  toggleDiceButton.style('color', 'white');
  toggleDiceButton.style('border', 'none');
  toggleDiceButton.style('border-radius', '5px');
  toggleDiceButton.position(width - 100, height - 70); // Bottom right corner
  toggleDiceButton.mousePressed(() => {
    diceVisible = !diceVisible;
  });
  toggleDiceButton.hide(); // Initially hide the button

    // Create Next Button
  nextButton = createButton('Next');
  nextButton.size(buttonWidth, buttonHeight);
  nextButton.style('font-size', '16px');
  nextButton.style('background-color', '#008CBA');
  nextButton.style('color', 'white');
  nextButton.style('border', 'none');
  nextButton.style('border-radius', '5px');
  nextButton.position(width / 2 - buttonWidth / 2, height - 70); // Centered

  // Adjusted nextButton.mousePressed() function
  // This handler ensures that confirmMove() is only called during the 'confirmMove' phase
  nextButton.mousePressed(() => {
    if (gamePhase === 'confirmMove') {
      confirmMove(); // Directly call confirmMove
    } else if (gamePhase === 'battle' || gamePhase === 'battleEnd' || gamePhase === 'end') {
      if (gamePhase === 'end') {
        // Transition to game over screen
        gamePhase = 'gameover';
      } else {
        endTurn(); // Ensure this function is defined to handle end of turn
      }
    } else if (gamePhase === 'noMove') {
      // Proceed to end turn
      endTurn();
    }
  });

  
/**
 * Confirms the player's movement, applies trap effects, and progresses the game.
 */
function confirmMove() {
  console.log('confirmMove function called.'); // Debugging statement
  let currentPlayer = players[currentPlayerIndex];
  
  // Apply trap reductions based on recorded traps
  if (currentTrappedHexes.length > 0) {
    let trapsTriggered = currentTrappedHexes.length;
    for (let trapHex of currentTrappedHexes) {
      // Remove the trap from the hex
      trapHex.hasTrap = false;
      console.log(`Trap at (${trapHex.cubeX}, ${trapHex.cubeY}, ${trapHex.cubeZ}) removed.`);
    }
    // Reduce player's baseDice by the number of traps triggered
    for (let i = 0; i < trapsTriggered; i++) {
      currentPlayer.reduceBaseDice();
    }
    message += ` You triggered ${trapsTriggered} trap(s) and lost ${trapsTriggered} movement die(s).`;
  } else {
    message += ` Movement confirmed with no traps encountered.`;
  }
  
  // Move the player along the currentPath
  for (let i = 1; i < currentPath.length; i++) { // Start from 1 to skip the starting hex
    let hex = currentPath[i];
    movePlayerToHex(hex); // Function to update player's position
    console.log(`Player moved to (${hex.cubeX}, ${hex.cubeY}, ${hex.cubeZ}).`);
    
// Handle Teleporters with hasTeleportedThisMove flag
if (hex.type === 'teleporter' && !hasTeleportedThisMove) {
  let destination = (hex === teleportHex1) ? teleportHex2 : teleportHex1;
  movePlayerToHex(destination); // Teleport the player
  console.log(`Player teleported to (${destination.cubeX}, ${destination.cubeY}, ${destination.cubeZ}).`);
  message += ` Teleported to (${destination.cubeX}, ${destination.cubeY}, ${destination.cubeZ}).`;
  
  // Set the flag to prevent multiple teleportations in the same move
  hasTeleportedThisMove = true;
}
    
    // Collect treasures, horses, ships
    collectTreasure(hex);
    collectHorse(hex);
    collectShip(hex);
    
    // Check for enemies on the current hex
    let enemyOnHex = enemies.find(enemy => 
      enemy.alive &&
      enemy.gridX === hex.cubeX &&
      enemy.gridY === hex.cubeY &&
      enemy.gridZ === hex.cubeZ
    );
    
    if (enemyOnHex) {
      // Initiate battle immediately
      console.log(`Player encountered a enemy at (${hex.cubeX}, ${hex.cubeY}, ${hex.cubeZ}). Initiating battle.`);
      gamePhase = 'battle';
      selectionPhase = false;
      battlePlayer = currentPlayer; // Set the player involved in the battle
      
      // Determine the enemy's battle roll
      initiateBattle(currentPlayer, enemyOnHex);
      
      // Halt further movement
      break;
    }
  }
  
  // Clear highlighted hexes
  for (let hex of currentPath) {
    hex.highlighted = false;
  }
  currentPath = [];
  currentTrappedHexes = []; // Clear trapped hexes after confirmation
  
  // Handle post-move actions
  if (gamePhase === 'battle') {
    // Show Roll Dice button and hide Next button during battle setup
    rollButton.show();
    nextButton.hide();
  } else {
    // Proceed to end turn
    endTurn();
  }
  
  // Hide Next button and show Roll Dice button for next player
  nextButton.hide();
  rollButton.show();
}
  
// Adjusted endTurn() function
function endTurn() {
  // Reset highlighted hexes
  for (let hex of hexGrid) {
    hex.highlighted = false;
  }

  // Check if all players are defeated
  if (players.every(player => !player.alive)) {
    gamePhase = 'end';
    gameResult = 'defeat';
    nextButton.show(); // Show Next button to proceed to game over
    return;
  }

  // Determine if the battle was initiated during the enemies' turn
  if (gamePhase === 'battle' || gamePhase === 'battleEnd') {
    if (enemiesHaveMoved) {
      // Battle was during enemies' turn
      // Reset for new round
      enemiesHaveMoved = false;
      for (let player of players) {
        player.hasMoved = false;
      }
      // Set game phase to player's turn
      gamePhase = 'roll';
      currentPlayerIndex = players.findIndex(player => player.alive);
    } else {
      // Battle was during player's turn
      // Mark that the current player has finished their turn
      players[currentPlayerIndex].hasMoved = true;
      proceedToNextPlayerOrenemy();
    }
  } else {
    // Not in battle
    // Mark that the current player has finished their turn
    players[currentPlayerIndex].hasMoved = true;
    proceedToNextPlayerOrenemy();
  }

  // Reset battle variables
  diceRolls = [];
  selectedDiceIndices = [];
  message = '';
  enemyDefeated = false;
  playerDefeated = false;

  nextButton.hide();
  rollButton.show();
}
  
  nextButton.hide(); // Initially hide the Next button

  // Initialize Game Variables
  gamePhase = 'intro'; // Start in intro phase

  // Create Intro Screen Buttons
  onePlayerButton = createButton('1 Player');
  onePlayerButton.size(100, 40);
  onePlayerButton.position(width / 2 - 160, height / 2);
  onePlayerButton.mousePressed(() => {
    numPlayers = 1;
    onePlayerButton.style('background-color', '#4CAF50');
    twoPlayersButton.style('background-color', '');
  });

  twoPlayersButton = createButton('2 Players');
  twoPlayersButton.size(100, 40);
  twoPlayersButton.position(width / 2 + 60, height / 2);
  twoPlayersButton.mousePressed(() => {
    numPlayers = 2;
    onePlayerButton.style('background-color', '');
    twoPlayersButton.style('background-color', '#4CAF50');
  });
  onePlayerButton.style('background-color', '#4CAF50'); // Default selection

  pathToggleButton = createButton('Path Drawing: Off');
  pathToggleButton.size(200, 40);
  pathToggleButton.position(width / 2 - 100, height / 2 + 60);
  pathToggleButton.mousePressed(() => {
    pathDrawing = !pathDrawing;
    pathToggleButton.html(`Path Drawing: ${pathDrawing ? 'On' : 'Off'}`);
  });
  
  exportToggleButton = createButton('Export Button: Off');
  exportToggleButton.size(200, 40);
  exportToggleButton.position(width / 2 - 100, height / 2 + 100);
  exportToggleButton.mousePressed(() => {
    exportShow = !exportShow;
    exportToggleButton.html(`Export: ${exportShow ? 'On' : 'Off'}`);
  });

  startGameButton = createButton('Start Game');
  startGameButton.size(200, 40);
  startGameButton.style('font-size', '16px');
  startGameButton.style('background-color', '#4CAF50');
  startGameButton.style('color', 'white');
  startGameButton.position(width / 2 - 100, height / 2 + 220);
  startGameButton.mousePressed(() => {
    
  seedInput.hide();
  generateSeedButton.hide(); 

    
    if (seedInput.value() !== '') {
      seed = parseInt(seedInput.value());
      if (isNaN(seed)) {
        alert('Please enter a valid numerical seed.');
        return;
      }
      initializeGameWithSeed(seed);
    } else {
      // If no seed is provided, generate one
      seed = floor(random(1, 1000000));
      initializeGameWithSeed(seed);
    }
    gamePhase = 'roll';
    hideIntroButtons();
    rollButton.show();
    
    if (exportShow){
      exportButton.show(); // Show Export Button
    } else {
      exportButton.hide(); // hide Export Button
    }
    loop(); // Start the draw loop
  });

  // Create Restart Button
  restartButton = createButton('Restart');
  restartButton.size(200, 40);
  restartButton.position(width / 2 - 100, height / 2 + 60);
  restartButton.mousePressed(() => {
    
    gamePhase = 'intro';
  seedInput.show();
  generateSeedButton.show(); 

    
    showIntroButtons();
    restartButton.hide();
    nextButton.hide(); // Hide Next button when restarting
    loop(); // Restart the draw loop
  });
  restartButton.hide(); // Initially hide

  // Create Export SVG Button
  exportButton = createButton('Export SVG');
  exportButton.size(120, 40);
  exportButton.style('font-size', '16px');
  exportButton.style('background-color', '#FF9800');
  exportButton.style('color', 'white');
  exportButton.style('border', 'none');
  exportButton.style('border-radius', '5px');
  exportButton.position(0, height - 70); // Positioned near Roll Button
  exportButton.mousePressed(() => {
    exportSVG();
  });
  exportButton.hide(); // Initially hide

  // Hide game buttons initially
  rollButton.hide();
  nextButton.hide();
  exportButton.hide();
  restartButton.hide();
  noLoop(); // Stop the draw loop until the game starts
}



function proceedToNextPlayerOrenemy() {
  // Check if all alive players have moved
  if (players.filter(player => player.alive).every(player => player.hasMoved)) {
    // All players have moved; reset hasMoved flags
    for (let player of players) {
      player.hasMoved = false;
      hasTeleportedThisMove = false;
    }

    // Move enemies
    moveenemies();
    enemiesHaveMoved = true;

    // Check for battles after enemies have moved
    checkForBattles();

    // Handle battle phase if a battle was initiated
    if (gamePhase !== 'battle') {
      // No battle, proceed to the next round
      gamePhase = 'roll';
      currentPlayerIndex = players.findIndex(player => player.alive);
      enemiesHaveMoved = false; // Reset for the next round
    } else {
      // Battle initiated during enemies' turn
      // Wait for player to resolve the battle
    }
  } else {
    // Proceed to the next alive player
    do {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    } while (!players[currentPlayerIndex].alive);
    gamePhase = 'roll';
  }
}



/**
 * Initializes players based on the number of players selected.
 */
function initializePlayers() {
  players = [];
  for (let i = 0; i < numPlayers; i++) {
    // Find a suitable starting hex (land, not mountain, not castle, not occupied)
    let landHexes = hexGrid.filter(hex => 
      isLandHex(hex) && 
      hex.type !== 'mountain' && 
      hex.type !== 'castle' && 
      isHexFullyVisible(hex) &&
      !isHexOccupied(hex)
    );
    
    if (landHexes.length > 0) {
      let startHex = random(landHexes);
      let player = new Player(i, startHex);
      players.push(player);
      
      // Remove the hex from available spots to prevent overlap
      hexGrid = hexGrid.map(hex => {
        if (hex === startHex) {
          hex.occupied = true;
        }
        return hex;
      });
    }
  }
}

/**
 * Initializes the game with a specific seed.
 * @param {number} seedValue - The seed to initialize randomness.
 */
function initializeGameWithSeed(seedValue) {
  // Set the seed for both random and noise functions
  randomSeed(seedValue);
  noiseSeed(seedValue);

  // Initialize Game Variables
  gamePhase = 'roll'; // Start in roll phase
  calculateGridDimensions();
  populateHexGrid();
  placeTreasures();
  placeCastles();
  placeenemies();
  placeShips();
  placeHorses();
  placeTeleporters();
  placeTraps();
  initializePlayers();
  currentPlayerIndex = 0; // Reset player index
  diceRolls = Array(players.length > 0 ? players[0].getCurrentDiceCount() : NUM_DICE).fill(0); // Reset dice based on first player's dice count
  message = ''; // Clear any previous messages
  selectionPhase = false;
  currentPath = [];
  enemyBattleRoll = 0;
  playerBattleRoll = 0;
  
    for (let player of players) {
    player.hasMoved = false;
    enemiesHaveMoved = false;
  }
  
}


/**
 * Resizes the canvas and repositions buttons when the window is resized.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight * 0.9);

  let buttonWidth = 100;
  let buttonHeight = 40;

  // Reposition Roll Button
  rollButton.position(width / 2 - buttonWidth / 2, height - 70);

  // Reposition Next Button
  nextButton.position(width / 2 - buttonWidth / 2, height - 70);

  // Reposition Intro Screen Buttons
  onePlayerButton.position(width / 2 - 160, height / 2);
  twoPlayersButton.position(width / 2 + 60, height / 2);
  pathToggleButton.position(width / 2 - 100, height / 2 + 60);
  exportToggleButton.position(width / 2 - 100, height / 2 + 100); 
  generateSeedButton.position(width / 2-60, height / 2 + 175);
  seedInput.position(width / 2 - 100, height / 2 + 140);
  startGameButton.position(width / 2 - 100, height / 2 + 220);
  toggleDiceButton.position(width - 100, height - 70);

  // Reposition Restart Button
  restartButton.position(width / 2 - 100, height / 2 + 60);

  // Reposition Export Button
  exportButton.position(0, height - 70);
}

/**
 * Hides the intro screen buttons.
 */
function hideIntroButtons() {
  onePlayerButton.hide();
  twoPlayersButton.hide();
  pathToggleButton.hide();
  exportToggleButton.hide();
  startGameButton.hide();
}

/**
 * Shows the intro screen buttons.
 */
function showIntroButtons() {
  onePlayerButton.show();
  twoPlayersButton.show();
  pathToggleButton.show();
  exportToggleButton.show();
  startGameButton.show();
}

function draw() {
  
  if (gamePhase === 'intro') {
    background(220);
    
    fill(0);
    textAlign(CENTER, CENTER);
    image(svgKnight, width/2-30, height/2-290, 60, 60);
    textFont(font);
    textSize(60);
    text('HexQuest', width / 2, height / 2 - 200);
    textFont('Verdana');
    textSize(13.5);

    text('Embark on a quest to protect the kingdom by collecting treasures so that you can defeat footmen, archers and the formidable dragons. Each turn, players choose a six-sided die for their direction followed by distance of movement. Use horses, boats and portals to travel and seek refuge in mountains and castles. Engage in battles near castles to press your advantage.', width / 2 - 200, height / 2 - 140, 400);

    // Buttons are already displayed
    // Hide other elements
    rollButton.hide();
    nextButton.hide();
    exportButton.hide();
    restartButton.hide();
    return;
  }

  if (gamePhase === 'gameover') {  
    textSize(32);  
    textAlign(CENTER, CENTER);
    if (gameResult === 'victory') {
      background(255);
      fill(0);
      text('Victory!', width / 2, height / 2);
    } else if (gameResult === 'defeat') {
      background(0);
      fill(255);
      text('Defeat!', width / 2, height / 2);
    }
    restartButton.show(); // Show Restart button

    // Hide Next button on game over screen
    nextButton.hide();

    return;
  }

  background(220);
  displayHexGrid();
  displayShips();
  displayHorses();
  if (pathDrawing) {
    displayPlayerPaths(); // Display past moves as lines if path drawing is on
  }
  displayPlayers();
  displayTreasures();
  displayenemies();
  displayDirectionNumbers(); // Display direction numbers around current player
  displayDiceRoll();
  displayMessage();
  displayFightHighlights();

    // Control the visibility of the Toggle Dice Button
  if ((gamePhase === 'select' && selectionPhase) || gamePhase === 'confirmMove') {
    toggleDiceButton.show();
  } else {
    toggleDiceButton.hide();
  }
  
  // Display Dice if in 'select', 'confirmMove', 'battle', or 'end' phases
  if (
    (gamePhase === 'select' && selectionPhase) ||
    gamePhase === 'confirmMove' ||
    gamePhase === 'end' ||
    gamePhase === 'battleEnd' ||
    (gamePhase === 'battle' && (playerBattleRoll > 0 || enemyBattleRoll > 0))
  ) {
    displayDice();
  }
  

}

/**
 * Draw Red Ellipses Around Battling Player and enemy
 */
function displayFightHighlights(){
  if (gamePhase === 'battle' || gamePhase === 'battleEnd') {
    if (battlePlayer && battlePlayer.alive) {
      noFill();
      stroke(255, 0, 0); // Red color
      strokeWeight(4);
      ellipse(battlePlayer.x, battlePlayer.y, GameConfig.HEX_SIZE * 1.5, GameConfig.HEX_SIZE * 1.5); // Slightly larger than player
    }

    if (battleenemy && battleenemy.alive) {
      noFill();
      stroke(255, 0, 0); // Red color
      strokeWeight(4);
      ellipse(battleenemy.x, battleenemy.y, GameConfig.HEX_SIZE * 1.5, GameConfig.HEX_SIZE * 1.5); // Slightly larger than enemy
    }
  }
}



/**
 * Moves all enemies towards players.
 */
function moveenemies() {
  for (let enemy of enemies) {
    enemy.moveTowards(players, enemies);
  }
}


/**
 * Rolls the dice for the current player.
 */
function rollDice() {
  if (gamePhase === 'roll') {
    let currentPlayer = players[currentPlayerIndex];
    let diceCount = currentPlayer.getCurrentDiceCount();
    diceRolls = Array(diceCount).fill(0);
    for (let i = 0; i < diceCount; i++) {
      diceRolls[i] = floor(random(1, 7)); // Roll each die (1-6)
    }
    console.log(`Player ${currentPlayer.index + 1} rolled: ${diceRolls.join(', ')}`);
    gamePhase = 'select'; // Change phase to selection
    selectionPhase = true;
    rollButton.hide(); // Hide Roll Dice button after rolling
  }
}

/**
 * Rolls the battle dice for the player during a battle.
 */
function rollBattleDice() {
  if (gamePhase === 'battle' && playerBattleRoll === 0) {
    playerBattleRoll = floor(random(1, 7)); // Player's roll plus treasures
    console.log(`Player ${battlePlayer.index + 1} rolled for battle: ${playerBattleRoll}`);
    determineBattleOutcome();
  }
}

/**
 * Handles the selection of dice for direction and distance.
 * @param {number} dieIndex - Index of the selected die.
 */
function selectDice(dieIndex) {
  if (gamePhase === 'select' && selectionPhase) {
        let currentPlayer = players[currentPlayerIndex];
    let diceCount = currentPlayer.getCurrentDiceCount();

    if (dieIndex >= diceCount) return; // Ignore clicks beyond available dice
    
    // If die is already selected, deselect it
    if (selectedDiceIndices.includes(dieIndex)) {
      //selectedDiceIndices = selectedDiceIndices.filter(index => index !== dieIndex);
      //console.log(`Die ${dieIndex + 1} deselected banana.`);
    } else {
      // Prevent selecting more than 2 dice
      if (selectedDiceIndices.length >= 2) {
        return;
      }
      selectedDiceIndices.push(dieIndex);
      console.log(`Die ${dieIndex + 1} selected.`);
    }

    // If two dice are selected, assign direction and distance
    if (selectedDiceIndices.length === 2) {
      let directionDieValue = diceRolls[selectedDiceIndices[0]];
      let distanceDieValue = diceRolls[selectedDiceIndices[1]];
      console.log(`Direction Die (Die ${selectedDiceIndices[0] + 1}) = ${directionDieValue}`);
      console.log(`Distance Die (Die ${selectedDiceIndices[1] + 1}) = ${distanceDieValue}`);

      proceedWithMovement(directionDieValue, distanceDieValue);
    }
  }
}

/**
 * Handles the selection of dice for direction and distance.
 * @param {number} directionValue - The value rolled for direction.
 * @param {number} distanceValue - The value rolled for distance.
 */
function proceedWithMovement(directionValue, distanceValue) {
  // Reset the message and path
  message = '';
  currentPath = [];
  currentTrappedHexes = []; // Reset trapped hexes for the new movement
  
  console.log(`Player ${players[currentPlayerIndex].index + 1} attempting to move up to ${distanceValue} step(s) towards direction ${directionValue} (${getDirectionName(directionValue)}).`);
  
  let currentPlayer = players[currentPlayerIndex];
  let playerHex = getHexAt(currentPlayer.gridX, currentPlayer.gridY, currentPlayer.gridZ);
  
  if (playerHex && currentPlayer.alive) {
    // Determine direction based on directionValue
    let directionIndex = (directionValue - 1) % CUBE_DIRECTIONS.length;
    let chosenDirection = CUBE_DIRECTIONS[directionIndex];
    console.log(`Chosen Direction Vector: (${chosenDirection.x}, ${chosenDirection.y}, ${chosenDirection.z})`);
    
    // Initialize targetHex as player's current position
    let targetHex = playerHex;
    let stepsTaken = 0;
    let remainingSteps = distanceValue; // Initialize remaining movement steps
    
    // Initialize currentPath
    currentPath.push(playerHex); // Add starting hex to path
    
    // Iterate step-by-step in the chosen direction
    for (let step = 1; step <= distanceValue; step++) {
      let intermediateCoords = {
        x: targetHex.cubeX + chosenDirection.x,
        y: targetHex.cubeY + chosenDirection.y,
        z: targetHex.cubeZ + chosenDirection.z
      };
      let intermediateHex = getHexAt(intermediateCoords.x, intermediateCoords.y, intermediateCoords.z);
      
      if (!intermediateHex) {
        console.log(`Step ${step}: Hex is out of bounds.`);
        message += ` Cannot move off the map.`;
        break; // Cannot move further
      }
      
      if (!isHexFullyVisible(intermediateHex)) {
        console.log(`Step ${step}: Hex is partially visible or off-screen.`);
        message += ` Cannot move off the map.`;
        break; // Cannot move further
      }
      
      if (!isTraversable(intermediateHex, currentPlayer, ships)) {
        console.log(`Step ${step}: Hex is not traversable (${intermediateHex.type}).`);
        message += ` Encountered impassable terrain.`;
        break; // Cannot move further
      }
      
      // Check if the hex is occupied by a enemy
      let enemyOnHex = enemies.find(enemy => 
        enemy.alive &&
        enemy.gridX === intermediateHex.cubeX &&
        enemy.gridY === intermediateHex.cubeY &&
        enemy.gridZ === intermediateHex.cubeZ
      );
      
      if (enemyOnHex) {
        console.log(`Step ${step}: Encountered enemy at (${intermediateHex.cubeX}, ${intermediateHex.cubeY}, ${intermediateHex.cubeZ}). Including in path.`);
        message += ` Encountered a enemy. Initiating battle.`;
        targetHex = intermediateHex;
        stepsTaken++;
        currentPath.push(targetHex); // Include enemy's hex in the path
        break; // Stop movement after including the enemy's hex
      }
      
      // Check for Teleportation
      if (intermediateHex.type === 'teleporter') {
        console.log(`Step ${step}: Passed over a teleporter at (${intermediateHex.cubeX}, ${intermediateHex.cubeY}, ${intermediateHex.cubeZ}).`);
        message += ` Teleporting...`;
        let destination = (intermediateHex === teleportHex1) ? teleportHex2 : teleportHex1;
        targetHex = intermediateHex; // The teleporter's hex
        stepsTaken++;
        currentPath.push(targetHex); // Add teleporter hex to path
        currentPath.push(destination); // Add destination to path
        console.log(`Teleportation destination added to path: (${destination.cubeX}, ${destination.cubeY}, ${destination.cubeZ})`);
        break; // Stop further movement
      }
      
      // Move to the next hex
      targetHex = intermediateHex;
      stepsTaken++;
      currentPath.push(targetHex);
      
      // **Check for Traps on the Current Hex**
      if (targetHex.hasTrap) {
        console.log(`Step ${step}: Detected a trap at (${targetHex.cubeX}, ${targetHex.cubeY}, ${targetHex.cubeZ}).`);
        message += ` Detected a trap on your path. One die will be removed.`;
        currentTrappedHexes.push(targetHex); // Record the trap without applying any effects
        // Do not remove the trap or reduce dice here
      }
      
      // **Check if the current hex is a swamp**
      if (targetHex.type === 'swamp') {
        console.log(`Step ${step}: Entering a swamp at (${targetHex.cubeX}, ${targetHex.cubeY}, ${targetHex.cubeZ}). Movement stops.`);
        message += `Entering a swamp. Movement stops.`;
        break; // Stop movement
      }
      
    }
    
    if (stepsTaken > 0) {
      console.log(`Current Path: ${currentPath.map(hex => `(${hex.cubeX},${hex.cubeY},${hex.cubeZ})`).join(' -> ')}`);
      
      // Highlight the path
      for (let hex of currentPath) {
        hex.highlighted = true;
      }
      
      // Change gamePhase to 'confirmMove'
      gamePhase = 'confirmMove';
      
      // Show Next button and hide Roll Dice button
      nextButton.show();
      rollButton.hide();
    } else {
      // If no movement is possible, stay in the same hex
      console.log(`No valid movement. Player ${currentPlayer.index + 1} stays in the same hex.`);
      message += ` Player ${currentPlayer.index + 1} can't move there.`;
      gamePhase = 'confirmMove';
      nextButton.show();
    }
  }
}

/**
 * Collects a treasure if present on the given hex.
 * @param {Hexagon} hex - The hexagon where the player is.
 */
function collectTreasure(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let treasure of treasures) {
    if (!treasure.collected &&
        treasure.hex.cubeX === hex.cubeX &&
        treasure.hex.cubeY === hex.cubeY &&
        treasure.hex.cubeZ === hex.cubeZ) {
      treasure.collected = true;
      currentPlayer.treasures += 1;
      console.log(`Player ${currentPlayer.index + 1} collected a treasure!`);
      message += ` Player ${currentPlayer.index + 1} collected a treasure!`;
    }
  }
}

/**
 * Collects a horse if present on the given hex.
 * @param {Hexagon} hex - The hexagon where the player is.
 */
function collectHorse(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let horse of horses) {
    if (horse.carriedBy === null &&
        horse.gridX === hex.cubeX &&
        horse.gridY === hex.cubeY &&
        horse.gridZ === hex.cubeZ) {
      horse.carriedBy = currentPlayer.index;
      currentPlayer.extraDice += 1; // Increase player's dice
      console.log(`Player ${currentPlayer.index + 1} collected a horse!`);
      message += ` Player ${currentPlayer.index + 1} collected a horse! Extra die added.`;
      break; // Only collect one horse per hex
    }
  }
}

/**
 * Collects a ship if present on the given hex.
 * @param {Hexagon} hex - The hexagon where the player is.
 */
function collectShip(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let ship of ships) {
    if (ship.carriedBy === null &&
        ship.gridX === hex.cubeX &&
        ship.gridY === hex.cubeY &&
        ship.gridZ === hex.cubeZ) {
      ship.carriedBy = currentPlayer.index;
      currentPlayer.hasShip = true;
      console.log(`Player ${currentPlayer.index + 1} picked up a ship.`);
      message += ` Player ${currentPlayer.index + 1} picked up a ship.`;
    }
  }
}


/**
 * Checks for battles between players and enemies, including archers within range.
 */
function checkForBattles() {
  for (let player of players) {
    if (!player.alive) continue; // Skip dead players

    for (let enemy of enemies) {
      if (!enemy.alive) continue; // Skip dead enemies

      let distance = cubeDistance(player, enemy);

      if (enemy.attackRange && distance <= enemy.attackRange) {
        // Enemies with an attack range can attack if within range
        console.log(`Triggered ranged battle between Player ${player.index + 1} and ${enemy.constructor.name} at (${enemy.gridX}, ${enemy.gridY}, ${enemy.gridZ})`);
        gamePhase = 'battle';
        selectionPhase = false;
        initiateBattle(player, enemy);
        return; // Handle one battle at a time
      } else if (!enemy.attackRange && distance === 0) {
        // Enemies without attack range attack if on the same hex
        console.log(`Triggered melee battle between Player ${player.index + 1} and enemy at (${enemy.gridX}, ${enemy.gridY}, ${enemy.gridZ})`);
        gamePhase = 'battle';
        selectionPhase = false;
        initiateBattle(player, enemy);
        return; // Handle one battle at a time
      }
    }
  }
}


/**
 * Initiates a battle between a player and a enemy.
 * @param {Player} player - The player involved in the battle.
 * @param {enemy} enemy - The enemy involved in the battle.
 */
function initiateBattle(player, enemy) {
  battlePlayer = player; // Set the battling player
  battleenemy = enemy; // Set the battling enemy

  // Reset battle outcome flags
  enemyDefeated = false;
  playerDefeated = false;

  // Determine the enemy's battle roll
  if (typeof enemy.getBattleRoll === 'function') {
    // If the enemy has a custom battle roll method (e.g., Archer)
    enemyBattleRoll = enemy.getBattleRoll();
  } else if (enemy instanceof DragonEnemy) {
    enemyBattleRoll = floor(random(1, 7)) + floor(random(1, 7)); // 2-12 for Dragon
  } else {
    enemyBattleRoll = floor(random(1, 7)); // 1-6 for regular enemies
  }

  playerBattleRoll = 0; // Reset player's battle roll
  console.log(`enemy rolled: ${enemyBattleRoll}`);
  message = `Battle initiated! enemy rolled a ${enemyBattleRoll}. Click 'Roll Dice' to roll your die.`;

  // Show Roll Dice button and hide Next button during battle setup
  rollButton.show();
  nextButton.hide();
}
/**
 * Determines the outcome of a battle after the player has rolled.
 */
function determineBattleOutcome() {
  let player = battlePlayer; // Use the player involved in the battle

  // Reset bonus
  bonus = 0;

  // Before comparing rolls, check for castle vicinity bonus
  let battleHex = getHexAt(player.gridX, player.gridY, player.gridZ);
  if (battleHex && battleHex.castleVicinity || (battleHex.type == 'castle')) {
    bonus = 2;
    message += ` You gain a +${bonus} bonus for fighting near a castle!`;
  }

  totalPlayerRoll = playerBattleRoll + battlePlayer.treasures + bonus;

  // Compare rolls
  if (totalPlayerRoll > enemyBattleRoll) {
    // Player wins, enemy dies

   message = ` Player ${player.index + 1} defended successfully`;
    // Find the enemy at player's location
    let enemy = enemies.find(
      m =>
        m.gridX === player.gridX &&
        m.gridY === player.gridY &&
        m.gridZ === player.gridZ
    );
    if (enemy) {
      enemy.alive = false;
      enemyDefeated = true; // enemy was defeated
      enemies = enemies.filter(m => m !== enemy);

      // Player gains a treasure for defeating the enemy
      player.treasures += 1;
      message = ` Player ${player.index + 1} gains a treasure for defeating the enemies!`;
    }

    // Check if all enemies are defeated
    if (enemies.length === 0) {
      message = ` All enemies have been defeated! Victory!`;
      gamePhase = 'end';
      gameResult = 'victory';
      nextButton.show(); // Show Next button to proceed to game over
    } else {
      // Show Next button after battle outcome is determined
      nextButton.show();
      // Change game phase to indicate battle has ended
      gamePhase = 'battleEnd';
    }
  } else {
    // enemy wins, Player dies (including tie)
    console.log(`enemy wins the battle. Player ${player.index + 1} is defeated.`);
    message = ` Player ${player.index + 1} was defeated by a enemy!`;
    player.alive = false;
    playerDefeated = true; // Player was defeated

    // Check if all players are defeated
    if (players.every(player => !player.alive)) {
      message = ` All players have been defeated. Game Over!`;
      gamePhase = 'end';
      gameResult = 'defeat';
      nextButton.show(); // Show Next button to proceed to game over
    } else {
      // Show Next button after battle outcome is determined
      nextButton.show();
      // Change game phase to indicate battle has ended
      gamePhase = 'battleEnd';
      battlePlayer = null;
      battleenemy = null;
    }
  }

  // Hide Roll Dice button to prevent further rolls until Next is pressed
  rollButton.hide();
  

}
/**
 * Moves the current player to the specified hex.
 * @param {Hexagon} hex - The target hex to move the player to.
 */
/**
 * Moves the current player to the specified hex.
 * @param {Hexagon} hex - The target hex to move the player to.
 */
/**
 * Moves the current player to the specified hex.
 * @param {Hexagon} hex - The target hex to move the player to.
 */
function movePlayerToHex(hex) {
  let player = players[currentPlayerIndex];

  // Update player's position
  player.x = hex.x;
  player.y = hex.y;
  player.gridX = hex.cubeX;
  player.gridY = hex.cubeY;
  player.gridZ = hex.cubeZ;

  // Add to player's history
  player.history.push({ x: hex.x, y: hex.y });

  // If the player has a ship, move the ship with the player
  if (player.hasShip) {
    let ship = ships.find(s => s.carriedBy === player.index);
    if (ship) {
      ship.gridX = hex.cubeX;
      ship.gridY = hex.cubeY;
      ship.gridZ = hex.cubeZ;
      ship.x = hex.x;
      ship.y = hex.y;
      console.log(`Ship carried by Player ${player.index + 1} moved to (${ship.gridX}, ${ship.gridY}, ${ship.gridZ}).`);
    }
  }

  // **Remove Teleporter Highlighting After Teleportation**
  if (hex.type === 'teleporter') {
    hex.highlighted = false; // Remove highlight
  }
}

// Make p5.js functions global so they can be accessed by the p5.js library
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.mouseReleased = mouseReleased;
window.keyPressed = keyPressed;
window.windowResized = windowResized;
