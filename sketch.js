// Refactored HexQuest - Now with Hex Grid!
console.log('sketch.js: Starting...');

import { GameConfig } from './config/GameConfig.js';
import { calculateHexPosition, calculateCubeCoordinates } from './utils/MathUtils.js';
import { Hexagon } from './hexgrid/Hexagon.js';

console.log('All modules loaded successfully:', GameConfig);

// Global Variables
let hexGrid = [];
let seed = 42;

function setup() {
  createCanvas(800, 600);
  
  // Initialize random with seed for consistent terrain
  randomSeed(seed);
  noiseSeed(seed);
  
  // Create hex grid
  setupHexGrid();
  
  console.log('p5.js setup complete, hexGrid has', hexGrid.length, 'hexes');
}

function setupHexGrid() {
  hexGrid = [];
  
  // Create a grid of hexagons covering the screen
  for (let q = -6; q <= 6; q++) {
    for (let r = -4; r <= 4; r++) {
      let { x, y } = calculateHexPosition(q, r, width, height);
      
      // Only create hexes that are reasonably on screen
      if (x > -GameConfig.HEX_SIZE && x < width + GameConfig.HEX_SIZE && 
          y > -GameConfig.HEX_SIZE && y < height + GameConfig.HEX_SIZE) {
        
        // Generate terrain type using noise
        let terrainType = generateTerrainType(q, r);
        
        // Create hexagon with proper constructor parameters: (x, y, size, type, cubeX, cubeY, cubeZ)
        let cubeX = q;
        let cubeZ = r - Math.floor(q / 2);
        let cubeY = -cubeX - cubeZ;
        
        hexGrid.push(new Hexagon(x, y, GameConfig.HEX_SIZE, terrainType, cubeX, cubeY, cubeZ));
      }
    }
  }
}

function generateTerrainType(q, r) {
  // Use noise to determine terrain type
  let noiseVal = noise(q * 0.1, r * 0.1);
  
  if (noiseVal < 0.2) return 'water';
  else if (noiseVal < 0.3) return 'beach'; 
  else if (noiseVal < 0.5) return 'grass';
  else if (noiseVal < 0.7) return 'forest';
  else if (noiseVal < 0.85) return 'mountain';
  else return 'swamp';
}

function draw() {
  background(100, 150, 200); // Ocean blue background
  
  // Draw all hexagons using our refactored Hexagon class
  for (let hex of hexGrid) {
    hex.display();
  }
  
  // Display success info
  fill(255);
  stroke(0);
  strokeWeight(2);
  textAlign(LEFT, TOP);
  textSize(16);
  text('🎉 Refactored HexQuest - WORKING! 🎉', 10, 10);
  text(`Seed: ${seed} | Hexes: ${hexGrid.length}`, 10, 35);
  text('✅ GameConfig Module', 10, 60);
  text('✅ MathUtils Module', 10, 85);
  text('✅ Hexagon Rendering Module', 10, 110);
  text('✅ Modular Architecture Success!', 10, 135);
  
  textAlign(RIGHT, BOTTOM);
  text(`HEX_SIZE: ${GameConfig.HEX_SIZE}px`, width - 10, height - 10);
}

// Make functions global for p5.js
window.setup = setup;
window.draw = draw;

// Make functions global for p5.js
window.setup = setup;
window.draw = draw;