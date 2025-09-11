// Dragon Enemy Class for HexQuest
import { Enemy } from './Enemy.js';
import { GameConfig } from '../../config/GameConfig.js';
import { cubeDistance } from '../../utils/MathUtils.js';
import { isEnemyTraversable } from '../../utils/ValidationUtils.js';

export class DragonEnemy extends Enemy {
  constructor(hex) {
    super(hex);
    this.sizeMultiplier = 1.5; // Larger size
  }

  /**
   * Displays the Dragon enemy.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (!this.alive) return; // Do not display if dead

    pg.fill(0);
    pg.noStroke();
    if (typeof svgDragon !== 'undefined') {
      pg.image(svgDragon, this.x - 25, this.y - 23, GameConfig.HEX_SIZE * 1.8, GameConfig.HEX_SIZE * 1.8);
    } else {
      // Fallback
      pg.ellipse(this.x, this.y, GameConfig.HEX_SIZE * 1.2 * this.sizeMultiplier, GameConfig.HEX_SIZE * 1.2 * this.sizeMultiplier);
    }
  }

  /**
   * Moves the Dragon enemy towards the closest player.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   * @param {Function} getHexAt - Function to get hex at coordinates.
   * @param {Function} isHexFullyVisible - Function to check hex visibility.
   */
  moveTowards(players, enemies, getHexAt, isHexFullyVisible) {
    if (!this.alive) return; // Do not move if dead

    // Always move 1 hex towards the closest player
    let closestPlayer = null;
    let minDist = Infinity;

    // Find the closest player
    for (let player of players) {
      if (!player.alive) continue; // Skip dead players
      let distVal = cubeDistance(this, player);
      if (distVal < minDist) {
        minDist = distVal;
        closestPlayer = player;
      }
    }

    if (closestPlayer) {
      let nextStep = this.getNextStepTowards(closestPlayer);
      if (nextStep) {
        let intermediateHex = getHexAt(nextStep.x, nextStep.y, nextStep.z);
        if (intermediateHex && isEnemyTraversable(intermediateHex, this) && isHexFullyVisible(intermediateHex)) {
          // Check if any other enemy is already in the next hex
          let occupiedByEnemy = enemies.some(enemy =>
            enemy !== this &&
            enemy.alive &&
            enemy.gridX === nextStep.x &&
            enemy.gridY === nextStep.y &&
            enemy.gridZ === nextStep.z
          );

          if (!occupiedByEnemy) {
            this.updatePosition(nextStep);
            console.log(`Dragon moved to (${nextStep.x}, ${nextStep.y}, ${nextStep.z})`);
          } else {
            console.log(
              `Dragon cannot move to (${nextStep.x}, ${nextStep.y}, ${nextStep.z}) - Hex is occupied by another enemy`
            );
          }
        } else {
          console.log(`Dragon cannot move to (${nextStep.x}, ${nextStep.y}, ${nextStep.z}) - Hex is not fully visible or not traversable`);
        }
      }
    }
  }

  /**
   * Dragon has stronger battle roll (2d6).
   * @returns {number} - Battle roll result (2-12)
   */
  getBattleRoll() {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1; // 2-12 for Dragon
  }
}