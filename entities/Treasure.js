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
   */
  display() {
    if (this.collected) return;

    push();
    fill(255, 223, 0);
    strokeWeight(2);
    stroke(0);
    ellipse(this.x, this.y, GameConfig.HEX_SIZE / 2, GameConfig.HEX_SIZE / 2);
    
    // Draw treasure symbol
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(10);
    text('$', this.x, this.y);
    pop();
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