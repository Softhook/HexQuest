// SeaMonster Enemy Class for HexQuest
import { Enemy } from './Enemy.js';
import { GameConfig } from '../../config/GameConfig.js';
import { cubeDistance } from '../../utils/MathUtils.js';

export class SeaMonster extends Enemy {
  constructor(hex) {
    super(hex);
    this.attackRange = 1; // Can attack adjacent hexes including land hexes
  }

  /**
   * Displays the Sea Monster with a distinct appearance.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (!this.alive) return;

    pg.push();
    pg.translate(this.x, this.y);

    // Draw Sea Monster
    pg.fill(0, 255, 255); // Cyan color to differentiate
    pg.noStroke();
    if (typeof svgKraken !== 'undefined') {
      pg.image(svgKraken, -22, -23, GameConfig.HEX_SIZE * 1.8, GameConfig.HEX_SIZE * 1.8);
    } else {
      // Fallback
      pg.ellipse(0, 0, GameConfig.HEX_SIZE * 1.5, GameConfig.HEX_SIZE * 1.5);
    }
    pg.pop();
  }

  /**
   * Moves the Sea Monster towards the closest player, only through water hexes.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   * @param {Function} getHexAt - Function to get hex at coordinates.
   * @param {Function} isHexFullyVisible - Function to check hex visibility.
   */
  moveTowards(players, enemies, getHexAt, isHexFullyVisible) {
    if (!this.alive) return; // Do not move if dead

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
      let nextStep = this.getNextSeaStepTowards(closestPlayer, enemies, getHexAt, isHexFullyVisible);
      if (nextStep) {
        this.updatePosition(nextStep);
        console.log(`Sea Monster moved to (${nextStep.gridX}, ${nextStep.gridY}, ${nextStep.gridZ})`);
      }
    }
  }

  /**
   * Gets the next step towards the target, moving only through water hexes.
   * @param {Object} target - The target player.
   * @param {Array} enemies - Array of enemy objects.
   * @param {Function} getHexAt - Function to get hex at coordinates.
   * @param {Function} isHexFullyVisible - Function to check hex visibility.
   * @returns {Object|null} - The next cube coordinates { gridX, gridY, gridZ } or null if no valid step.
   */
  getNextSeaStepTowards(target, enemies, getHexAt, isHexFullyVisible) {
    let bestStep = null;
    let minDist = Infinity;

    for (let direction of GameConfig.CUBE_DIRECTIONS) {
      let nextHexCoords = {
        gridX: this.gridX + direction.x,
        gridY: this.gridY + direction.y,
        gridZ: this.gridZ + direction.z
      };

      let hex = getHexAt(nextHexCoords.gridX, nextHexCoords.gridY, nextHexCoords.gridZ);
      if (!hex || hex.type !== 'water' || !isHexFullyVisible(hex)) continue; // Only move through water hexes

      // Check if the hex is occupied by another enemy
      let occupiedByEnemy = enemies.some(enemy =>
        enemy !== this &&
        enemy.alive &&
        enemy.gridX === nextHexCoords.gridX &&
        enemy.gridY === nextHexCoords.gridY &&
        enemy.gridZ === nextHexCoords.gridZ
      );
      if (occupiedByEnemy) continue;

      // Calculate distance to target from this hex
      let distVal = cubeDistance(nextHexCoords, target);
      if (distVal < minDist) {
        minDist = distVal;
        bestStep = nextHexCoords;
      }
    }

    return bestStep;
  }

  /**
   * Updates the Sea Monster's position to the next step.
   * @param {Object} nextStep - The next cube coordinates { gridX, gridY, gridZ }.
   */
  updatePosition(nextStep) {
    this.gridX = nextStep.gridX;
    this.gridY = nextStep.gridY;
    this.gridZ = nextStep.gridZ;
    
    if (typeof getHexAt !== 'undefined') {
      let newHex = getHexAt(this.gridX, this.gridY, this.gridZ);
      if (newHex) {
        this.x = newHex.x;
        this.y = newHex.y;
      }
    }
  }
}