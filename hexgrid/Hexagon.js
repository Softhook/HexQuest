// Hexagon Class for HexQuest
import { GameConfig } from '../config/GameConfig.js';
import { isPointInHex } from '../utils/MathUtils.js';

export class Hexagon {
  constructor(x, y, size, type, cubeX, cubeY, cubeZ) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
    this.cubeX = cubeX;
    this.cubeY = cubeY;
    this.cubeZ = cubeZ;
    this.highlighted = false;
    this.castleVicinity = false; // Indicates if the hex is adjacent to a castle
    this.bushes = [];
    this.trees = [];
    this.reeds = [];
    this.mountains = [];
    this.hasTrap = false;

    // Generate bushes for grass terrain
    if (this.type === 'grass') {
      this.generateBushes();
    }

    // Generate trees for forest terrain
    if (this.type === 'forest') {
      this.generateTrees();
    }
    
    // Generate mountains for mountain terrain
    if (this.type === 'mountain') {
      this.generateMountains();
    }
    
    // Generate swamp
    if (this.type === 'swamp') {
      this.generateReeds();
    }
  }

  /**
   * Generates bush properties and stores them in the bushes array.
   */
  generateBushes() {
    let bushCount = Math.floor(Math.random() * 4) + 5; // Number of bushes per grass hex (5-8)

    for (let i = 0; i < bushCount; i++) {
      // Generate random position within the hexagon
      let angle = Math.random() * Math.PI * 2;
      let distance = Math.random() * (this.size * 0.7 - this.size * 0.2) + this.size * 0.2;
      let px = Math.cos(angle) * distance;
      let py = Math.sin(angle) * distance;

      // Check if the bush base is within the hexagon
      if (!isPointInHex(px, py, this.size)) {
        continue; // Skip if outside
      }

      // Define bush size
      let bushWidth = Math.random() * 5 + 3; // 3-8
      let bushHeight = bushWidth * 0.6;

      // Store bush properties
      this.bushes.push({ x: px, y: py, width: bushWidth, height: bushHeight });
    }
  }
  
  /**
   * Generates mountains properties and stores them in the mountains array.
   */
  generateMountains() {
    // Define the number of mountain layers per hex
    const mountainLayers = Math.floor(Math.random() * 2) + 2; // 2 to 3 layers

    for (let i = 0; i < mountainLayers; i++) {
      // Generate random position within the hexagon
      let angle = Math.random() * Math.PI * 2;
      let distance = Math.random() * (this.size * 0.6 - this.size * 0.1) + this.size * 0.1;
      let px = Math.cos(angle) * distance;
      let py = Math.sin(angle) * distance;

      // Check if the base is within the hexagon
      if (!isPointInHex(px, py, this.size)) {
        continue; // Skip if outside
      }

      // Define mountain layer size
      let baseWidth = this.size;
      let height = Math.random() * (this.size * 2 - this.size * 0.5) + this.size * 0.5;

      // Store properties with layering information
      this.mountains.push({
        x: px,
        y: py,
        baseWidth: baseWidth,
        height: height,
      });
    }
  }

  /**
   * Generates reed bushes for swamp hexes with static properties.
   */
  generateReeds() {
    let reedCount = Math.floor(Math.random() * 10) + 6; // Number of reeds per swamp hex (6 to 15)

    for (let i = 0; i < reedCount; i++) {
      // Generate random position within the hexagon
      let angle = Math.random() * Math.PI * 2;
      let distance = Math.random() * (this.size * 0.7 - this.size * 0.1) + this.size * 0.1;

      let px = Math.cos(angle) * distance;
      let py = Math.sin(angle) * distance;

      // Check if the reed base is within the hexagon
      if (!isPointInHex(px, py, this.size)) {
        continue; // Skip if outside
      }

      // **Rotate the reed angle by 90 degrees anticlockwise**
      let reedAngle = (Math.random() * (Math.PI / 3) - Math.PI / 6) + Math.PI / 2; // Original angle plus 90 degrees
      let reedLength = this.size * 0.4; // Length of the reed

      // Store reed properties
      this.reeds.push({
        x: px,
        y: py,
        angle: reedAngle,
        length: reedLength
      });
    }
  }

  /**
   * Generates tree properties and stores them in the trees array.
   */
  generateTrees() {
    let treeCount = Math.floor(Math.random() * 3) + 1; // Number of trees per forest hex (1-3)

    for (let i = 0; i < treeCount; i++) {
      // Generate random position within the hexagon
      let angle = Math.random() * Math.PI * 2;
      let distance = Math.random() * (this.size * 0.6 - this.size * 0.1) + this.size * 0.1;
      let px = Math.cos(angle) * distance;
      let py = Math.sin(angle) * distance;

      // Check if the tree base is within the hexagon
      if (!isPointInHex(px, py, this.size)) {
        continue; // Skip if outside
      }

      // Randomly choose a tree type
      let treeType = Math.random() > 0.5 ? 'pine' : 'oak';

      // Store tree properties
      this.trees.push({ x: px, y: py, type: treeType });
    }
  }

  /**
  /**
   * Displays the hexagon along with its terrain features.
   */
  display() { // Draw directly to main canvas
    push();
    translate(this.x, this.y);

    // Set the terrain color
    let terrainColor = this.getTerrainColor();
    fill(terrainColor[0], terrainColor[1], terrainColor[2]);
    stroke(0);
    strokeWeight(1);

    // Draw the hexagon shape for terrain
    beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = Math.PI * 2 / 6 * i;
      vertex(this.size * Math.cos(angle), this.size * Math.sin(angle));
    }
    endShape(CLOSE);

    // Draw castle graphic if hex is a castle
    if (this.type === 'castle') {
      this.drawCastle();
    }

    // Draw castle vicinity stripes if applicable
    if (this.castleVicinity) {
      if (this.type !== 'castle') {
        this.drawCastleVicinityStripes();
      }
    }

    // Draw bushes for grass hexes
    if (this.type === 'grass') {
      this.drawBushes();
    }

    // Draw trees for forest hexes
    if (this.type === 'forest') {
      this.drawTreesOutlines();
    }
    
    // Draw swamp reed bushes
    if (this.type === 'swamp') {
      this.drawReedBushes();
    }
    
    // Draw mountains graphic if hex is a mountain
    if (this.type === 'mountain') {
      this.drawMountains();
    }
    
    // Render teleporters
    if (this.type === 'teleporter') {
      strokeWeight(2);
      stroke(255);
      beginShape();
      for (let a = 0; a < Math.PI * 2; a += 0.1) {
        let r = this.size * 0.5 * (1 + 0.3 * Math.sin(4 * a));
        let sx = r * Math.cos(a);
        let sy = r * Math.sin(a);
        vertex(sx, sy);
      }
      endShape(); 
    }
    
    // Draw traps if present
    if (this.hasTrap) {
      this.drawTrap();
    }

    // If highlighted, overlay a semi-transparent highlight
    if (this.highlighted) {
      fill(255, 255, 0, 100); // Semi-transparent yellow
      noStroke(); // Remove stroke for highlight overlay

      beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = Math.PI * 2 / 6 * i;
        vertex(this.size * Math.cos(angle), this.size * Math.sin(angle));
      }
      endShape(CLOSE);
    }

    pop();
  }

  /**
   * Returns the color based on terrain type.
   */
  getTerrainColor() {
    const colors = GameConfig.TERRAIN_COLORS;
    switch (this.type) {
      case 'mountain':
        return colors.MOUNTAIN;
      case 'grass':
        return colors.GRASS;
      case 'forest':
        return colors.FOREST;
      case 'beach':
        return colors.BEACH;
      case 'castle':
        return colors.CASTLE;
      case 'swamp':
        return colors.SWAMP;
      case 'water':
        return colors.WATER;
      case 'teleporter':
      default:
        return colors.TELEPORTER;
    }
  }

  /**
   * Draws the castle graphic.
   */
  drawCastle() {
    fill(150); // Castle color
    stroke(0);
    strokeWeight(1);

    // Draw castle towers
    let towerWidth = this.size / 3;
    let towerHeight = this.size / 2;

    rectMode(CENTER);
    rect(0, -this.size / 4, this.size, towerHeight); // Main building

    rect(-this.size / 2 + towerWidth / 2, -this.size / 2, towerWidth, towerHeight); // Left tower
    rect(this.size / 2 - towerWidth / 2, -this.size / 2, towerWidth, towerHeight); // Right tower

    // Draw battlements
    let battlementSize = towerWidth / 2;
    rect(-this.size / 2 + battlementSize / 2, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
    rect(0, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
    rect(this.size / 2 - battlementSize / 2, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
  }

  /**
   * Draws diagonal stripes indicating castle vicinity.
   */
  drawCastleVicinityStripes() {
    push();

    // Define the hexagon vertices
    let hexVertices = [];
    for (let i = 0; i < 6; i++) {
      let angle = Math.PI * 2 / 6 * i - Math.PI / 6;
      let x_i = this.size * Math.cos(angle);
      let y_i = this.size * Math.sin(angle);
      hexVertices.push({x: x_i, y: y_i});
    }

    // Calculate the bounding box of the hexagon
    let minY = Math.min(...hexVertices.map(v => v.y));
    let maxY = Math.max(...hexVertices.map(v => v.y));

    // Set the stripe properties
    stroke(255, 128, 128); // Semi-transparent grey
    strokeWeight(1);
    let stripeSpacing = 8;

    // Draw diagonal stripes within the hexagon
    for (let y = minY - this.size; y <= maxY + this.size; y += stripeSpacing) {
      // For each potential stripe line, calculate intersections with hexagon edges
      let intersections = [];

      for (let i = 0; i < 6; i++) {
        let a1 = hexVertices[i];
        let a2 = hexVertices[(i + 1) % 6];

        // Diagonal line equation: x + y = c
        let c = y;

        // Edge line equation: from a1 to a2
        let denom = (a2.x - a1.x) + (a2.y - a1.y);
        if (denom === 0) continue; // Skip if edge is a point

        let t = ((c - a1.x - a1.y) / denom);

        if (t >= 0 && t <= 1) {
          let intersectX = a1.x + t * (a2.x - a1.x);
          let intersectY = a1.y + t * (a2.y - a1.y);
          intersections.push({x: intersectX, y: intersectY});
        }
      }

      // Sort intersections by x-coordinate
      intersections.sort((p1, p2) => p1.x - p2.x);

      // Draw line segments between pairs of intersections
      for (let i = 0; i < intersections.length - 1; i += 2) {
        let p1 = intersections[i];
        let p2 = intersections[i + 1];
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }

    pop();
  }

  /**
   * Draws traps on the hexagon as red spikes.
   */
  drawTrap() {
    push();
    translate(0, 0); // Center of the hex

    // Draw red spikes sticking up
    fill(255, 0, 0); // Red color for traps
    noStroke();

    let spikeHeight = this.size * 0.5;
    let spikeWidth = this.size * 0.2;
    let spikeCount = 6; // One spike per side

    for (let i = 0; i < spikeCount; i++) {
      let angle = Math.PI * 2 / spikeCount * i - Math.PI / 2; // Start pointing upwards
      push();
      rotate(angle);
      beginShape();
      vertex(0, 0);
      vertex(spikeWidth / 2, -spikeHeight);
      vertex(-spikeWidth / 2, -spikeHeight);
      endShape(CLOSE);
      pop();
    }

    pop();
  }

  /**
   * Draws monochrome mountain graphics on mountain hexes.
   */
  drawMountains() {
    push();

    // Sort mountains by baseWidth to draw larger layers first
    this.mountains.sort((a, b) => b.baseWidth - a.baseWidth);

    stroke(0);
    // Set the fill color for the mountain layer
    fill(139, 69, 19);
  
    for (let mountain of this.mountains) {
      push();
      translate(mountain.x, mountain.y);

      // Draw the triangular mountain layer
      beginShape();
      vertex(-mountain.baseWidth / 2, 0); // Left base
      vertex(mountain.baseWidth / 2, 0);  // Right base
      vertex(0, -mountain.height);        // Apex
      endShape(CLOSE);

      pop();
    }

    pop();
  }
  
  /**
   * Draws reed bushes on swamp hexes as static bushes.
   */
  drawReedBushes() {
    push();

    // Define reed properties
    stroke(0, 150); // Black color for reeds
    strokeWeight(1);

    for (let reed of this.reeds) {
      let { x, y, angle, length } = reed;

      // Calculate end position based on stored angle and length
      let endX = x + length * Math.cos(angle);
      let endY = y + length * Math.sin(angle);

      // Draw the main reed stem
      line(x, y, endX, endY);
    }

    pop();
  }

  /**
   * Draws all bushes stored in the bushes array.
   */
  drawBushes() {
    noFill();
    stroke(0, 100); // Black outline for bushes
    strokeWeight(1);
    fill(124, 200, 0);

    for (let bush of this.bushes) {
      ellipse(bush.x, bush.y, bush.width, bush.height);
    }
  }

  /**
   * Draws all tree outlines stored in the trees array.
   */
  drawTreesOutlines() {
    noFill();
    stroke(0); // Black outline for trees
    strokeWeight(1);

    for (let tree of this.trees) {
      this.drawSimpleTree(tree.x, tree.y, tree.type);
    }
  }

  /**
   * Draws a simple tree outline based on its type.
   * @param {number} x - X-coordinate relative to hex center.
   * @param {number} y - Y-coordinate relative to hex center.
   * @param {string} type - Type of the tree ('pine' or 'oak').
   */
  drawSimpleTree(x, y, type) {
    push();
    translate(x, y);
    fill(34, 139, 34);

    if (type === 'pine') {
      // Draw Pine Tree Outline
      beginShape();
      vertex(-10, 0);
      vertex(10, 0);
      vertex(0, -30);
      endShape(CLOSE);
    } else if (type === 'oak') {
      // Draw Oak Tree Outline
      line(0, 0, 0, -20); // Trunk
      // Foliage as a circle
      ellipse(0, -25, 20, 15);
    }

    pop();
  }
}