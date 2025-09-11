// Base Entity Class for HexQuest
// Provides common functionality for all game entities

export class BaseEntity {
  constructor(hex) {
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
  }

  /**
   * Updates the entity's position to the specified coordinates.
   * @param {Object} coordinates - Object with gridX, gridY, gridZ properties.
   */
  updatePosition(coordinates) {
    this.gridX = coordinates.gridX || coordinates.x;
    this.gridY = coordinates.gridY || coordinates.y;
    this.gridZ = coordinates.gridZ || coordinates.z;
    // Note: x, y pixel positions should be updated by the caller based on hex
  }

  /**
   * Gets the entity's current grid position.
   * @returns {Object} - Object with gridX, gridY, gridZ properties.
   */
  getGridPosition() {
    return {
      gridX: this.gridX,
      gridY: this.gridY,
      gridZ: this.gridZ
    };
  }

  /**
   * Gets the entity's current pixel position.
   * @returns {Object} - Object with x, y properties.
   */
  getPixelPosition() {
    return {
      x: this.x,
      y: this.y
    };
  }

  /**
   * Base display method to be overridden by subclasses.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    // To be implemented by subclasses
    console.warn('BaseEntity.display() should be overridden by subclasses');
  }
}