// Validation Utilities for HexQuest
import { GameConfig } from '../config/GameConfig.js';

/**
 * Checks if a hex is fully visible within the canvas boundaries.
 * @param {Object} hex - The hexagon to check.
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 * @returns {boolean} - True if fully visible, false otherwise.
 */
export function isHexFullyVisible(hex, width, height) {
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
 * Determines if a hex is a land hex based on its type.
 * @param {Object} hex - The hexagon to check.
 * @returns {boolean} - True if land hex, false otherwise.
 */
export function isLandHex(hex) {
  return ['grass', 'forest', 'mountain', 'beach', 'castle'].includes(hex.type);
}

/**
 * Determines if a hex is a water hex.
 * @param {Object} hex - The hexagon to check.
 * @returns {boolean} - True if water hex, false otherwise.
 */
export function isWaterHex(hex) {
  return hex.type === 'water';
}

/**
 * Determines if a hex is a mountain.
 * @param {Object} hex - The hexagon to check.
 * @returns {boolean} - True if mountain hex, false otherwise.
 */
export function isMountainHex(hex) {
  return hex.type === 'mountain';
}

/**
 * Determines if a hex is an edge water hex (adjacent to land).
 * This is a simplified version that can be called from sketch.js context
 * @param {Object} hex - The hexagon to check.
 * @returns {boolean} - True if edge water hex, false otherwise.
 */
export function isEdgeWaterHex(hex) {
  if (hex.type !== 'water') return false;
  
  // Use basic neighbor checking - if this is a water hex at edge of map, consider it edge water
  // This is a simplified implementation for now
  return true; // For now, treat all water hexes as edge water for ship placement
}

/**
 * Check if a hex is traversable for a player
 * @param {Object} hex - The hex to check
 * @param {Object} player - The player attempting to traverse
 * @param {Array} ships - Array of ships
 * @returns {boolean} - True if traversable
 */
export function isTraversable(hex, player, ships) {
  // Check terrain type and player's abilities
  if (hex.type === 'water') {
    // Allow traversal if player has a ship or the hex contains an uncollected ship
    return player.hasShip || ships.some(ship => 
      ship.gridX === hex.cubeX && 
      ship.gridY === hex.cubeY && 
      ship.gridZ === hex.cubeZ && 
      ship.carriedBy === null
    );
  }
  return true;
}

/**
 * Check if a hex is traversable for an enemy
 * @param {Object} hex - The hex to check
 * @param {Object} enemyInstance - The enemy attempting to traverse
 * @returns {boolean} - True if traversable
 */
export function isEnemyTraversable(hex, enemyInstance) {
  // Handle SeaMonster special case (assuming we'll import this later)
  if (enemyInstance.constructor.name === 'SeaMonster') {
    return hex.type === 'water';
  }
  // Existing conditions for other enemies
  return !(hex.type === 'mountain' || hex.type === 'water' || hex.type === 'castle');
}