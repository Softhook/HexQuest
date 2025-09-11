// Refactored HexQuest - Now with Game State Management!
console.log('sketch.js: Starting...');

import { GameConfig } from './config/GameConfig.js';
import { HexGrid } from './hexgrid/HexGrid.js';
import { GameStateManager } from './game/GameStateManager.js';
import { Player } from './entities/Player.js';
import { Treasure } from './entities/Treasure.js';

console.log('All modules loaded successfully:', GameConfig);

// Global Variables
let hexGrid;
let gameState;
let seed = 42;
let selectedDiceIndices = []; // Track selected dice: [directionIndex, distanceIndex]

// Entities
let players = [];
let treasures = [];

function setup() {
  createCanvas(800, 600);
  
  // Create and initialize hex grid
  hexGrid = new HexGrid(width, height, seed);
  hexGrid.initialize();
  
  // Create game state manager
  gameState = new GameStateManager();
  gameState.initializePlayers(1);
  
  // Create some basic entities for testing
  createTestEntities();
  
  console.log('p5.js setup complete, hexGrid initialized with', hexGrid.getHexagonCount(), 'hexes');
  console.log('Game state:', gameState.getState());
}

function createTestEntities() {
  // Create a player at the center of the screen
  const centerHex = hexGrid.getHexagonAtPosition(width / 2, height / 2);
  if (centerHex) {
    const player = new Player(0, centerHex, GameConfig.COLORS.PLAYER_1);
    player.x = centerHex.x;
    player.y = centerHex.y;
    player.gridX = centerHex.cubeX;
    player.gridY = centerHex.cubeY;
    player.gridZ = centerHex.cubeZ;
    players.push(player);
    console.log('Player created at:', centerHex.cubeX, centerHex.cubeY, centerHex.cubeZ, 'position:', centerHex.x, centerHex.y);
  } else {
    // Fallback: create player at a fixed position
    const player = new Player(0, null, GameConfig.COLORS.PLAYER_1);
    player.x = width / 2;
    player.y = height / 2;
    player.gridX = 0;
    player.gridY = 0; 
    player.gridZ = 0;
    players.push(player);
    console.log('Player created at fallback position:', player.x, player.y);
  }
  
  // Create some treasures on grass hexes
  const grassHexes = hexGrid.getHexagonsByTerrain('grass');
  for (let i = 0; i < Math.min(3, grassHexes.length); i++) {
    const hex = grassHexes[i];
    const treasure = new Treasure(hex.cubeX, hex.cubeY, hex.cubeZ);
    treasure.x = hex.x;
    treasure.y = hex.y;
    treasures.push(treasure);
  }
  
  // Set entities in game state
  gameState.setEntities(players, [], treasures, [], []);
  
  console.log('Test entities created:', {
    players: players.length,
    treasures: treasures.length
  });
}

function draw() {
  background(100, 150, 200); // Ocean blue background
  
  // Draw hex grid
  hexGrid.display();
  
  // Draw entities
  drawEntities();
  
  // Draw UI
  drawUI();
}

function drawEntities() {
  // Draw treasures
  for (let treasure of treasures) {
    treasure.display();
  }
  
  // Draw players
  for (let player of players) {
    player.display();
  }
}

function drawUI() {
  const state = gameState.getState();
  
  // Display game info
  fill(255);
  stroke(0);
  strokeWeight(2);
  textAlign(LEFT, TOP);
  textSize(16);
  text('🎉 Refactored HexQuest - GAME STATE! 🎉', 10, 10);
  text(`Phase: ${state.phase} | Player: ${state.currentPlayer + 1}`, 10, 35);
  text(`Seed: ${seed}`, 10, 60);
  text('✅ GameConfig Module', 10, 85);
  text('✅ HexGrid Manager', 10, 110);
  text('✅ GameState Manager', 10, 135);
  text('✅ Entity System', 10, 160);
  
  // Display game state message
  textAlign(CENTER, TOP);
  textSize(18);
  fill(255, 255, 0);
  stroke(0);
  strokeWeight(1);
  text(state.message, width / 2, 195);
  
  // Draw dice if they're visible and rolled
  if (state.diceVisible && state.diceRolls.length > 0) {
    drawDice(state.diceRolls);
  }
  
  // Show interaction hints
  textAlign(CENTER, TOP);
  textSize(12);
  fill(200);
  noStroke();
  if (state.phase === GameConfig.GAME_PHASES.INTRO) {
    text('Click to start the game', width / 2, 200);
  } else if (state.phase === GameConfig.GAME_PHASES.ROLL) {
    text('Click to roll dice', width / 2, 200);
  } else if (state.phase === GameConfig.GAME_PHASES.SELECT) {
    text(`Moves remaining: ${state.movesRemaining}`, width / 2, 200);
    text('Press SPACE to end turn', width / 2, 215);
  }
  
  text('Press R to reset | Press S for new seed', width / 2, 235);
  
  // Display entity counts
  textAlign(RIGHT, BOTTOM);
  textSize(12);
  fill(255);
  text(`Players: ${players.length} | Treasures: ${treasures.length}`, width - 10, height - 30);
  text(`Hexes: ${hexGrid.getHexagonCount()} | Seed: ${seed}`, width - 10, height - 10);
}

