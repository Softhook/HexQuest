// Treasure Entity Class for HexQuest
import { BaseEntity } from './BaseEntity.js';
import { GameConfig } from '../config/GameConfig.js';

export class Treasure extends BaseEntity {
  constructor(hex) {
    super(hex);
    this.collected = false;
    this.hex = hex; // Keep reference to the hex for compatibility
  }

  /**
   * Displays the treasure.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (this.collected) return;

    pg.fill(255, 223, 0);
    pg.strokeWeight(2);
    pg.stroke(0);
    pg.ellipse(this.x, this.y, GameConfig.HEX_SIZE / 2, GameConfig.HEX_SIZE / 2);
  }

  /**
   * Marks the treasure as collected.
   */
  collect() {
    this.collected = true;
  }

  /**
   * Checks if the treasure is at the specified coordinates.
   * @param {number} cubeX - Cube X coordinate
   * @param {number} cubeY - Cube Y coordinate  
   * @param {number} cubeZ - Cube Z coordinate
   * @returns {boolean} - True if treasure is at these coordinates
   */
  isAtPosition(cubeX, cubeY, cubeZ) {
    return this.gridX === cubeX && this.gridY === cubeY && this.gridZ === cubeZ;
  }
}