// HexGrid Manager for HexQuest
// Manages the creation and manipulation of the hex grid

import { GameConfig } from '../config/GameConfig.js';
import { calculateHexPosition } from '../utils/MathUtils.js';
import { Hexagon } from './Hexagon.js';

export class HexGrid {
  constructor(width, height, seed = 42) {
    this.width = width;
    this.height = height;
    this.seed = seed;
    this.hexagons = [];
    this.gridMap = new Map(); // For quick lookup by coordinates
  }

  /**
   * Initialize the hex grid with terrain generation
   */
  initialize() {
    this.hexagons = [];
    this.gridMap.clear();
    
    // Set random seed for consistent terrain generation
    randomSeed(this.seed);
    noiseSeed(this.seed);
    
    this.generateGrid();
    console.log(`HexGrid initialized with ${this.hexagons.length} hexagons`);
  }

  /**
   * Generate the hex grid covering the screen area
   */
  generateGrid() {
    // Create a grid of hexagons covering the screen
    for (let q = -6; q <= 6; q++) {
      for (let r = -4; r <= 4; r++) {
        let { x, y } = calculateHexPosition(q, r, this.width, this.height);
        
        // Only create hexes that are reasonably on screen
        if (x > -GameConfig.HEX_SIZE && x < this.width + GameConfig.HEX_SIZE && 
            y > -GameConfig.HEX_SIZE && y < this.height + GameConfig.HEX_SIZE) {
          
          // Generate terrain type using noise
          let terrainType = this.generateTerrainType(q, r);
          
          // Create hexagon with proper constructor parameters
          let cubeX = q;
          let cubeZ = r - Math.floor(q / 2);
          let cubeY = -cubeX - cubeZ;
          
          let hexagon = new Hexagon(x, y, GameConfig.HEX_SIZE, terrainType, cubeX, cubeY, cubeZ);
          this.hexagons.push(hexagon);
          
          // Add to grid map for quick lookup
          this.gridMap.set(`${q},${r}`, hexagon);
        }
      }
    }
  }

  /**
   * Generate terrain type based on noise and coordinates
   * @param {number} q - Axial coordinate q
   * @param {number} r - Axial coordinate r
   * @returns {string} - Terrain type
   */
  generateTerrainType(q, r) {
    // Use noise to determine terrain type
    let noiseVal = noise(q * 0.1, r * 0.1);
    
    if (noiseVal < 0.2) return 'water';
    else if (noiseVal < 0.3) return 'beach'; 
    else if (noiseVal < 0.5) return 'grass';
    else if (noiseVal < 0.7) return 'forest';
    else if (noiseVal < 0.85) return 'mountain';
    else return 'swamp';
  }

  /**
   * Get hexagon by axial coordinates
   * @param {number} q - Axial coordinate q
   * @param {number} r - Axial coordinate r
   * @returns {Hexagon|null} - Hexagon at coordinates or null
   */
  getHexagon(q, r) {
    return this.gridMap.get(`${q},${r}`) || null;
  }

  /**
   * Get all hexagons of a specific terrain type
   * @param {string} terrainType - Type of terrain to find
   * @returns {Array} - Array of hexagons with that terrain type
   */
  getHexagonsByTerrain(terrainType) {
    return this.hexagons.filter(hex => hex.type === terrainType);
  }

  /**
   * Display all hexagons in the grid
   */
  display() {
    for (let hex of this.hexagons) {
      hex.display();
    }
  }

  /**
   * Get total number of hexagons in the grid
   * @returns {number} - Number of hexagons
   */
  getHexagonCount() {
    return this.hexagons.length;
  }

  /**
   * Get terrain statistics
   * @returns {Object} - Object with terrain type counts
   */
  getTerrainStats() {
    const stats = {};
    for (let hex of this.hexagons) {
      stats[hex.type] = (stats[hex.type] || 0) + 1;
    }
    return stats;
  }

  /**
   * Update the seed and regenerate the grid
   * @param {number} newSeed - New seed for terrain generation
   */
  updateSeed(newSeed) {
    this.seed = newSeed;
    this.initialize();
  }

  /**
   * Find the closest hexagon to screen coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Hexagon|null} - Closest hexagon or null
   */
  getHexagonAtPosition(screenX, screenY) {
    let closestHex = null;
    let minDistance = Infinity;
    
    for (let hex of this.hexagons) {
      let distance = Math.sqrt((hex.x - screenX) ** 2 + (hex.y - screenY) ** 2);
      if (distance < minDistance && distance < GameConfig.HEX_SIZE) {
        minDistance = distance;
        closestHex = hex;
      }
    }
    
    return closestHex;
  }
}