// Horse Entity Class for HexQuest
import { BaseEntity } from './BaseEntity.js';
import { GameConfig } from '../config/GameConfig.js';

export class Horse extends BaseEntity {
  constructor(hex) {
    super(hex);
    this.carriedBy = null;
  }

  /**
   * Displays the horse.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    // Only display if not carried
    if (this.carriedBy !== null) return;
    
    if (typeof getHexAt !== 'undefined') {
      let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
      if (!hex) return;
    }

    pg.push();
    pg.translate(this.x, this.y);
    if (typeof svgHorse !== 'undefined') {
      pg.image(svgHorse, -17, -18, GameConfig.HEX_SIZE * 1.3, GameConfig.HEX_SIZE * 1.3);
    } else {
      // Fallback display
      pg.fill(139, 69, 19); // Brown color
      pg.noStroke();
      pg.ellipse(0, 0, GameConfig.HEX_SIZE * 1.3, GameConfig.HEX_SIZE * 1.3);
    }
    pg.pop();
  }

  /**
   * Assigns the horse to a player.
   * @param {number} playerIndex - Index of the player carrying the horse
   */
  setCarriedBy(playerIndex) {
    this.carriedBy = playerIndex;
  }
}