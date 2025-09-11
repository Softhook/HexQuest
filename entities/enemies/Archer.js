// Archer Enemy Class for HexQuest
import { Enemy } from './Enemy.js';
import { GameConfig } from '../../config/GameConfig.js';
import { cubeDistance } from '../../utils/MathUtils.js';
import { isEnemyTraversable } from '../../utils/ValidationUtils.js';

export class Archer extends Enemy {
  constructor(hex) {
    super(hex);
    this.attackRange = 2; // Archer can attack up to 2 hexes
  }

  /**
   * Displays the archer with a distinct appearance.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (!this.alive) return;

    pg.push();
    pg.translate(this.x, this.y);

    // Draw Archer
    pg.fill(139, 69, 19);
    pg.noStroke();
    if (typeof svgArcher !== 'undefined') {
      pg.image(svgArcher, -22, -29, GameConfig.HEX_SIZE * 2.2, GameConfig.HEX_SIZE * 2);
    } else {
      // Fallback
      pg.ellipse(0, 0, GameConfig.HEX_SIZE * 1.5, GameConfig.HEX_SIZE * 1.5);
    }
    pg.pop();
  }

  /**
   * Generates a battle roll using a four-sided die (d4).
   * @returns {number} - The result of the battle roll (0).
   */
  getBattleRoll() {
    return Math.floor(Math.random() * 1); // 0 (weak enemy)
  }

  /**
   * Moves the archer towards the closest player, maintaining at least 2 hexes distance.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   * @param {Function} getHexAt - Function to get hex at coordinates.
   * @param {Function} isHexFullyVisible - Function to check hex visibility.
   */
  moveTowards(players, enemies, getHexAt, isHexFullyVisible) {
    if (!this.alive) return; // Do not move if dead

    let currentHex = getHexAt(this.gridX, this.gridY, this.gridZ);

    // Determine steps to move
    let stepsToMove = 1; // Archers typically move 1 hex per turn
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
      // If within attack range, do not move
      if (minDist <= this.attackRange) {
        console.log(`Archer at (${this.gridX}, ${this.gridY}, ${this.gridZ}) is within attack range of Player ${closestPlayer.index + 1}.`);
        return;
      }

      // Otherwise, move towards the player, stopping at attack range
      for (let step = 0; step < stepsToMove; step++) {
        let nextStep = this.getNextStepTowards(closestPlayer);
        if (nextStep) {
          let intermediateHex = getHexAt(nextStep.x, nextStep.y, nextStep.z);
          if (intermediateHex && isEnemyTraversable(intermediateHex, this) && isHexFullyVisible(intermediateHex)) {
            // Calculate distance after the move
            let futureDistance = cubeDistance(
              { gridX: nextStep.x, gridY: nextStep.y, gridZ: nextStep.z },
              closestPlayer
            );

            // Ensure the archer does not move within attack range
            if (futureDistance < this.attackRange) {
              console.log(`Archer cannot move closer without entering attack range.`);
              break;
            }

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
              console.log(`Archer moved to (${nextStep.x}, ${nextStep.y}, ${nextStep.z})`);
            } else {
              console.log(`Archer cannot move to (${nextStep.x}, ${nextStep.y}, ${nextStep.z}) - Hex is occupied by another enemy`);
              break; // Cannot move further
            }
          } else {
            console.log(`Archer cannot move to (${nextStep.x}, ${nextStep.y}, ${nextStep.z}) - Hex is not fully visible or not traversable`);
            break; // Cannot move further
          }
        } else {
          break; // No further steps
        }
      }
    }
  }
}