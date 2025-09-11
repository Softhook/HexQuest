// Player Entity Class for HexQuest
import { BaseEntity } from './BaseEntity.js';
import { GameConfig } from '../config/GameConfig.js';

export class Player extends BaseEntity {
  constructor(index, hex, color) {
    super(hex);
    this.index = index;
    this.color = color;
    this.treasures = 0;
    this.extraDice = 0;
    this.hasShip = false;
    this.alive = true;
    this.history = [{ x: this.x, y: this.y }];
    this.baseDice = GameConfig.NUM_DICE; // Initialize baseDice to NUM_DICE
    this.hasMoved = false; // Track if player has moved this turn
  }

  /**
   * Returns the current number of dice the player can roll for movement.
   * @returns {number}
   */
  getCurrentDiceCount() {
    return this.baseDice + this.extraDice;
  }

  /**
   * Permanently reduces the player's base dice by one due to stepping on a trap.
   * Ensures that baseDice does not go below zero.
   */
  reduceBaseDice() {
    if (this.baseDice > 0) {
      this.baseDice -= 1;
      console.log(`Player ${this.index + 1}'s base dice reduced to ${this.baseDice}.`);
    } else {
      console.log(`Player ${this.index + 1} has no base dice left to reduce.`);
    }
  }

  /**
   * Adds a treasure to the player's collection.
   */
  addTreasure() {
    this.treasures += 1;
    console.log(`Player ${this.index + 1} collected a treasure! Total: ${this.treasures}`);
  }

  /**
   * Adds an extra die (from collecting a horse).
   */
  addExtraDie() {
    this.extraDice += 1;
    console.log(`Player ${this.index + 1} gained an extra die! Total dice: ${this.getCurrentDiceCount()}`);
  }

  /**
   * Sets the player as having a ship.
   */
  acquireShip() {
    this.hasShip = true;
    console.log(`Player ${this.index + 1} acquired a ship!`);
  }

  /**
   * Adds a position to the player's movement history.
   * @param {number} x - Pixel x coordinate
   * @param {number} y - Pixel y coordinate
   */
  addToHistory(x, y) {
    this.history.push({ x, y });
  }

  /**
   * Updates the player's position and adds to history.
   * @param {Object} hex - The hex object to move to
   */
  moveToHex(hex) {
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
    this.addToHistory(hex.x, hex.y);
  }

  /**
   * Displays the player.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (!this.alive) return; // Do not display if dead

    // Note: This requires getHexAt function to be available
    // For now, we'll use the current position
    if (typeof getHexAt !== 'undefined') {
      let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
      if (!hex) return;
    }

    pg.fill(this.color);
    pg.noStroke();
    pg.ellipse(this.x, this.y, GameConfig.HEX_SIZE * 1.8, GameConfig.HEX_SIZE * 1.8);
    
    // Draw knight SVG if available
    if (typeof svgKnight !== 'undefined') {
      pg.image(svgKnight, this.x - 24, this.y - 30, 52, 52);
    }
    
    // Draw ship icon if player has a ship
    if (this.hasShip) {
      pg.fill(255);
      pg.noStroke();
      let shipSize = GameConfig.HEX_SIZE / 1.5;
      pg.triangle(
        this.x, this.y - shipSize / 2,
        this.x - shipSize / 2, this.y + shipSize / 2,
        this.x + shipSize / 2, this.y + shipSize / 2
      );
    }
  }

  /**
   * Displays the player's movement path.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  displayPath(pg = window) {
    if (this.history.length > 1) {
      pg.stroke(this.color);
      pg.strokeWeight(2);
      pg.noFill();
      pg.beginShape();
      for (let pos of this.history) {
        pg.vertex(pos.x, pos.y);
      }
      pg.endShape();
    }
  }
}