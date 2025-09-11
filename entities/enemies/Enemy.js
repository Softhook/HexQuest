// Base Enemy Class for HexQuest
import { BaseEntity } from '../BaseEntity.js';
import { GameConfig } from '../../config/GameConfig.js';
import { cubeDistance } from '../../utils/MathUtils.js';
import { isEnemyTraversable } from '../../utils/ValidationUtils.js';

export class Enemy extends BaseEntity {
  constructor(hex) {
    super(hex);
    this.alive = true; // To track if the enemy is alive
    this.attackRange = 0; // Default to melee (0 range)
  }

  /**
   * Displays the Enemy.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (!this.alive) return; // Do not display if dead

    pg.fill(0);
    pg.noStroke();
    if (typeof svgSpearman !== 'undefined') {
      pg.image(svgSpearman, this.x - 22, this.y - 29, GameConfig.HEX_SIZE * 2, GameConfig.HEX_SIZE * 2);
    } else {
      // Fallback if SVG not loaded
      pg.ellipse(this.x, this.y, GameConfig.HEX_SIZE * 1.5, GameConfig.HEX_SIZE * 1.5);
    }
  }

  /**
   * Gets the next step towards a target using basic pathfinding.
   * @param {Object} target - Target object with gridX, gridY, gridZ
   * @returns {Object|null} - Next step coordinates or null
   */
  getNextStepTowards(target) {
    let bestStep = null;
    let minDist = Infinity;

    for (let direction of GameConfig.CUBE_DIRECTIONS) {
      let nextHexCoords = {
        x: this.gridX + direction.x,
        y: this.gridY + direction.y,
        z: this.gridZ + direction.z
      };

      let targetObj = { gridX: target.gridX, gridY: target.gridY, gridZ: target.gridZ };
      let distVal = cubeDistance(
        { gridX: nextHexCoords.x, gridY: nextHexCoords.y, gridZ: nextHexCoords.z },
        targetObj
      );
      if (distVal < minDist) {
        minDist = distVal;
        bestStep = nextHexCoords;
      }
    }

    return bestStep;
  }

  /**
   * Moves the enemy towards the closest player.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   * @param {Function} getHexAt - Function to get hex at coordinates.
   * @param {Function} isHexFullyVisible - Function to check hex visibility.
   */
  moveTowards(players, enemies, getHexAt, isHexFullyVisible) {
    if (!this.alive) return; // Do not move if dead

    let currentHex = getHexAt(this.gridX, this.gridY, this.gridZ);

    // Determine steps to move
    let stepsToMove = 1;
    if (currentHex && currentHex.type === 'grass') {
      stepsToMove = 2;
    }

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
      for (let step = 0; step < stepsToMove; step++) {
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
              console.log(`Enemy moved to (${nextStep.x}, ${nextStep.y}, ${nextStep.z})`);
            } else {
              console.log(
                `Enemy cannot move to (${nextStep.x}, ${nextStep.y}, ${nextStep.z}) - Hex is occupied by another enemy`
              );
              break; // Cannot move further
            }
          } else {
            console.log(`Enemy cannot move to (${nextStep.x}, ${nextStep.y}, ${nextStep.z}) - Hex is not fully visible or not traversable`);
            break; // Cannot move further
          }
        } else {
          break; // No further steps
        }
      }
    }
  }

  /**
   * Updates the enemy's position to the next step.
   * @param {Object} nextStep - The next cube coordinates {x, y, z}.
   */
  updatePosition(nextStep) {
    this.gridX = nextStep.x;
    this.gridY = nextStep.y;
    this.gridZ = nextStep.z;
    
    // Update pixel position if getHexAt is available
    if (typeof getHexAt !== 'undefined') {
      let newHex = getHexAt(this.gridX, this.gridY, this.gridZ);
      if (newHex) {
        this.x = newHex.x;
        this.y = newHex.y;
      }
    }
  }

  /**
   * Standard battle roll for most enemies (1d6).
   * @returns {number} - Battle roll result
   */
  getBattleRoll() {
    return Math.floor(Math.random() * 6) + 1; // 1-6
  }
}