function drawDice(diceRolls) {
  // Draw dice in the center-bottom area
  const diceSize = GameConfig.UI.DIE_SIZE || 40;
  const diceSpacing = GameConfig.UI.DIE_SPACING || 10;
  const startX = width / 2 - (diceRolls.length * (diceSize + diceSpacing) - diceSpacing) / 2;
  const diceY = height - 120;
  
  for (let i = 0; i < diceRolls.length; i++) {
    const x = startX + i * (diceSize + diceSpacing);
    
    // Check if mouse is hovering over this die for visual feedback
    const isHovered = mouseX >= x && mouseX <= x + diceSize && 
                     mouseY >= diceY && mouseY <= diceY + diceSize;
    
    // Check if this die is selected
    const isDirectionDie = selectedDiceIndices[0] === i;
    const isDistanceDie = selectedDiceIndices[1] === i;
    
    // Draw die background with selection and hover effects
    if (isDirectionDie) {
      fill(255, 200, 200); // Light red for direction die
      stroke(255, 0, 0); // Red border
      strokeWeight(4);
    } else if (isDistanceDie) {
      fill(200, 200, 255); // Light blue for distance die
      stroke(0, 0, 255); // Blue border
      strokeWeight(4);
    } else if (isHovered) {
      fill(255, 255, 0); // Yellow on hover
      stroke(255, 150, 0); // Orange border on hover
      strokeWeight(3);
    } else {
      fill(255);
      stroke(0);
      strokeWeight(2);
    }
    rect(x, diceY, diceSize, diceSize, 5);
    
    // Draw die value
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(20);
    text(diceRolls[i], x + diceSize / 2, diceY + diceSize / 2);
  }
  
  // Add instruction text
  const state = gameState.getState();
  if (state.phase === GameConfig.GAME_PHASES.SELECT) {
    fill(255, 255, 0);
    textAlign(CENTER, CENTER);
    textSize(12);
    
    if (selectedDiceIndices.length === 0) {
      text('Select first die for DIRECTION (1-6 = N,NE,SE,S,SW,NW)', width / 2, diceY - 25);
    } else if (selectedDiceIndices.length === 1) {
      text('Select second die for DISTANCE (how many hexes)', width / 2, diceY - 25);
      fill(255, 100, 100);
      text(`Direction: ${diceRolls[selectedDiceIndices[0]]} (${getDirectionName(diceRolls[selectedDiceIndices[0]])})`, width / 2, diceY - 10);
    } else {
      fill(255, 100, 100);
      text(`Direction: ${diceRolls[selectedDiceIndices[0]]} (${getDirectionName(diceRolls[selectedDiceIndices[0]])})`, width / 2, diceY - 25);
      fill(100, 100, 255);
      text(`Distance: ${diceRolls[selectedDiceIndices[1]]} hexes`, width / 2, diceY - 10);
    }
  }
}

function mousePressed() {
  // Handle mouse clicks for game interaction
  const state = gameState.getState();
  
  if (state.phase === GameConfig.GAME_PHASES.INTRO) {
    gameState.startGame();
  } else if (state.phase === GameConfig.GAME_PHASES.ROLL) {
    // Simulate dice roll
    const diceRolls = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    gameState.setDiceRolls(diceRolls);
  } else if (state.phase === GameConfig.GAME_PHASES.SELECT || state.phase === GameConfig.GAME_PHASES.MOVE) {
    // Check if clicked on a die
    if (state.diceRolls.length > 0) {
      const clickedDie = checkDiceClick(mouseX, mouseY, state.diceRolls);
      if (clickedDie !== -1) {
        console.log(`Clicked die ${clickedDie + 1} with value ${state.diceRolls[clickedDie]}`);
        // Use this die for movement
        gameState.useMove();
        // Remove the used die from display
        state.diceRolls.splice(clickedDie, 1);
      }
    }
  }
}

function checkDiceClick(mouseX, mouseY, diceRolls) {
  const diceSize = GameConfig.UI.DIE_SIZE || 40;
  const diceSpacing = GameConfig.UI.DIE_SPACING || 10;
  const startX = width / 2 - (diceRolls.length * (diceSize + diceSpacing) - diceSpacing) / 2;
  const diceY = height - 120;
  
  for (let i = 0; i < diceRolls.length; i++) {
    const x = startX + i * (diceSize + diceSpacing);
    
    // Check if mouse is within die bounds
    if (mouseX >= x && mouseX <= x + diceSize && 
        mouseY >= diceY && mouseY <= diceY + diceSize) {
      return i; // Return the index of the clicked die
    }
  }
  return -1; // No die was clicked
}

// Convert die value (1-6) to hex direction name
function getDirectionName(directionNumber) {
  switch (directionNumber) {
    case 1: return 'N';
    case 2: return 'NE';
    case 3: return 'SE';
    case 4: return 'S';
    case 5: return 'SW';
    case 6: return 'NW';
    default: return '';
  }
}

