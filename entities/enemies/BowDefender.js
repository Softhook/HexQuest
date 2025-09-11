// BowDefender Enemy Class for HexQuest
import { Enemy } from './Enemy.js';
import { GameConfig } from '../../config/GameConfig.js';

export class BowDefender extends Enemy {
  constructor(hex) {
    super(hex);
    this.attackRange = 3;
  }

  /**
   * Displays the BowDefender with a distinct appearance.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (!this.alive) return;

    pg.push();
    pg.translate(this.x, this.y);

    // Draw BowDefender
    pg.fill(0, 0, 255); // Blue color to differentiate
    pg.noStroke();
    if (typeof svgBowDefender !== 'undefined') {
      pg.image(svgBowDefender, -22, -29, GameConfig.HEX_SIZE * 1.8, GameConfig.HEX_SIZE * 1.8);
    } else {
      // Fallback
      pg.ellipse(0, 0, GameConfig.HEX_SIZE * 1.5, GameConfig.HEX_SIZE * 1.5);
    }
    pg.pop();
  }

  /**
   * BowDefenders do not move, so override the moveTowards method to do nothing.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   * @param {Function} getHexAt - Function to get hex at coordinates.
   * @param {Function} isHexFullyVisible - Function to check hex visibility.
   */
  moveTowards(players, enemies, getHexAt, isHexFullyVisible) {
    // BowDefenders are static and do not move
  }
  
  /**
   * BowDefender battle roll.
   * @returns {number} - Battle roll result (1-4)
   */
  getBattleRoll() {
    return Math.floor(Math.random() * 4) + 1; // Generates a number between 1 and 4
  }
}