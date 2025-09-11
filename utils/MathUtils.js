// Mathematical Utilities for HexQuest
import { GameConfig } from '../config/GameConfig.js';

/**
 * Checks if a point is inside a regular hexagon.
 * @param {number} px - X-coordinate of the point relative to hex center.
 * @param {number} py - Y-coordinate of the point relative to hex center.
 * @param {number} size - Radius of the hexagon.
 * @returns {boolean} - True if inside, false otherwise.
 */
export function isPointInHex(px, py, size) {
  // Convert to absolute values for symmetry
  let x = Math.abs(px);
  let y = Math.abs(py);
  
  // Calculate the height of the hexagon
  let h = Math.sqrt(3) * size / 2;
  
  // Basic bounding box check
  if (x > 1.5 * size || y > h) {
    return false;
  }
  
  // Check if the point is within the upper or lower triangle
  if (y <= h - (h / 1.5) * x / size) {
    return true;
  }
  
  return false;
}

/**
 * Calculate the pixel position of a hex based on its cube coordinates.
 * @param {number} q - Cube coordinate q.
 * @param {number} r - Cube coordinate r.
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 * @returns {Object} - x and y positions.
 */
export function calculateHexPosition(q, r, width, height) {
  let x = q * GameConfig.HEX_SIZE * 1.5 + width / 2;
  let y = r * GameConfig.HEX_SIZE * Math.sqrt(3) + (q % 2 !== 0 ? GameConfig.HEX_SIZE * Math.sqrt(3) / 2 : 0) + height / 2;
  return { x, y };
}

/**
 * Calculate cube coordinates from axial coordinates.
 * @param {number} q - Axial coordinate q.
 * @param {number} r - Axial coordinate r.
 * @returns {Object} - cubeX, cubeY, cubeZ.
 */
export function calculateCubeCoordinates(q, r) {
  let cubeX = q;
  let cubeZ = r - Math.floor(q / 2);
  let cubeY = -cubeX - cubeZ;
  return { cubeX, cubeY, cubeZ };
}

/**
 * Calculate the cube distance between two objects with cube coordinates.
 * @param {Object} a - First object with gridX, gridY, gridZ.
 * @param {Object} b - Second object with gridX, gridY, gridZ.
 * @returns {number} - The cube distance.
 */
export function cubeDistance(a, b) {
  if (!a || !b || a.gridX === undefined || a.gridY === undefined || a.gridZ === undefined ||
      b.gridX === undefined || b.gridY === undefined || b.gridZ === undefined) {
    console.error("cubeDistance function received undefined properties.");
    return Infinity;
  }
  return Math.max(Math.abs(a.gridX - b.gridX), Math.abs(a.gridY - b.gridY), Math.abs(a.gridZ - b.gridZ));
}

/**
 * Get direction name based on number
 * @param {number} directionNumber - Direction number (1-6)
 * @returns {string} - Direction name
 */
export function getDirectionName(directionNumber) {
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

/**
 * Retrieves neighboring cube coordinates.
 * @param {number} x - Cube coordinate x.
 * @param {number} y - Cube coordinate y.
 * @param {number} z - Cube coordinate z.
 * @returns {Array} - Array of neighbor coordinates.
 */
export function getNeighbors(x, y, z) {
  return GameConfig.CUBE_DIRECTIONS.map(direction => ({
    x: x + direction.x,
    y: y + direction.y,
    z: z + direction.z
  }));
}