// Handle dice selection for direction and distance
function selectDice(dieIndex, diceRolls) {
  // If die is already selected, deselect it
  const directionIndex = selectedDiceIndices.indexOf(dieIndex);
  if (directionIndex !== -1) {
    selectedDiceIndices.splice(directionIndex, 1);
    console.log(`Die ${dieIndex + 1} deselected`);
    return;
  }
  
  // If we already have 2 dice selected, ignore new selections
  if (selectedDiceIndices.length >= 2) {
    console.log('Two dice already selected');
    return;
  }
  
  // Add die to selection
  selectedDiceIndices.push(dieIndex);
  console.log(`Die ${dieIndex + 1} selected (${selectedDiceIndices.length}/2)`);
  
  // If two dice are selected, proceed with movement
  if (selectedDiceIndices.length === 2) {
    const directionValue = diceRolls[selectedDiceIndices[0]];
    const distanceValue = diceRolls[selectedDiceIndices[1]];
    
    console.log(`Movement planned: Direction ${directionValue} (${getDirectionName(directionValue)}), Distance ${distanceValue}`);
    
    // Trigger movement calculation
    proceedWithMovement(directionValue, distanceValue);
  }
}

// Hex direction vectors (1=N, 2=NE, 3=SE, 4=S, 5=SW, 6=NW)
const CUBE_DIRECTIONS = [
  { x: 0, y: 1, z: -1 },   // 1. North
  { x: 1, y: 0, z: -1 },   // 2. Northeast  
  { x: 1, y: -1, z: 0 },   // 3. Southeast
  { x: 0, y: -1, z: 1 },   // 4. South
  { x: -1, y: 0, z: 1 },   // 5. Southwest
  { x: -1, y: 1, z: 0 }    // 6. Northwest
];

// Calculate movement based on selected dice
function proceedWithMovement(directionValue, distanceValue) {
  const currentPlayer = players[0]; // For now, use first player
  
  console.log(`Player attempting to move ${distanceValue} step(s) in direction ${directionValue} (${getDirectionName(directionValue)})`);
  
  // Get direction vector (convert 1-6 to 0-5 index)
  const directionIndex = (directionValue - 1) % CUBE_DIRECTIONS.length;
  const chosenDirection = CUBE_DIRECTIONS[directionIndex];
  
  console.log(`Direction vector: (${chosenDirection.x}, ${chosenDirection.y}, ${chosenDirection.z})`);
  
  // Calculate destination hex coordinates
  const startX = currentPlayer.cubeX;
  const startY = currentPlayer.cubeY;
  const startZ = currentPlayer.cubeZ;
  
  const targetX = startX + (chosenDirection.x * distanceValue);
  const targetY = startY + (chosenDirection.y * distanceValue);
  const targetZ = startZ + (chosenDirection.z * distanceValue);
  
  console.log(`Movement: (${startX},${startY},${startZ}) → (${targetX},${targetY},${targetZ})`);
  
  // For now, just update player position directly
  // Later we'll add path validation, terrain checking, etc.
  const targetHex = hexGrid.getHexagonAtCube(targetX, targetY, targetZ);
  if (targetHex) {
    currentPlayer.cubeX = targetX;
    currentPlayer.cubeY = targetY;  
    currentPlayer.cubeZ = targetZ;
    currentPlayer.x = targetHex.x;
    currentPlayer.y = targetHex.y;
    
    console.log(`Player moved to hex (${targetX},${targetY},${targetZ}) at position (${targetHex.x},${targetHex.y})`);
    
    // Clear selection and advance game state
    selectedDiceIndices = [];
    gameState.transitionTo(GameConfig.GAME_PHASES.MOVE);
    
    // Remove used dice from available rolls
    const state = gameState.getState();
    const indices = [selectedDiceIndices[0], selectedDiceIndices[1]].sort((a, b) => b - a);
    state.diceRolls.splice(indices[0], 1);
    state.diceRolls.splice(indices[1], 1);
    
  } else {
    console.log('Invalid destination hex - movement cancelled');
    selectedDiceIndices = []; // Clear selection
  }
}

function keyPressed() {
  // Handle keyboard input
  const state = gameState.getState();
  
  if (key === 'r' || key === 'R') {
    // Roll dice and start game
    const diceRolls = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    gameState.setDiceRolls(diceRolls);
    gameState.transitionTo(GameConfig.GAME_PHASES.SELECT);
    selectedDiceIndices = []; // Clear dice selection
    console.log('Dice rolled:', diceRolls);
  } else if (key === 's' || key === 'S') {
    // Change seed and regenerate
    const oldSeed = seed;
    seed = Math.floor(Math.random() * 1000);
    hexGrid.updateSeed(seed);
    createTestEntities();
    console.log(`Seed changed: ${oldSeed} → ${seed}`);
    
    // Show visual feedback
    gameState.message = `New terrain generated! Seed: ${seed}`;
  } else if (key === ' ') {
    // Space to end turn or advance game
    if (state.phase === GameConfig.GAME_PHASES.SELECT || state.phase === GameConfig.GAME_PHASES.MOVE) {
      gameState.endTurn();
    }
  }
}

// Make functions global for p5.js
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.keyPressed = keyPressed;