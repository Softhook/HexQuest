// Ship Entity Class for HexQuest
import { BaseEntity } from './BaseEntity.js';
import { GameConfig } from '../config/GameConfig.js';

export class Ship extends BaseEntity {
  constructor(hex) {
    super(hex);
    this.carriedBy = null;
  }

  /**
   * Displays the ship.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    // Only display if not carried and we have hex information
    if (this.carriedBy !== null) return;
    
    if (typeof getHexAt !== 'undefined') {
      let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
      if (!hex) return;
    }

    pg.push();
    pg.translate(this.x, this.y);

    // Draw boat hull
    pg.fill(165, 42, 42); // Brown color for the hull
    pg.noStroke();
    pg.beginShape();
    pg.vertex(-GameConfig.HEX_SIZE * 0.3, GameConfig.HEX_SIZE * 0.1);
    pg.vertex(GameConfig.HEX_SIZE * 0.3, GameConfig.HEX_SIZE * 0.1);
    pg.vertex(GameConfig.HEX_SIZE * 0.2, GameConfig.HEX_SIZE * 0.3);
    pg.vertex(-GameConfig.HEX_SIZE * 0.2, GameConfig.HEX_SIZE * 0.3);
    pg.endShape(pg.CLOSE);

    // Draw mast
    pg.stroke(160, 82, 45); // Lighter brown for the mast
    pg.strokeWeight(2);
    pg.line(0, GameConfig.HEX_SIZE * 0.1, 0, -GameConfig.HEX_SIZE * 0.3);

    // Draw sail
    pg.fill(255); // White color for the sail
    pg.noStroke();
    pg.triangle(0, -GameConfig.HEX_SIZE * 0.3, GameConfig.HEX_SIZE * 0.2, 0, 0, 0);

    pg.pop();
  }

  /**
   * Assigns the ship to a player.
   * @param {number} playerIndex - Index of the player carrying the ship
   */
  setCarriedBy(playerIndex) {
    this.carriedBy = playerIndex;
  }

  /**
   * Updates the ship's position (when carried by a player).
   * @param {Object} hex - The hex to move to
   */
  moveToHex(hex) {
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
  }
}