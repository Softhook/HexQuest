
// Game Parameters
const HEX_SIZE = 25; // Adjusted size for better visibility
const NUM_DICE = 4; // Default can increase with horses
const numberSpearman = 0;
const numberArchers = 6;
const numberDragons = 0;
const numberHorses = 4;
const teleporters = true;
const castleCount = 2;
const numberShips = 0;
const numberTreasure = 8;
const numberTraps = 0;
const numberBowDefenders = 0;
const numberSeaMonsters = 0;

let seedInput, generateSeedButton;
let seed = 0; // Default seed

// Define directions with 1 = North, 2 = Northeast, ..., 6 = Northwest
const CUBE_DIRECTIONS = [
  { x: 0, y: 1, z: -1 },   // 1. North
  { x: 1, y: 0, z: -1 },   // 2. Northeast
  { x: 1, y: -1, z: 0 },   // 3. Southeast
  { x: 0, y: -1, z: 1 },   // 4. South
  { x: -1, y: 0, z: 1 },   // 5. Southwest
  { x: -1, y: 1, z: 0 }    // 6. Northwest
];



// Global Variables
let cols, rows;
let hexGrid = [];
let treasures = [];
let enemies = [];
let ships = [];
let players = [];
let horses = [];
let currentTrappedHexes = [];
let teleportHex1, teleportHex2; // Teleportation hexes
let hasTeleportedThisMove = false; // Flag to prevent multiple teleportations per move
let currentPlayerIndex = 0;
let diceRolls = [];
let gamePhase = 'intro'; // Phases: 'intro', 'roll', 'select', 'move', 'battle', 'gameover', 'confirmMove', 'end', 'noMove', 'battleEnd'
let gameResult = ''; // 'victory' or 'defeat' for the game over screen
let message = ''; // To display feedback messages
let font;

// Variables for Dice Selection
let selectedDiceIndices = []; // Indices of selected dice for direction and distance
let selectionPhase = false;
let toggleDiceButton; // New Toggle Dice Button
let diceVisible = true; // Variable to track dice visibility

// Variables for Battle Phase
let enemyBattleRoll = 0;
let playerBattleRoll = 0;
let bonus = 0;
let battlePlayer = null; // Global variable to track the player in battle
let battleenemy = null;
let totalPlayerRoll;
let enemyDefeated = false;
let playerDefeated = false
let enemiesHaveMoved = false;


// Global Variables for Buttons
let rollButton;
let nextButton;

// Variable for current movement path
let currentPath = [];

// Variables for Intro Screen
let numPlayers = 1;
let pathDrawing = false;
let onePlayerButton, twoPlayersButton, pathToggleButton, exportToggleButton, startGameButton;
let restartButton; // For the game over screen
;

// Export Button
let exportButton;
let exportShow = false;

/**
 * Checks if a point is inside a regular hexagon.
 * @param {number} px - X-coordinate of the point relative to hex center.
 * @param {number} py - Y-coordinate of the point relative to hex center.
 * @param {number} size - Radius of the hexagon.
 * @returns {boolean} - True if inside, false otherwise.
 */
function isPointInHex(px, py, size) {
  // Convert to absolute values for symmetry
  let x = abs(px);
  let y = abs(py);
  
  // Calculate the height of the hexagon
  let h = sqrt(3) * size / 2;
  
  // Basic bounding box check
  if (x > 1.5 * size || y > h) {
    return false;
  }
  
  // Check if the point is within the upper or lower triangle
  if (y <= h - (h / 1.5) * x / size) {
    return true;
  }
  
  return false;
}

/**
 * Calculate the pixel position of a hex based on its cube coordinates.
 * @param {number} q - Cube coordinate q.
 * @param {number} r - Cube coordinate r.
 * @returns {Object} - x and y positions.
 */
function calculateHexPosition(q, r) {
  let x = q * HEX_SIZE * 1.5 + width / 2;
  let y = r * HEX_SIZE * sqrt(3) + (q % 2 !== 0 ? HEX_SIZE * sqrt(3) / 2 : 0) + height / 2;
  return { x, y };
}

/**
 * Calculate cube coordinates from axial coordinates.
 * @param {number} q - Axial coordinate q.
 * @param {number} r - Axial coordinate r.
 * @returns {Object} - cubeX, cubeY, cubeZ.
 */
function calculateCubeCoordinates(q, r) {
  let cubeX = q;
  let cubeZ = r - Math.floor(q / 2);
  let cubeY = -cubeX - cubeZ;
  return { cubeX, cubeY, cubeZ };
}

/**
 * Calculate the cube distance between two objects with cube coordinates.
 * @param {Object} a - First object with gridX, gridY, gridZ.
 * @param {Object} b - Second object with gridX, gridY, gridZ.
 * @returns {number} - The cube distance.
 */
function cubeDistance(a, b) {
  if (!a || !b || a.gridX === undefined || a.gridY === undefined || a.gridZ === undefined ||
      b.gridX === undefined || b.gridY === undefined || b.gridZ === undefined) {
    console.error("cubeDistance function received undefined properties.");
    return Infinity;
  }
  return Math.max(Math.abs(a.gridX - b.gridX), Math.abs(a.gridY - b.gridY), Math.abs(a.gridZ - b.gridZ));
}

function preload() {
  font = loadFont('wonderland.ttf');
  svgKnight = loadImage('knight.svg');
  svgBowDefender = loadImage('bowdefender.svg');
  svgArcher = loadImage('archer.svg');
  svgSpearman = loadImage('spearman.svg');
  svgDragon = loadImage('dragon.svg');
  svgKraken = loadImage('kraken.svg');
  svgHorse = loadImage('horse.svg');
}



function isenemyTraversable(hex, enemyInstance) {
  if (enemyInstance instanceof SeaMonster) {
    return hex.type === 'water';
  }
  // Existing conditions for other enemies
  return !(hex.type === 'mountain' || hex.type === 'water' || hex.type === 'castle');
}

function getNextStepTowards(start, target) {
  let bestStep = null;
  let minDist = Infinity;

  for (let direction of CUBE_DIRECTIONS) {
    let nextHexCoords = {
      x: start.gridX + direction.x,
      y: start.gridY + direction.y,
      z: start.gridZ + direction.z
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

// Function to Get Direction Name Based on Number
function getDirectionName(directionNumber) {
  switch (directionNumber) {
    case 1:
      return 'N';
    case 2:
      return 'NE';
    case 3:
      return 'SE';
    case 4:
      return 'S';
    case 5:
      return 'SW';
    case 6:
      return 'NW';
    default:
      return '';
  }
}

function isTraversable(hex, player) {
  // Check terrain type and player's abilities
  if (hex.type === 'water') {
    // Allow traversal if player has a ship or the hex contains an uncollected ship
    return player.hasShip || ships.some(ship => 
      ship.gridX === hex.cubeX && 
      ship.gridY === hex.cubeY && 
      ship.gridZ === hex.cubeZ && 
      ship.carriedBy === null
    );
  }
  return true;
}

class Horse {
  constructor(hex) {
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
    this.carriedBy = null;
  }

  /**
   * Displays the horse.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
    if (hex && this.carriedBy === null) { // Only display if not carried
      pg.push();
      pg.translate(hex.x, hex.y);
      pg.image(svgHorse, -17, -18, HEX_SIZE * 1.3, HEX_SIZE * 1.3);
      pg.pop();
    }
}
}

class Hexagon {
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
    let bushCount = floor(random(5, 8)); // Number of bushes per grass hex

    for (let i = 0; i < bushCount; i++) {
      // Generate random position within the hexagon
      let angle = random(TWO_PI);
      let distance = random(this.size * 0.2, this.size * 0.7);
      let px = cos(angle) * distance;
      let py = sin(angle) * distance;

      // Check if the bush base is within the hexagon
      if (!isPointInHex(px, py, this.size)) {
        continue; // Skip if outside
      }

      // Define bush size
      let bushWidth = random(3, 8);
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
  const mountainLayers = floor(random(2, 3)); // 2 to 3 layers

  for (let i = 0; i < mountainLayers; i++) {
    // Generate random position within the hexagon
    let angle = random(TWO_PI);
    let distance = random(this.size * 0.1, this.size * 0.6);
    let px = cos(angle) * distance;
    let py = sin(angle) * distance;

    // Check if the base is within the hexagon
    if (!isPointInHex(px, py, this.size)) {
      continue; // Skip if outside
    }

    // Define mountain layer size
    let baseWidth = random(this.size, this.size);
    let height = random(this.size * 0.5, this.size*2);

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
    let reedCount = floor(random(6, 15)); // Number of reeds per swamp hex (3 to 5)

    for (let i = 0; i < reedCount; i++) {
      // Generate random position within the hexagon
      let angle = random(TWO_PI);
      let distance = random(this.size * 0.1, this.size * 0.7); // Position reeds towards the center

      let px = cos(angle) * distance;
      let py = sin(angle) * distance;

      // Check if the reed base is within the hexagon
      if (!isPointInHex(px, py, this.size)) {
        continue; // Skip if outside
      }

      // **Rotate the reed angle by 90 degrees anticlockwise**
      let reedAngle = random(-PI / 6, PI / 6) + PI / 2; // Original angle plus 90 degrees
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
    let treeCount = floor(random(1, 3)); // Number of trees per forest hex

    for (let i = 0; i < treeCount; i++) {
      // Generate random position within the hexagon
      let angle = random(TWO_PI);
      let distance = random(this.size * 0.1, this.size * 0.6);
      let px = cos(angle) * distance;
      let py = sin(angle) * distance;

      // Check if the tree base is within the hexagon
      if (!isPointInHex(px, py, this.size)) {
        continue; // Skip if outside
      }

      // Randomly choose a tree type
      let treeType = random(['pine', 'oak']);

      // Store tree properties
      this.trees.push({ x: px, y: py, type: treeType });
    }
  }

  /**
   * Displays the hexagon along with its bushes and trees.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) { // Defaults to the main canvas
    pg.push();
    pg.translate(this.x, this.y);

    // Set the terrain color
    pg.fill(this.getTerrainColor());
    pg.stroke(0);
    pg.strokeWeight(1);

    // Draw the hexagon shape for terrain
    pg.beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = TWO_PI / 6 * i;
      pg.vertex(this.size * cos(angle), this.size * sin(angle));
    }
    pg.endShape(CLOSE);

    // Draw castle graphic if hex is a castle
    if (this.type === 'castle') {
      this.drawCastle(pg);
    }

    // Draw castle vicinity stripes if applicable
    if (this.castleVicinity) {
          if (this.type !== 'castle') {
      this.drawCastleVicinityStripes(pg);
          }
    }

    // Draw bushes for grass hexes
    if (this.type === 'grass') {
      this.drawBushes(pg);
    }

    // Draw trees for forest hexes
    if (this.type === 'forest') {
      this.drawTreesOutlines(pg);
    }
    
      // Draw swamp reed bushes
  if (this.type === 'swamp') {
    this.drawReedBushes(pg);
  }
    
    // Draw mountains graphic if hex is a mountain
    if (this.type === 'mountain') {
      this.drawMountains(pg);
    }
    
    // Render teleporters
    if (this.type === 'teleporter') {
      pg.strokeWeight(2);
      pg.stroke(255);
      pg.beginShape();
      for (let a = 0; a < TWO_PI; a += 0.1) {
        let r = this.size * 0.5 * (1 + 0.3 * sin(4 * a));
        let sx = r * cos(a);
        let sy = r * sin(a);
        pg.vertex(sx, sy);
      }
      pg.endShape(); 
    }
    
    // Draw traps if present
    if (this.hasTrap) {
      this.drawTrap(pg);
    }

    // If highlighted, overlay a semi-transparent highlight
    if (this.highlighted) {
      pg.fill(255, 255, 0, 100); // Semi-transparent yellow
      pg.noStroke(); // Remove stroke for highlight overlay

      pg.beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = TWO_PI / 6 * i;
        pg.vertex(this.size * cos(angle), this.size * sin(angle));
      }
      pg.endShape(CLOSE);
    }

    pg.pop();
  }

  /**
   * Returns the color based on terrain type.
   */
  getTerrainColor() {
    switch (this.type) {
      case 'mountain':
        return color(139, 69, 19);
      case 'grass':
        return color(124, 200, 0);
      case 'forest':
        return color(34, 139, 34);
      case 'beach':
        return color(238, 214, 175);
      case 'castle':
        return color(200, 200, 200); // Light gray
      case 'swamp':
        return color(50, 107, 47); // Dark Olive Green
      case 'water':
        return color(70, 130, 180);
      case 'teleporter':
      default:
        return color(255, 60, 180);
    }
  }

  /**
   * Draws the castle graphic.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  drawCastle(pg) {
    pg.fill(150); // Castle color
    pg.stroke(0);
    pg.strokeWeight(1);

    // Draw castle towers
    let towerWidth = this.size / 3;
    let towerHeight = this.size / 2;

    pg.rectMode(CENTER);
    pg.rect(0, -this.size / 4, this.size, towerHeight); // Main building

    pg.rect(-this.size / 2 + towerWidth / 2, -this.size / 2, towerWidth, towerHeight); // Left tower
    pg.rect(this.size / 2 - towerWidth / 2, -this.size / 2, towerWidth, towerHeight); // Right tower

    // Draw battlements
    let battlementSize = towerWidth / 2;
    pg.rect(-this.size / 2 + battlementSize / 2, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
    pg.rect(0, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
    pg.rect(this.size / 2 - battlementSize / 2, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
  }



  
  
  /**
   * Draws diagonal stripes indicating castle vicinity.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  drawCastleVicinityStripes(pg) {
    pg.push();

    // Define the hexagon vertices
    let hexVertices = [];
    for (let i = 0; i < 6; i++) {
      let angle = TWO_PI / 6 * i - PI / 6;
      let x_i = this.size * cos(angle);
      let y_i = this.size * sin(angle);
      hexVertices.push(createVector(x_i, y_i));
    }

    // Calculate the bounding box of the hexagon
    let minY = min(hexVertices.map(v => v.y));
    let maxY = max(hexVertices.map(v => v.y));

    // Set the stripe properties
    pg.stroke(255, 128, 128); // Semi-transparent grey
    pg.strokeWeight(1);
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
          intersections.push(createVector(intersectX, intersectY));
        }
      }

      // Sort intersections by x-coordinate
      intersections.sort((p1, p2) => p1.x - p2.x);

      // Draw line segments between pairs of intersections
      for (let i = 0; i < intersections.length - 1; i += 2) {
        let p1 = intersections[i];
        let p2 = intersections[i + 1];
        pg.line(p1.x, p1.y, p2.x, p2.y);
      }
    }

    pg.pop();
  }

  /**
   * Draws traps on the hexagon as red spikes.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  drawTrap(pg) {
    pg.push();
    pg.translate(0, 0); // Center of the hex

    // Draw red spikes sticking up
    pg.fill(255, 0, 0); // Red color for traps
    pg.noStroke();

    let spikeHeight = this.size * 0.5;
    let spikeWidth = this.size * 0.2;
    let spikeCount = 6; // One spike per side

    for (let i = 0; i < spikeCount; i++) {
      let angle = TWO_PI / spikeCount * i - PI / 2; // Start pointing upwards
      pg.push();
      pg.rotate(angle);
      pg.beginShape();
      pg.vertex(0, 0);
      pg.vertex(spikeWidth / 2, -spikeHeight);
      pg.vertex(-spikeWidth / 2, -spikeHeight);
      pg.endShape(CLOSE);
      pg.pop();
    }

    pg.pop();
  }

  
    /**
   * Draws monochrome mountain graphics on mountain hexes.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
drawMountains(pg) {
  pg.push();

  // Sort mountains by baseWidth to draw larger layers first
  this.mountains.sort((a, b) => b.baseWidth - a.baseWidth);

      pg.stroke(0);
    // Set the fill color for the mountain layer
    pg.fill(139, 69, 19);
  
  for (let mountain of this.mountains) {
    pg.push();
    pg.translate(mountain.x, mountain.y);

    // Draw the triangular mountain layer
    pg.beginShape();
    pg.vertex(-mountain.baseWidth / 2, 0); // Left base
    pg.vertex(mountain.baseWidth / 2, 0);  // Right base
    pg.vertex(0, -mountain.height);        // Apex
    pg.endShape(CLOSE);

    pg.pop();
  }

  pg.pop();
}
  
    /**
   * Draws reed bushes on swamp hexes as static bushes.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  drawReedBushes(pg) {
    pg.push();

    // Define reed properties
    pg.stroke(0,150); // Black color for reeds
    pg.strokeWeight(1);

    for (let reed of this.reeds) {
      let { x, y, angle, length } = reed;

      // Calculate end position based on stored angle and length
      let endX = x + length * cos(angle);
      let endY = y + length * sin(angle);

      // Draw the main reed stem
      pg.line(x, y, endX, endY);

      // Add a small horizontal line at the end to represent a reed tip
      //pg.line(endX - 2, endY, endX + 2, endY);
    }

    pg.pop();
  }

  
  /**
   * Draws all bushes stored in the bushes array.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  drawBushes(pg) {
    pg.noFill();
    pg.stroke(0, 100); // Black outline for bushes
    pg.strokeWeight(1);
    pg.fill(124, 200, 0);

    for (let bush of this.bushes) {
      pg.ellipse(bush.x, bush.y, bush.width, bush.height);
      // Alternatively, you can add more complex bush shapes here
    }
  }

  /**
   * Draws all tree outlines stored in the trees array.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  drawTreesOutlines(pg) {
    pg.noFill();
    pg.stroke(0); // Black outline for trees
    pg.strokeWeight(1);

    for (let tree of this.trees) {
      this.drawSimpleTree(pg, tree.x, tree.y, tree.type);
    }
  }

  /**
   * Draws a simple tree outline based on its type.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   * @param {number} x - X-coordinate relative to hex center.
   * @param {number} y - Y-coordinate relative to hex center.
   * @param {string} type - Type of the tree ('pine' or 'oak').
   */
  drawSimpleTree(pg, x, y, type) {
    pg.push();
    pg.translate(x, y);
    pg.fill(34, 139, 34);

    if (type === 'pine') {
      // Draw Pine Tree Outline
      pg.beginShape();
      pg.vertex(-10, 0);
      pg.vertex(10, 0);
      pg.vertex(0, -30);
      pg.endShape(CLOSE);

    } else if (type === 'oak') {
      // Draw Oak Tree Outline
      pg.line(0, 0, 0, -20); // Trunk

      // Foliage as a circle
      pg.ellipse(0, -25, 20, 15);
    }

    pg.pop();
  }
}



class Player {
  constructor(index, hex, color) {
    this.index = index;
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
    this.color = color;
    this.treasures = 0;
    this.extraDice = 0;
    this.hasShip = false;
    this.alive = true;
    this.history = [{ x: this.x, y: this.y }];
    
    this.baseDice = NUM_DICE; // Initialize baseDice to NUM_DICE

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
   * Displays the player.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (!this.alive) return; // Do not display if dead

    let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
    if (hex) {
      pg.fill(this.color);
      pg.noStroke();
      pg.ellipse(hex.x, hex.y, HEX_SIZE * 1.8, HEX_SIZE * 1.8); // Reduced size
      
      pg.image(svgKnight, hex.x-24, hex.y-30, 52, 52);
      
      // Draw ship icon if player has a ship
      if (this.hasShip) {
        pg.fill(255);
        pg.noStroke();
        let shipSize = HEX_SIZE / 1.5; // Smaller ship
        pg.triangle(
          hex.x, hex.y - shipSize / 2,
          hex.x - shipSize / 2, hex.y + shipSize / 2,
          hex.x + shipSize / 2, hex.y + shipSize / 2
        );
      }

      // Display treasure count near the player
      pg.fill(255, 255, 0);
      pg.textSize(10);
      pg.textAlign(CENTER, CENTER);
      //pg.text(`${this.treasures}`, hex.x, hex.y);
    }
  }
}

class enemy {
  constructor(hex) {
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
    this.alive = true; // To track if the enemy is alive
  }

  /**
   * Displays the Spearman.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    if (!this.alive) return; // Do not display if dead

    pg.fill(0);
    pg.noStroke();
    pg.image(svgSpearman, this.x-22, this.y-29, HEX_SIZE * 2, HEX_SIZE * 2);
    
  }

  /**
   * Moves the enemy towards the closest player.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   */
  moveTowards(players, enemies) {
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
        let nextStep = getNextStepTowards(this, closestPlayer);
        if (nextStep) {
          let intermediateHex = getHexAt(nextStep.x, nextStep.y, nextStep.z);
          if (intermediateHex && isenemyTraversable(intermediateHex, this) && isHexFullyVisible(intermediateHex)) {
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
    let newHex = getHexAt(this.gridX, this.gridY, this.gridZ);
    if (newHex) {
      this.x = newHex.x;
      this.y = newHex.y;
    }
  }
}

class SeaMonster extends enemy {
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

    // For simplicity, we'll draw an ellipse
    //pg.ellipse(0, 0, HEX_SIZE * 1.5, HEX_SIZE * 1.5);
    pg.image(svgKraken, -22, -23, HEX_SIZE * 1.8, HEX_SIZE * 1.8);

    pg.pop();
  }

  /**
   * Moves the Sea Monster towards the closest player, only through water hexes.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   */
  moveTowards(players, enemies) {
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
      let nextStep = this.getNextSeaStepTowards(closestPlayer, enemies);
      if (nextStep) {
        this.updatePosition(nextStep);
        console.log(`Sea Monster moved to (${nextStep.gridX}, ${nextStep.gridY}, ${nextStep.gridZ})`);
      }
    }
  }

  /**
   * Gets the next step towards the target, moving only through water hexes.
   * @param {Player} target - The target player.
   * @param {Array} enemies - Array of enemy objects.
   * @returns {Object|null} - The next cube coordinates { gridX, gridY, gridZ } or null if no valid step.
   */
  getNextSeaStepTowards(target, enemies) {
    let bestStep = null;
    let minDist = Infinity;

    for (let direction of CUBE_DIRECTIONS) {
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
    let newHex = getHexAt(this.gridX, this.gridY, this.gridZ);
    if (newHex) {
      this.x = newHex.x;
      this.y = newHex.y;
    }
  }
}

class BowDefender extends enemy {
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
    // You can use an image or draw a shape here
    // For example, using a placeholder rectangle

    pg.image(svgBowDefender, -22, -29, HEX_SIZE * 1.8, HEX_SIZE * 1.8);
        //pg.image(svgArcher, -22, -29, HEX_SIZE * 2.2, HEX_SIZE * 2);

    pg.pop();
  }

  /**
   * BowDefenders do not move, so override the moveTowards method to do nothing.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   */
  moveTowards(players, enemies) {
    // BowDefenders are static and do not move
  }
  
  getBattleRoll() {
    return floor(random(1, 5)); // Generates a number between 1 and 4
  }
  
}

class Archer extends enemy {
  constructor(hex) {
    super(hex);
    this.attackRange = 2; // Archer can attack up to 2 hexes
    this.hasAttackedThisTurn = false;
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
    pg.fill(139,69,19);
    pg.noStroke();
    //pg.ellipse(0, 0, HEX_SIZE * 1.5, HEX_SIZE * 1.5);
    pg.image(svgArcher, -22, -29, HEX_SIZE * 2.2, HEX_SIZE * 2);
    pg.pop();
  }

  /**
   * Generates a battle roll using a four-sided die (d4).
   * @returns {number} - The result of the battle roll (1-4).
   */
  getBattleRoll() {
    return floor(random(1, 5)); // Generates a number between 1 and 4
  }

  /**
   * Moves the archer towards the closest player, maintaining at least 2 hexes distance.
   * Overrides the enemy's moveTowards method.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   */
  moveTowards(players, enemies) {
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
        let nextStep = getNextStepTowards(this, closestPlayer);
        if (nextStep) {
          let intermediateHex = getHexAt(nextStep.x, nextStep.y, nextStep.z);
          if (intermediateHex && isenemyTraversable(intermediateHex) && isHexFullyVisible(intermediateHex)) {
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

class DragonEnemy extends enemy {
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
    //pg.ellipse(this.x, this.y, HEX_SIZE * 1.2 * this.sizeMultiplier, HEX_SIZE * 1.2 * this.sizeMultiplier);
    pg.image(svgDragon, this.x-25, this.y-23, HEX_SIZE * 1.8, HEX_SIZE * 1.8);
  }

  /**
   * Moves the Dragon enemy towards the closest player.
   * @param {Array} players - Array of Player objects.
   * @param {Array} enemies - Array of enemy objects.
   */
  moveTowards(players, enemies) {
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
      let nextStep = getNextStepTowards(this, closestPlayer);
      if (nextStep) {
        let intermediateHex = getHexAt(nextStep.x, nextStep.y, nextStep.z);
        if (intermediateHex && isenemyTraversable(intermediateHex) && isHexFullyVisible(intermediateHex)) {
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
}

class Ship {
  constructor(hex) {
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
    this.carriedBy = null;
  }

  /**
   * Displays the ship.
   * @param {p5.Graphics} pg - The graphics context to draw on.
   */
  display(pg = window) {
    let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
    if (hex && this.carriedBy === null) { // Only display if not carried
      pg.push();
      pg.translate(hex.x, hex.y);

      // Draw boat hull
      pg.fill(165, 42, 42); // Brown color for the hull
      pg.noStroke();
      pg.beginShape();
      pg.vertex(-HEX_SIZE * 0.3, HEX_SIZE * 0.1);
      pg.vertex(HEX_SIZE * 0.3, HEX_SIZE * 0.1);
      pg.vertex(HEX_SIZE * 0.2, HEX_SIZE * 0.3);
      pg.vertex(-HEX_SIZE * 0.2, HEX_SIZE * 0.3);
      pg.endShape(CLOSE);

      // Draw mast
      pg.stroke(160, 82, 45); // Lighter brown for the mast
      pg.strokeWeight(2);
      pg.line(0, HEX_SIZE * 0.1, 0, -HEX_SIZE * 0.3);

      // Draw sail
      pg.fill(255); // White color for the sail
      pg.noStroke();
      pg.triangle(0, -HEX_SIZE * 0.3, HEX_SIZE * 0.2, 0, 0, 0);

      pg.pop();
    }
  }
}

/**
 * Initializes players with starting positions.
 */
/**
 * Initializes players with starting positions, avoiding occupied hexes.
 */
function initializePlayers() {
  let centerX = 0;
  let centerY = 0;

  // Filter hexes that are within 5 units of center, are land hexes, and are fully visible
  let startingHexes = hexGrid.filter(hex => 
    isLandHex(hex) &&
    Math.abs(hex.cubeX - centerX) <= 5 &&
    Math.abs(hex.cubeY - centerY) <= 5 &&
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex) // Ensure the hex is not occupied
  );

  if (startingHexes.length === 0) {
    // Expand to the whole map if no hexes are available in the center area
    startingHexes = hexGrid.filter(hex => isLandHex(hex) && isHexFullyVisible(hex) && !isHexOccupied(hex));
  }

  players = [];

  for (let i = 0; i < numPlayers; i++) {
    if (startingHexes.length === 0) {
      console.error('No available starting hexes for players.');
      break;
    }
    let playerHex = random(startingHexes);
    let color = i === 0 ? 'red' : 'blue';
    players.push(new Player(i, playerHex, color));
    startingHexes = startingHexes.filter(h => h !== playerHex); // Remove to prevent duplicates
  }
}


/**
 * Calculates the grid dimensions based on canvas size.
 */
function calculateGridDimensions() {
  cols = ceil(width / (HEX_SIZE * 1.5)) + 1; // Number of columns to cover the width
  rows = ceil(height / (HEX_SIZE * sqrt(3))) + 1; // Number of rows to cover the height
}



/**
 * Populates the hex grid with hexagons based on terrain.
 */
function populateHexGrid() {
  hexGrid = [];

  // Adjust the ranges of q and r to cover the screen
  for (let q = -cols; q <= cols; q++) {
    for (let r = -rows; r <= rows; r++) {
      let { x, y } = calculateHexPosition(q, r);

      // Proceed only if the hex is within the canvas bounds
      if (x < -HEX_SIZE || x > width + HEX_SIZE || y < -HEX_SIZE || y > height + HEX_SIZE) {
        continue; // Skip hexes outside the canvas
      }

      let { cubeX, cubeY, cubeZ } = calculateCubeCoordinates(q, r);
      let type = determineTerrainType({ cubeX, cubeY, cubeZ });
      hexGrid.push(new Hexagon(x, y, HEX_SIZE, type, cubeX, cubeY, cubeZ));
    }
  }
}

/**
 * Determines the terrain type based on Perlin noise.
 * @param {Object} hex - Object containing cubeX, cubeY, cubeZ.
 * @returns {string} - Terrain type.
 */
function determineTerrainType(hex) {
  let { cubeX, cubeY, cubeZ } = hex;

  // Scale the cube coordinates to get consistent noise values
  let noiseScale = 0.1; // Adjust this value to change the "zoom" level of the noise
  let noiseValue = noise(cubeX * noiseScale, cubeY * noiseScale);

  let type = 'water';

  if (noiseValue < 0.4) {
    type = 'water';
  } else if (noiseValue < 0.45) {
    type = 'beach';
  } else if (noiseValue < 0.6) {
    type = 'grass';
  } else if (noiseValue < 0.62) {
    type = 'swamp';
  } else if (noiseValue < 0.8) {
    type = 'forest';
  } else {
    type = 'mountain';
  }

  return type;
}

/**
 * Checks if a hex is occupied by any element (player, enemy, teleporter, treasure, ship, trap).
 * @param {Hexagon} hex - The hexagon to check.
 * @returns {boolean} - True if the hex is occupied, false otherwise.
 */
function isHexOccupied(hex) {
  // Check if any player is on the hex
  let playerOnHex = players.some(p => p.gridX === hex.cubeX && p.gridY === hex.cubeY && p.gridZ === hex.cubeZ);

  // Check if any enemy is on the hex
  let enemyOnHex = enemies.some(m => m.gridX === hex.cubeX && m.gridY === hex.cubeY && m.gridZ === hex.cubeZ);

  // Check if the hex is a teleporter
  let isTeleporterHex = (hex.type === 'teleporter');

  // Check if any treasure is on the hex
  let treasureOnHex = treasures.some(t => t.hex.cubeX === hex.cubeX && t.hex.cubeY === hex.cubeY && t.hex.cubeZ === hex.cubeZ);

  // Check if any ship is on the hex
  let shipOnHex = ships.some(s => s.gridX === hex.cubeX && s.gridY === hex.cubeY && s.gridZ === hex.cubeZ);

  // Check if the hex has a trap
  let hexHasTrap = hex.hasTrap;

  return playerOnHex || enemyOnHex || isTeleporterHex || treasureOnHex || shipOnHex || hexHasTrap;
}

/**
 * Places horses on the map.
 */
function placeHorses() {
  horses = [];
  let landHexes = hexGrid.filter(hex => 
    isLandHex(hex) && 
    hex.type !== 'mountain' && 
    hex.type !== 'castle' && 
    hex.type !== 'beach' && 
    isHexFullyVisible(hex)
  );

  for (let i = 0; i < numberHorses; i++) { // Adjust the number of horses as needed
    if (landHexes.length === 0) break;
    let randomHex = random(landHexes);
    if (!horses.some(h => h.gridX === randomHex.cubeX && h.gridY === randomHex.cubeY && h.gridZ === randomHex.cubeZ)) {
      horses.push(new Horse(randomHex));
      landHexes = landHexes.filter(h => h !== randomHex); // Prevent duplicates
    }
  }
}

/**
 * Places traps on the map.
 */
function placeTraps() {
  let landHexes = hexGrid.filter(hex => 
    isLandHex(hex) && 
    hex.type !== 'castle' && 
    hex.type !== 'teleporter' && 
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex) // Ensure the hex is not occupied
  );

  // Ensure there are enough land hexes to place traps
  if (landHexes.length < numberTraps) {
    console.error("Not enough land hexes to place traps.");
    return;
  }

  for (let i = 0; i < numberTraps; i++) {
    let randomHex = random(landHexes);
    // Assign a trap to the hex
    randomHex.hasTrap = true;
    // Remove the hex from the pool to prevent multiple traps on the same hex
    landHexes = landHexes.filter(h => h !== randomHex);
  }
}


/**
 * Places teleporters on the map.
 */
/**
 * Places teleporters on the map, avoiding occupied hexes.
 */
function placeTeleporters() {
  if (!teleporters) return;
  // Filter land hexes excluding castles and occupied hexes
  let landHexes = hexGrid.filter(hex => 
    isLandHex(hex) && 
    hex.type !== 'castle' && 
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex) // Ensure the hex is not occupied
  );

  // Ensure there are enough land hexes to place teleporters
  if (landHexes.length < 2) {
    console.error("Not enough land hexes to place teleporters.");
    return;
  }

  // Randomly select two distinct hexes
  teleportHex1 = random(landHexes);
  landHexes = landHexes.filter(hex => hex !== teleportHex1);
  teleportHex2 = random(landHexes);

  // Set their type to 'teleporter'
  teleportHex1.type = 'teleporter';
  teleportHex2.type = 'teleporter';
}


/**
 * Places treasures on the map, avoiding occupied hexes.
 */
function placeTreasures() {
  treasures = [];
  let allHexes = hexGrid.filter(hex => isHexFullyVisible(hex) && !isHexOccupied(hex)); // Use only fully visible and unoccupied hexes

  for (let i = 0; i < numberTreasure; i++) {
    if (allHexes.length === 0) break;
    let randomHex = random(allHexes);
    treasures.push({ hex: randomHex, collected: false });
    allHexes = allHexes.filter(h => h !== randomHex); // Remove to prevent duplicates
  }
}

/**
 * Places castles on the map.
 */
function placeCastles() {
  let suitableHexes = hexGrid.filter(hex => isLandHex(hex) && hex.type !== 'mountain' && isHexFullyVisible(hex));

  for (let i = 0; i < castleCount; i++) {
    if (suitableHexes.length === 0) break;
    let randomHex = random(suitableHexes);
    randomHex.type = 'castle';
    suitableHexes = suitableHexes.filter(h => h !== randomHex);
    
    let neighbors = getNeighbors(randomHex.cubeX, randomHex.cubeY, randomHex.cubeZ);
    neighbors.forEach(neighborCoords => {
      let neighborHex = getHexAt(neighborCoords.x, neighborCoords.y, neighborCoords.z);
      if (neighborHex) {
        neighborHex.castleVicinity = true;
      }
    });
  }
}


/**
 * Places enemies on the map, avoiding occupied hexes.
 */
function placeenemies() {
  enemies = [];
  let landHexes = hexGrid.filter(hex => 
    isLandHex(hex) && 
    hex.type !== 'mountain' && 
    hex.type !== 'castle' && 
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex) // Ensure the hex is not occupied
  );

  // Place regular enemies
  for (let i = 0; i < numberSpearman; i++) {
    if (landHexes.length === 0) break;
    let randomHex = random(landHexes);
    enemies.push(new enemy(randomHex));
    landHexes = landHexes.filter(h => h !== randomHex); // Prevent duplicates
  }

  // Place Dragon enemies
  for (let i = 0; i < numberDragons; i++) {
    if (landHexes.length === 0) break;
    let DragonHex = random(landHexes);
    enemies.push(new DragonEnemy(DragonHex));
    landHexes = landHexes.filter(h => h !== DragonHex);
  }
  
    // Place Sea Monsters
  for (let i = 0; i < numberSeaMonsters; i++) {
      let waterHexes = hexGrid.filter(hex => 
    isWaterHex(hex));
    
    if (waterHexes.length === 0) break;
    let seaMonsterHex = random(waterHexes);
    enemies.push(new SeaMonster(seaMonsterHex));
    waterHexes = waterHexes.filter(h => h !== seaMonsterHex); // Prevent duplicates
  }

  // Place archers
  for (let i = 0; i < numberArchers; i++) {
    if (landHexes.length === 0) break;
    let archerHex = random(landHexes);
    enemies.push(new Archer(archerHex));
    landHexes = landHexes.filter(h => h !== archerHex); // Prevent duplicates
  }

  // Place BowDefenders
  let possibleDefenderHexes = [];

  // Collect neighbor hexes next to treasures
  for (let treasure of treasures) {
    let neighborHexes = getNeighbors(treasure.hex.cubeX, treasure.hex.cubeY, treasure.hex.cubeZ)
      .map(coords => getHexAt(coords.x, coords.y, coords.z))
      .filter(hex => hex && isLandHex(hex) && !isHexOccupied(hex));

    possibleDefenderHexes = possibleDefenderHexes.concat(neighborHexes);
  }

  // Collect neighbor hexes next to teleporters
  if (teleporters && teleportHex1 && teleportHex2) {
    let teleportHexes = [teleportHex1, teleportHex2];
    for (let teleHex of teleportHexes) {
      if (!teleHex) continue; // Skip if undefined
      let neighborHexes = getNeighbors(teleHex.cubeX, teleHex.cubeY, teleHex.cubeZ)
        .map(coords => getHexAt(coords.x, coords.y, coords.z))
        .filter(hex => hex && isLandHex(hex) && !isHexOccupied(hex));

      possibleDefenderHexes = possibleDefenderHexes.concat(neighborHexes);
    }
  }

  // Remove duplicates from possibleDefenderHexes
  possibleDefenderHexes = [...new Set(possibleDefenderHexes)];

  // Filter out any hexes that are now occupied
  possibleDefenderHexes = possibleDefenderHexes.filter(hex => !isHexOccupied(hex));

  // Limit to numberBowDefenders
  let defendersToPlace = Math.min(numberBowDefenders, possibleDefenderHexes.length);

  // Randomly select hexes for BowDefenders
  for (let i = 0; i < defendersToPlace; i++) {
    if (possibleDefenderHexes.length === 0) break;
    let index = floor(random(possibleDefenderHexes.length));
    let defenderHex = possibleDefenderHexes.splice(index, 1)[0];
    enemies.push(new BowDefender(defenderHex));
    landHexes = landHexes.filter(h => h !== defenderHex); // Prevent duplicates
  }

}

/**
 * Places ships on the map, avoiding occupied hexes.
 */
function placeShips() {
  ships = [];
  let edgeWaterHexes = hexGrid.filter(hex => isEdgeWaterHex(hex) && isHexFullyVisible(hex) && !isHexOccupied(hex));

  for (let i = 0; i < numberShips; i++) {
    if (edgeWaterHexes.length === 0) break;
    let randomHex = random(edgeWaterHexes);
    ships.push(new Ship(randomHex));
    edgeWaterHexes = edgeWaterHexes.filter(h => h !== randomHex); // Remove to prevent duplicates
  }
}

/**
 * Determines if a hex is a land hex based on its type.
 * @param {Hexagon} hex - The hexagon to check.
 * @returns {boolean} - True if land hex, false otherwise.
 */
function isLandHex(hex) {
  return ['grass', 'forest', 'mountain', 'beach', 'castle'].includes(hex.type);
}

/**
 * Determines if a hex is a water hex.
 * @param {Hexagon} hex - The hexagon to check.
 * @returns {boolean} - True if water hex, false otherwise.
 */
function isWaterHex(hex) {
  return hex.type === 'water';
}

/**
 * Determines if a hex is a mountain.
 * @param {Hexagon} hex - The hexagon to check.
 * @returns {boolean} - True if mountain hex, false otherwise.
 */
function isMountainHex(hex) {
  return hex.type === 'mountain';
}

/**
 * Determines if a hex is an edge water hex (adjacent to land).
 * @param {Hexagon} hex - The hexagon to check.
 * @returns {boolean} - True if edge water hex, false otherwise.
 */
function isEdgeWaterHex(hex) {
  if (hex.type !== 'water') return false;
  let neighbors = getNeighbors(hex.cubeX, hex.cubeY, hex.cubeZ);
  return neighbors.some(neighbor => {
    let neighborHex = getHexAt(neighbor.x, neighbor.y, neighbor.z);
    return neighborHex && isLandHex(neighborHex);
  });
}

/**
 * Retrieves neighboring cube coordinates.
 * @param {number} x - Cube coordinate x.
 * @param {number} y - Cube coordinate y.
 * @param {number} z - Cube coordinate z.
 * @returns {Array} - Array of neighbor coordinates.
 */
function getNeighbors(x, y, z) {
  return CUBE_DIRECTIONS.map(direction => ({
    x: x + direction.x,
    y: y + direction.y,
    z: z + direction.z
  }));
}

/**
 * Retrieves a hexagon at specific cube coordinates.
 * @param {number} cubeX - Cube coordinate x.
 * @param {number} cubeY - Cube coordinate y.
 * @param {number} cubeZ - Cube coordinate z.
 * @returns {Hexagon|null} - The hexagon if found, else null.
 */
function getHexAt(cubeX, cubeY, cubeZ) {
  return hexGrid.find(hex => hex.cubeX === cubeX && hex.cubeY === cubeY && hex.cubeZ === cubeZ) || null;
}

/**
 * Checks if a hex is fully visible within the canvas boundaries.
 * @param {Hexagon} hex - The hexagon to check.
 * @returns {boolean} - True if fully visible, false otherwise.
 */
function isHexFullyVisible(hex) {
  // Calculate the positions of the hex's corners
  const cornerDistance = HEX_SIZE; // Since HEX_SIZE is the distance from center to corner
  const left = hex.x - cornerDistance;
  const right = hex.x + cornerDistance;
  const top = hex.y - cornerDistance;
  const bottom = hex.y + cornerDistance;

  // Check if all corners are within the canvas boundaries
  return left >= 0 && right <= width && top >= 0 && bottom <= height;
}

/**
 * Displays the hex grid.
 */
function displayHexGrid() {
  for (let hex of hexGrid) {
    hex.display(); // Defaults to main canvas
  }
}

/**
 * Displays ships on the map.
 */
function displayShips() {
  for (let ship of ships) {
    ship.display(); // Defaults to main canvas
  }
}

/**
 * Displays horses on the map.
 */
function displayHorses() {
  for (let horse of horses) {
    horse.display(); // Defaults to main canvas
  }
}

/**
 * Displays players on the map.
 */
function displayPlayers() {
  for (let player of players) {
    player.display(); // Defaults to main canvas
  }
}

/**
 * Displays player movement paths.
 */
function displayPlayerPaths() {
  for (let player of players) {
    if (player.history.length > 1) {
      stroke(player.color);
      strokeWeight(2);
      noFill();
      beginShape();
      for (let pos of player.history) {
        vertex(pos.x, pos.y);
      }
      endShape();
    }
  }
}

/**
 * Displays treasures on the map.
 */
function displayTreasures() {
  for (let treasure of treasures) {
    if (!treasure.collected) {
      fill(255, 223, 0);
      strokeWeight(2);
      stroke(0);
      ellipse(treasure.hex.x, treasure.hex.y, HEX_SIZE / 2, HEX_SIZE / 2);
    }
  }
}

/**
 * Displays enemies on the map.
 */
function displayenemies() {
  for (let enemy of enemies) {
    enemy.display(); // Defaults to main canvas
  }
}

/**
 * Displays direction numbers around the current player.
 */
function displayDirectionNumbers() {

  if ((gamePhase === 'battle') || (gamePhase === 'battleEnd')) return;
  
  if (players.length === 0) return; // No players initialized

  let currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer.alive) return; // Skip if current player is not alive

  let playerHex = getHexAt(currentPlayer.gridX, currentPlayer.gridY, currentPlayer.gridZ);

  if (playerHex) {
    // Get all neighbors
    let neighbors = getNeighbors(playerHex.cubeX, playerHex.cubeY, playerHex.cubeZ);

    for (let i = 0; i < CUBE_DIRECTIONS.length; i++) {
      let direction = CUBE_DIRECTIONS[i];
      let neighborCoords = {
        x: playerHex.cubeX + direction.x,
        y: playerHex.cubeY + direction.y,
        z: playerHex.cubeZ + direction.z
      };
      let neighborHex = getHexAt(neighborCoords.x, neighborCoords.y, neighborCoords.z);
      if (neighborHex) {
        // Draw the direction number on the neighbor
        fill(255);
        stroke(0);
        strokeWeight(3);
        textSize(24);
        textAlign(CENTER, CENTER);
        text(i + 1, neighborHex.x, neighborHex.y);
      }
    }
  }
}

/**
 * Displays dice roll instructions and information.
 */
function displayDiceRoll() {
  
  textSize(20);
  fill(255);
  textAlign(LEFT, TOP);

  if (players.length === 0) return; // No players initialized

  let currentPlayer = players[currentPlayerIndex];

  // If the current player is not alive, skip displaying their info
  if (!currentPlayer.alive) return;

  text(`${seed} `, width-100, 20);
  if (gamePhase === 'roll') {
    text(`Player ${currentPlayer.index + 1} - ${currentPlayer.getCurrentDiceCount()} horses ${currentPlayer.treasures} treasure `, 10, 20);
  } else if (selectionPhase) {
    text(`Player ${currentPlayer.index + 1} - ${currentPlayer.getCurrentDiceCount()} horses ${currentPlayer.treasures} treasure `, 10, 20);
    text(`Select Dice for Direction and Distance`, 10, 50);
  } else if (gamePhase === 'move') {
    text(`Player ${currentPlayer.index + 1} has moved.`, 10, 20);
  } else if (gamePhase === 'battle') {
    text(`Battle Phase: Click 'Roll Dice' to fight.`, 10, 20);
  } else if (gamePhase === 'end') {
    text(`Game Over! Click 'Next' to continue.`, 10, 20);
  }
}

/**
 * Displays feedback messages to the player.
 */
function displayMessage() {
  if (message !== '') {
    textSize(16);
    fill(255, 0, 0);
    textAlign(CENTER, TOP);
    text(message, width / 2, 80); // Adjusted position for better visibility
  }
}

/**
 * Displays dice on the canvas based on the current game phase.
 */
/**
 * Displays dice on the canvas based on the current game phase.
 */
function displayDice() {
  if (!diceVisible) return; // Only display dice if diceVisible is true
  
  let currentPlayer = players[currentPlayerIndex];
  let diceCount = currentPlayer.getCurrentDiceCount();
  
  // Position dice at the bottom of the canvas
  let dieSize = 80; // Adjust size as needed
  let dieSpacing = 15;
  let totalWidth = diceCount * dieSize + (diceCount - 1) * dieSpacing; // Updated for variable dice
  let startX = (width - totalWidth) / 2;
  let dieY = height - dieSize - 150; // Adjusted to accommodate buttons

  // Display player's dice during 'select', 'confirmMove', and 'end' phases
  if (selectionPhase || gamePhase === 'confirmMove') {
    for (let i = 0; i < diceCount; i++) {
      let dieX = startX + i * (dieSize + dieSpacing);
      drawDie(dieX, dieY, dieSize, diceRolls[i], 'player');
    }

    // Highlight selected dice
    for (let i = 0; i < selectedDiceIndices.length; i++) {
      let dieIndex = selectedDiceIndices[i];
      if (dieIndex >= diceCount) continue; // Prevent out-of-bounds
      let dieX = startX + dieIndex * (dieSize + dieSpacing);
      let dieYPos = dieY;
      stroke(i === 0 ? '#F44336' : '#2196F3'); // Red for direction, Blue for distance
      strokeWeight(5);
      noFill();
      rect(dieX - 5, dieYPos - 5, dieSize + 10, dieSize + 10, 10); // Rounded corners
      noStroke();
    }
  }

  // Display enemy's die during 'battle' or 'end' phase
  if (gamePhase === 'battle' || gamePhase === 'battleEnd' || gamePhase === 'end') {
    let enemyDieSize = 100;
    let enemyDieX = width / 2 - enemyDieSize / 2;
    let enemyDieY = height / 2 - enemyDieSize / 2;
    drawDie(enemyDieX, enemyDieY, enemyDieSize, enemyBattleRoll, 'enemy', enemyDefeated);
    textSize(16);
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text("Enemy's Roll", width / 2, enemyDieY + enemyDieSize + 20);

    // If player has rolled, display their die
    if (playerBattleRoll > 0) {
      let playerDieSize = 100;
      let playerDieX = width / 2 - playerDieSize / 2;
      let playerDieY = height / 2 + enemyDieSize; // Below enemy's die

      drawDie(playerDieX, playerDieY, playerDieSize, totalPlayerRoll, 'player', playerDefeated);
      textSize(16);
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      text(`Roll ${playerBattleRoll} + ${totalPlayerRoll - playerBattleRoll - bonus} treasures + ${bonus} castle bonus`, width / 2, playerDieY + playerDieSize + 20);
    }
  }
}

/**
 * Draws a die face on the given graphics context.
 * @param {number} x - X-coordinate of the die.
 * @param {number} y - Y-coordinate of the die.
 * @param {number} size - Size of the die.
 * @param {number} value - Die value (1-6 or higher).
 * @param {string} role - 'player' or 'enemy'.
 * @param {boolean} dead - Whether to display a 'dead' indicator.
 */
function drawDie(x, y, size, value, role, dead) {
  push();
  translate(x, y);

  // Set die color based on role
  if (role === 'enemy') {
    fill(0); // Black die for enemy
  } else if (role === 'player') {
    fill(255); // White die for player
  } else {
    fill(255); // Default to white
  }

  stroke(0);
  strokeWeight(2);
  rect(0, 0, size, size, 10); // Draw die background with rounded corners

  if (dead === true) {
    stroke(255, 0, 0); // Red 'X' for clarity
    strokeWeight(5);
    line(0, 0, size, size);
    line(size, 0, 0, size);
  }

  // Set dot properties
  if (role === 'player') {
    fill(0); // Black dots on white die
  } else {
    fill(255); // White dots on black die
  }
  noStroke();
  let dotSize = size / 8;
  let offset = size / 4;

  if (value <= 6) {
    // Positions based on die value
    let positions = {
      1: [[size / 2, size / 2]],
      2: [[offset, offset], [size - offset, size - offset]],
      3: [[offset, offset], [size / 2, size / 2], [size - offset, size - offset]],
      4: [
        [offset, offset],
        [offset, size - offset],
        [size - offset, offset],
        [size - offset, size - offset]
      ],
      5: [
        [offset, offset],
        [offset, size - offset],
        [size / 2, size / 2],
        [size - offset, offset],
        [size - offset, size - offset]
      ],
      6: [
        [offset, offset],
        [offset, size / 2],
        [offset, size - offset],
        [size - offset, offset],
        [size - offset, size / 2],
        [size - offset, size - offset]
      ]
    };

    let dots = positions[value] || [];

    for (let pos of dots) {
      ellipse(pos[0], pos[1], dotSize, dotSize);
    }
  } else {
    // For values greater than 6, display the number
    fill(role === 'player' ? 0 : 255);
    textSize(size / 2);
    textAlign(CENTER, CENTER);
    text(value, size / 2, size / 2);
  }

  pop();
}

/**
 * Exports the current game map as an SVG file.
 */
function exportSVG() {
  let svgCanvas = createGraphics(width, height, SVG);
  svgCanvas.background(220); // Set background color (optional)

  // Draw hexes
  for (let hex of hexGrid) {
    hex.display(svgCanvas); // Use the same display method with SVG context
  }

  // Draw treasures
  for (let treasure of treasures) {
    if (!treasure.collected) {
      svgCanvas.fill(255, 223, 0);
      svgCanvas.noStroke();
      svgCanvas.ellipse(treasure.hex.x, treasure.hex.y, HEX_SIZE / 2, HEX_SIZE / 2);
    }
  }

  // Draw ships
  for (let ship of ships) {
    if (ship.carriedBy === null) {
      ship.display(svgCanvas);
    }
  }

  // Draw enemies
  for (let enemy of enemies) {
    enemy.display(svgCanvas);
  }

    // Draw horses
  for (let horse of horses) {
    if (horse.carriedBy === null) {
      horse.display(svgCanvas);
    }
  }
  
  // Draw players
  for (let player of players) {
    player.display(svgCanvas);
  }

  // Optionally, draw paths, highlights, or other game elements here

  // Save the SVG file
  svgCanvas.save(`${seed}_HexQuest_Map.svg`);
}

/**
 * Handles key presses for additional controls.
 */
function keyPressed() {
  // Optional keyboard controls
  if (key.toLowerCase() === 'r') {
    if (gamePhase === 'roll') {
      rollDice();
    } else if (gamePhase === 'battle') {
      rollBattleDice();
    }
  }
  if (key.toLowerCase() === 's') {
    exportSVG();
  }
}

/**
 * Handles mouse press events for dice selection and button interactions.
 */
function mousePressed() {
    const activePhases = ['roll', 'select', 'confirmMove', 'battle', 'battleEnd', 'end', 'noMove'];
  if (!activePhases.includes(gamePhase)) {
    return; // Exit early if not in an active phase
  }

  // Ensure there is a current player
  if (!players || players.length === 0 || currentPlayerIndex >= players.length) {
    console.error('No current player found.');
    return;
  }

  let currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) {
    console.error('Current player is undefined.');
    return;
  }
  
  let diceCount = currentPlayer.getCurrentDiceCount();
  

  // Get the positions and sizes of buttons
  let rollButtonX = rollButton.position().x;
  let rollButtonY = rollButton.position().y;
  let rollButtonW = rollButton.size().width;
  let rollButtonH = rollButton.size().height;

  let nextButtonX = nextButton.position().x;
  let nextButtonY = nextButton.position().y;
  let nextButtonW = nextButton.size().width;
  let nextButtonH = nextButton.size().height;

  // Check if click is on Roll Button
  let clickOnRollButton = mouseX >= rollButtonX && mouseX <= rollButtonX + rollButtonW &&
                          mouseY >= rollButtonY && mouseY <= rollButtonY + rollButtonH;

  // Check if click is on Next Button
  let clickOnNextButton = mouseX >= nextButtonX && mouseX <= nextButtonX + nextButtonW &&
                          mouseY >= nextButtonY && mouseY <= nextButtonY + nextButtonH;

  // Handle Dice Selection Clicks Only If in 'select' Phase or 'battle' Phase
  if ((gamePhase === 'select' && selectionPhase) || (gamePhase === 'battle' && playerBattleRoll === 0)) {
    // Check if a die was clicked
    let dieSize = 80;
    let dieSpacing = 15;
    let totalWidth = diceCount * dieSize + (diceCount - 1) * dieSpacing; // Updated for variable dice
    //let totalWidth = NUM_DICE * dieSize + (NUM_DICE - 1) * dieSpacing; // Updated for variable dice
    let startX = (width - totalWidth) / 2;
    let dieY = height - dieSize - 150;

    let dieClicked = false;
    for (let i = 0; i < diceCount; i++) {
      let dieX = startX + i * (dieSize + dieSpacing);
      if (mouseX >= dieX && mouseX <= dieX + dieSize &&
          mouseY >= dieY && mouseY <= dieY + dieSize) {
        dieClicked = true;
        if (gamePhase === 'select' && selectionPhase) {
          selectDice(i);
        } else if (gamePhase === 'battle') {
          // Player clicks to roll their battle die
          rollBattleDice();
        }
        break;
      }
    }

    if (!dieClicked && !clickOnRollButton && !clickOnNextButton) {
      // Clicked outside dice and buttons, deselect dice
      selectedDiceIndices = [];
      console.log('Deselected dice.');

      // If in 'confirmMove' phase, cancel movement
      if (gamePhase === 'confirmMove') {
        console.log('Movement canceled.');
        for (let hex of currentPath) {
          hex.highlighted = false;
        }
        currentPath = [];
        gamePhase = 'select';
        message = 'Movement canceled. Please select your dice again.';
        selectedDiceIndices = [];
        // Hide Next button and show Roll Dice button
        nextButton.hide();
        rollButton.show();
      }
    }
  } else if (gamePhase === 'confirmMove') {
    if (!clickOnNextButton) {
      // User clicked away, cancel movement
      console.log('Movement canceled.');
      for (let hex of currentPath) {
        hex.highlighted = false;
      }
      currentPath = [];
      gamePhase = 'select';
      message = 'Movement canceled. Please select your dice again.';
      selectedDiceIndices = [];
      // Hide Next button and show Roll Dice button
      nextButton.hide();
      rollButton.hide();
    }
  }
}

function setup() {
  // Make the canvas responsive
  createCanvas(windowWidth, windowHeight); // Reserve some space for buttons

  
  // Create Seed Input and Buttons
  seedInput = createInput();
  seedInput.attribute('placeholder', 'Enter Seed');
  seedInput.size(192, 30);
  seedInput.position(width / 2 - 100, height / 2 + 140);

  generateSeedButton = createButton('Generate Seed');
  generateSeedButton.size(120, 30);
  generateSeedButton.position(width / 2-60, height / 2 + 175);
  generateSeedButton.mousePressed(() => {
    seed = floor(random(1, 1000000)); // Generate a random seed
    seedInput.value(seed);
    console.log(`Generated Seed: ${seed}`);
  });

  // Create Roll Dice Button
  rollButton = createButton('Roll Dice');
  let buttonWidth = 100;
  let buttonHeight = 40;
  rollButton.size(buttonWidth, buttonHeight);
  rollButton.style('font-size', '16px');
  rollButton.style('background-color', '#4CAF50');
  rollButton.style('color', 'white');
  rollButton.style('border', 'none');
  rollButton.style('border-radius', '5px');
  rollButton.position(width / 2 - buttonWidth / 2, height - 70); // Centered
  rollButton.mousePressed(() => {
    if (gamePhase === 'roll') {
      rollDice();
    } else if (gamePhase === 'battle') {
      rollBattleDice();
    }
  });
  
    // Create Toggle Dice Button
  toggleDiceButton = createButton('Toggle Dice');
  toggleDiceButton.size(100, 40);
  toggleDiceButton.style('font-size', '16px');
  toggleDiceButton.style('background-color', '#FF5722');
  toggleDiceButton.style('color', 'white');
  toggleDiceButton.style('border', 'none');
  toggleDiceButton.style('border-radius', '5px');
  toggleDiceButton.position(width - 100, height - 70); // Bottom right corner
  toggleDiceButton.mousePressed(() => {
    diceVisible = !diceVisible;
  });
  toggleDiceButton.hide(); // Initially hide the button

    // Create Next Button
  nextButton = createButton('Next');
  nextButton.size(buttonWidth, buttonHeight);
  nextButton.style('font-size', '16px');
  nextButton.style('background-color', '#008CBA');
  nextButton.style('color', 'white');
  nextButton.style('border', 'none');
  nextButton.style('border-radius', '5px');
  nextButton.position(width / 2 - buttonWidth / 2, height - 70); // Centered

  // Adjusted nextButton.mousePressed() function
  // This handler ensures that confirmMove() is only called during the 'confirmMove' phase
  nextButton.mousePressed(() => {
    if (gamePhase === 'confirmMove') {
      confirmMove(); // Directly call confirmMove
    } else if (gamePhase === 'battle' || gamePhase === 'battleEnd' || gamePhase === 'end') {
      if (gamePhase === 'end') {
        // Transition to game over screen
        gamePhase = 'gameover';
      } else {
        endTurn(); // Ensure this function is defined to handle end of turn
      }
    } else if (gamePhase === 'noMove') {
      // Proceed to end turn
      endTurn();
    }
  });

  
/**
 * Confirms the player's movement, applies trap effects, and progresses the game.
 */
function confirmMove() {
  console.log('confirmMove function called.'); // Debugging statement
  let currentPlayer = players[currentPlayerIndex];
  
  // Apply trap reductions based on recorded traps
  if (currentTrappedHexes.length > 0) {
    let trapsTriggered = currentTrappedHexes.length;
    for (let trapHex of currentTrappedHexes) {
      // Remove the trap from the hex
      trapHex.hasTrap = false;
      console.log(`Trap at (${trapHex.cubeX}, ${trapHex.cubeY}, ${trapHex.cubeZ}) removed.`);
    }
    // Reduce player's baseDice by the number of traps triggered
    for (let i = 0; i < trapsTriggered; i++) {
      currentPlayer.reduceBaseDice();
    }
    message += ` You triggered ${trapsTriggered} trap(s) and lost ${trapsTriggered} movement die(s).`;
  } else {
    message += ` Movement confirmed with no traps encountered.`;
  }
  
  // Move the player along the currentPath
  for (let i = 1; i < currentPath.length; i++) { // Start from 1 to skip the starting hex
    let hex = currentPath[i];
    movePlayerToHex(hex); // Function to update player's position
    console.log(`Player moved to (${hex.cubeX}, ${hex.cubeY}, ${hex.cubeZ}).`);
    
// Handle Teleporters with hasTeleportedThisMove flag
if (hex.type === 'teleporter' && !hasTeleportedThisMove) {
  let destination = (hex === teleportHex1) ? teleportHex2 : teleportHex1;
  movePlayerToHex(destination); // Teleport the player
  console.log(`Player teleported to (${destination.cubeX}, ${destination.cubeY}, ${destination.cubeZ}).`);
  message += ` Teleported to (${destination.cubeX}, ${destination.cubeY}, ${destination.cubeZ}).`;
  
  // Set the flag to prevent multiple teleportations in the same move
  hasTeleportedThisMove = true;
}
    
    // Collect treasures, horses, ships
    collectTreasure(hex);
    collectHorse(hex);
    collectShip(hex);
    
    // Check for enemies on the current hex
    let enemyOnHex = enemies.find(enemy => 
      enemy.alive &&
      enemy.gridX === hex.cubeX &&
      enemy.gridY === hex.cubeY &&
      enemy.gridZ === hex.cubeZ
    );
    
    if (enemyOnHex) {
      // Initiate battle immediately
      console.log(`Player encountered a enemy at (${hex.cubeX}, ${hex.cubeY}, ${hex.cubeZ}). Initiating battle.`);
      gamePhase = 'battle';
      selectionPhase = false;
      battlePlayer = currentPlayer; // Set the player involved in the battle
      
      // Determine the enemy's battle roll
      initiateBattle(currentPlayer, enemyOnHex);
      
      // Halt further movement
      break;
    }
  }
  
  // Clear highlighted hexes
  for (let hex of currentPath) {
    hex.highlighted = false;
  }
  currentPath = [];
  currentTrappedHexes = []; // Clear trapped hexes after confirmation
  
  // Handle post-move actions
  if (gamePhase === 'battle') {
    // Show Roll Dice button and hide Next button during battle setup
    rollButton.show();
    nextButton.hide();
  } else {
    // Proceed to end turn
    endTurn();
  }
  
  // Hide Next button and show Roll Dice button for next player
  nextButton.hide();
  rollButton.show();
}
  
  
  nextButton.hide(); // Initially hide the Next button

  // Initialize Game Variables
  gamePhase = 'intro'; // Start in intro phase

  // Create Intro Screen Buttons
  onePlayerButton = createButton('1 Player');
  onePlayerButton.size(100, 40);
  onePlayerButton.position(width / 2 - 160, height / 2);
  onePlayerButton.mousePressed(() => {
    numPlayers = 1;
    onePlayerButton.style('background-color', '#4CAF50');
    twoPlayersButton.style('background-color', '');
  });

  twoPlayersButton = createButton('2 Players');
  twoPlayersButton.size(100, 40);
  twoPlayersButton.position(width / 2 + 60, height / 2);
  twoPlayersButton.mousePressed(() => {
    numPlayers = 2;
    onePlayerButton.style('background-color', '');
    twoPlayersButton.style('background-color', '#4CAF50');
  });
  onePlayerButton.style('background-color', '#4CAF50'); // Default selection

  pathToggleButton = createButton('Path Drawing: Off');
  pathToggleButton.size(200, 40);
  pathToggleButton.position(width / 2 - 100, height / 2 + 60);
  pathToggleButton.mousePressed(() => {
    pathDrawing = !pathDrawing;
    pathToggleButton.html(`Path Drawing: ${pathDrawing ? 'On' : 'Off'}`);
  });
  
  exportToggleButton = createButton('Export Button: Off');
  exportToggleButton.size(200, 40);
  exportToggleButton.position(width / 2 - 100, height / 2 + 100);
  exportToggleButton.mousePressed(() => {
    exportShow = !exportShow;
    exportToggleButton.html(`Export: ${exportShow ? 'On' : 'Off'}`);
  });

  startGameButton = createButton('Start Game');
  startGameButton.size(200, 40);
  startGameButton.style('font-size', '16px');
  startGameButton.style('background-color', '#4CAF50');
  startGameButton.style('color', 'white');
  startGameButton.position(width / 2 - 100, height / 2 + 220);
  startGameButton.mousePressed(() => {
    
  seedInput.hide();
  generateSeedButton.hide(); 

    
    if (seedInput.value() !== '') {
      seed = parseInt(seedInput.value());
      if (isNaN(seed)) {
        alert('Please enter a valid numerical seed.');
        return;
      }
      initializeGameWithSeed(seed);
    } else {
      // If no seed is provided, generate one
      seed = floor(random(1, 1000000));
      initializeGameWithSeed(seed);
    }
    gamePhase = 'roll';
    hideIntroButtons();
    rollButton.show();
    
    if (exportShow){
      exportButton.show(); // Show Export Button
    } else {
      exportButton.hide(); // hide Export Button
    }
    loop(); // Start the draw loop
  });

  // Create Restart Button
  restartButton = createButton('Restart');
  restartButton.size(200, 40);
  restartButton.position(width / 2 - 100, height / 2 + 60);
  restartButton.mousePressed(() => {
    
    gamePhase = 'intro';
  seedInput.show();
  generateSeedButton.show(); 

    
    showIntroButtons();
    restartButton.hide();
    nextButton.hide(); // Hide Next button when restarting
    loop(); // Restart the draw loop
  });
  restartButton.hide(); // Initially hide

  // Create Export SVG Button
  exportButton = createButton('Export SVG');
  exportButton.size(120, 40);
  exportButton.style('font-size', '16px');
  exportButton.style('background-color', '#FF9800');
  exportButton.style('color', 'white');
  exportButton.style('border', 'none');
  exportButton.style('border-radius', '5px');
  exportButton.position(0, height - 70); // Positioned near Roll Button
  exportButton.mousePressed(() => {
    exportSVG();
  });
  exportButton.hide(); // Initially hide

  // Hide game buttons initially
  rollButton.hide();
  nextButton.hide();
  exportButton.hide();
  restartButton.hide();
  noLoop(); // Stop the draw loop until the game starts
}



function proceedToNextPlayerOrenemy() {
  // Check if all alive players have moved
  if (players.filter(player => player.alive).every(player => player.hasMoved)) {
    // All players have moved; reset hasMoved flags
    for (let player of players) {
      player.hasMoved = false;
      hasTeleportedThisMove = false;
    }

    // Move enemies
    moveenemies();
    enemiesHaveMoved = true;

    // Check for battles after enemies have moved
    checkForBattles();

    // Handle battle phase if a battle was initiated
    if (gamePhase !== 'battle') {
      // No battle, proceed to the next round
      gamePhase = 'roll';
      currentPlayerIndex = players.findIndex(player => player.alive);
      enemiesHaveMoved = false; // Reset for the next round
    } else {
      // Battle initiated during enemies' turn
      // Wait for player to resolve the battle
    }
  } else {
    // Proceed to the next alive player
    do {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    } while (!players[currentPlayerIndex].alive);
    gamePhase = 'roll';
  }
}



/**
 * Initializes the game with a specific seed.
 * @param {number} seedValue - The seed to initialize randomness.
 */
function initializeGameWithSeed(seedValue) {
  // Set the seed for both random and noise functions
  randomSeed(seedValue);
  noiseSeed(seedValue);

  // Initialize Game Variables
  gamePhase = 'roll'; // Start in roll phase
  calculateGridDimensions();
  populateHexGrid();
  placeTreasures();
  placeCastles();
  placeenemies();
  placeShips();
  placeHorses();
  placeTeleporters();
  placeTraps();
  initializePlayers();
  currentPlayerIndex = 0; // Reset player index
  diceRolls = Array(players.length > 0 ? players[0].getCurrentDiceCount() : NUM_DICE).fill(0); // Reset dice based on first player's dice count
  message = ''; // Clear any previous messages
  selectionPhase = false;
  currentPath = [];
  enemyBattleRoll = 0;
  playerBattleRoll = 0;
  
    for (let player of players) {
    player.hasMoved = false;
    enemiesHaveMoved = false;
  }
  
}


/**
 * Resizes the canvas and repositions buttons when the window is resized.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight * 0.9);

  let buttonWidth = 100;
  let buttonHeight = 40;

  // Reposition Roll Button
  rollButton.position(width / 2 - buttonWidth / 2, height - 70);

  // Reposition Next Button
  nextButton.position(width / 2 - buttonWidth / 2, height - 70);

  // Reposition Intro Screen Buttons
  onePlayerButton.position(width / 2 - 160, height / 2);
  twoPlayersButton.position(width / 2 + 60, height / 2);
  pathToggleButton.position(width / 2 - 100, height / 2 + 60);
  exportToggleButton.position(width / 2 - 100, height / 2 + 100); 
  generateSeedButton.position(width / 2-60, height / 2 + 175);
  seedInput.position(width / 2 - 100, height / 2 + 140);
  startGameButton.position(width / 2 - 100, height / 2 + 220);
  toggleDiceButton.position(width - 100, height - 70);

  // Reposition Restart Button
  restartButton.position(width / 2 - 100, height / 2 + 60);

  // Reposition Export Button
  exportButton.position(0, height - 70);
}

/**
 * Hides the intro screen buttons.
 */
function hideIntroButtons() {
  onePlayerButton.hide();
  twoPlayersButton.hide();
  pathToggleButton.hide();
  exportToggleButton.hide();
  startGameButton.hide();
}

/**
 * Shows the intro screen buttons.
 */
function showIntroButtons() {
  onePlayerButton.show();
  twoPlayersButton.show();
  pathToggleButton.show();
  exportToggleButton.show();
  startGameButton.show();
}

function draw() {
  
  if (gamePhase === 'intro') {
    background(220);
    
    fill(0);
    textAlign(CENTER, CENTER);
    image(svgKnight, width/2-30, height/2-290, 60, 60);
    textFont(font);
    textSize(60);
    text('HexQuest', width / 2, height / 2 - 200);
    textFont('Verdana');
    textSize(13.5);

    text('Embark on a quest to protect the kingdom by collecting treasures so that you can defeat footmen, archers and the formidable dragons. Each turn, players choose a six-sided die for their direction followed by distance of movement. Use horses, boats and portals to travel and seek refuge in mountains and castles. Engage in battles near castles to press your advantage.', width / 2 - 200, height / 2 - 140, 400);

    // Buttons are already displayed
    // Hide other elements
    rollButton.hide();
    nextButton.hide();
    exportButton.hide();
    restartButton.hide();
    return;
  }

  if (gamePhase === 'gameover') {  
    textSize(32);  
    textAlign(CENTER, CENTER);
    if (gameResult === 'victory') {
      background(255);
      fill(0);
      text('Victory!', width / 2, height / 2);
    } else if (gameResult === 'defeat') {
      background(0);
      fill(255);
      text('Defeat!', width / 2, height / 2);
    }
    restartButton.show(); // Show Restart button

    // Hide Next button on game over screen
    nextButton.hide();

    return;
  }

  background(220);
  displayHexGrid();
  displayShips();
  displayHorses();
  if (pathDrawing) {
    displayPlayerPaths(); // Display past moves as lines if path drawing is on
  }
  displayPlayers();
  displayTreasures();
  displayenemies();
  displayDirectionNumbers(); // Display direction numbers around current player
  displayDiceRoll();
  displayMessage();
  displayFightHighlights();

    // Control the visibility of the Toggle Dice Button
  if ((gamePhase === 'select' && selectionPhase) || gamePhase === 'confirmMove') {
    toggleDiceButton.show();
  } else {
    toggleDiceButton.hide();
  }
  
  // Display Dice if in 'select', 'confirmMove', 'battle', or 'end' phases
  if (
    (gamePhase === 'select' && selectionPhase) ||
    gamePhase === 'confirmMove' ||
    gamePhase === 'end' ||
    gamePhase === 'battleEnd' ||
    (gamePhase === 'battle' && (playerBattleRoll > 0 || enemyBattleRoll > 0))
  ) {
    displayDice();
  }
  

}

/**
 * Draw Red Ellipses Around Battling Player and enemy
 */
function displayFightHighlights(){
  if (gamePhase === 'battle' || gamePhase === 'battleEnd') {
    if (battlePlayer && battlePlayer.alive) {
      noFill();
      stroke(255, 0, 0); // Red color
      strokeWeight(4);
      ellipse(battlePlayer.x, battlePlayer.y, HEX_SIZE * 1.5, HEX_SIZE * 1.5); // Slightly larger than player
    }

    if (battleenemy && battleenemy.alive) {
      noFill();
      stroke(255, 0, 0); // Red color
      strokeWeight(4);
      ellipse(battleenemy.x, battleenemy.y, HEX_SIZE * 1.5, HEX_SIZE * 1.5); // Slightly larger than enemy
    }
  }
}



/**
 * Moves all enemies towards players.
 */
function moveenemies() {
  for (let enemy of enemies) {
    enemy.moveTowards(players, enemies);
  }
}

/**
 * Ends the current player's turn and progresses the game state.
 */
function endTurn() {
  // Reset highlighted hexes
  for (let hex of hexGrid) {
    hex.highlighted = false;
  }

  // Check if all players are defeated
  if (players.every(player => !player.alive)) {
    gamePhase = 'end';
    gameResult = 'defeat';
    nextButton.show(); // Show Next button to proceed to game over
    return;
  }

  // Mark that current player has finished their turn
  players[currentPlayerIndex].hasMoved = true;

  // Check if all alive players have moved
  if (players.filter(player => player.alive).every(player => player.hasMoved)) {


    // All players have moved; reset hasMoved flags
    for (let player of players) {
      player.hasMoved = false;
    }

    // Move enemies
    moveenemies();

    // Check for battles after enemies have moved
    checkForBattles();

    // Handle battle phase if a battle was initiated
    if (gamePhase !== 'battle') {
      // No battle, proceed to the next round

        for (let e of enemies) {
      e.hasAttackedThisTurn = false;
    }

      gamePhase = 'roll';
      // Reset currentPlayerIndex to the first alive player
      currentPlayerIndex = players.findIndex(player => player.alive);
    } else {
      // Battle initiated, wait for player to roll battle dice
      // The gamePhase will remain 'battle' until resolved
    }
  } else {
    // Proceed to the next alive player
    do {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    } while (!players[currentPlayerIndex].alive);
    gamePhase = 'roll';
  }

  diceRolls = [];
  selectedDiceIndices = [];
  message = '';
  enemyDefeated = false;
  playerDefeated = false;

  nextButton.hide();
  rollButton.show();
}





/**
 * Rolls the dice for the current player.
 */
function rollDice() {
  if (gamePhase === 'roll') {
    let currentPlayer = players[currentPlayerIndex];
    let diceCount = currentPlayer.getCurrentDiceCount();
    diceRolls = Array(diceCount).fill(0);
    for (let i = 0; i < diceCount; i++) {
      diceRolls[i] = floor(random(1, 7)); // Roll each die (1-6)
    }
    console.log(`Player ${currentPlayer.index + 1} rolled: ${diceRolls.join(', ')}`);
    gamePhase = 'select'; // Change phase to selection
    selectionPhase = true;
    rollButton.hide(); // Hide Roll Dice button after rolling
  }
}

/**
 * Rolls the battle dice for the player during a battle.
 */
function rollBattleDice() {
  if (gamePhase === 'battle' && playerBattleRoll === 0) {
    playerBattleRoll = floor(random(1, 7)); // Player's roll plus treasures
    console.log(`Player ${battlePlayer.index + 1} rolled for battle: ${playerBattleRoll}`);
    determineBattleOutcome();
  }
}

/**
 * Handles the selection of dice for direction and distance.
 * @param {number} dieIndex - Index of the selected die.
 */
function selectDice(dieIndex) {
  if (gamePhase === 'select' && selectionPhase) {
        let currentPlayer = players[currentPlayerIndex];
    let diceCount = currentPlayer.getCurrentDiceCount();

    if (dieIndex >= diceCount) return; // Ignore clicks beyond available dice
    
    // If die is already selected, deselect it
    if (selectedDiceIndices.includes(dieIndex)) {
      //selectedDiceIndices = selectedDiceIndices.filter(index => index !== dieIndex);
      //console.log(`Die ${dieIndex + 1} deselected banana.`);
    } else {
      // Prevent selecting more than 2 dice
      if (selectedDiceIndices.length >= 2) {
        return;
      }
      selectedDiceIndices.push(dieIndex);
      console.log(`Die ${dieIndex + 1} selected.`);
    }

    // If two dice are selected, assign direction and distance
    if (selectedDiceIndices.length === 2) {
      let directionDieValue = diceRolls[selectedDiceIndices[0]];
      let distanceDieValue = diceRolls[selectedDiceIndices[1]];
      console.log(`Direction Die (Die ${selectedDiceIndices[0] + 1}) = ${directionDieValue}`);
      console.log(`Distance Die (Die ${selectedDiceIndices[1] + 1}) = ${distanceDieValue}`);

      proceedWithMovement(directionDieValue, distanceDieValue);
    }
  }
}

/**
 * Handles the selection of dice for direction and distance.
 * @param {number} directionValue - The value rolled for direction.
 * @param {number} distanceValue - The value rolled for distance.
 */
function proceedWithMovement(directionValue, distanceValue) {
  // Reset the message and path
  message = '';
  currentPath = [];
  currentTrappedHexes = []; // Reset trapped hexes for the new movement
  
  console.log(`Player ${players[currentPlayerIndex].index + 1} attempting to move up to ${distanceValue} step(s) towards direction ${directionValue} (${getDirectionName(directionValue)}).`);
  
  let currentPlayer = players[currentPlayerIndex];
  let playerHex = getHexAt(currentPlayer.gridX, currentPlayer.gridY, currentPlayer.gridZ);
  
  if (playerHex && currentPlayer.alive) {
    // Determine direction based on directionValue
    let directionIndex = (directionValue - 1) % CUBE_DIRECTIONS.length;
    let chosenDirection = CUBE_DIRECTIONS[directionIndex];
    console.log(`Chosen Direction Vector: (${chosenDirection.x}, ${chosenDirection.y}, ${chosenDirection.z})`);
    
    // Initialize targetHex as player's current position
    let targetHex = playerHex;
    let stepsTaken = 0;
    let remainingSteps = distanceValue; // Initialize remaining movement steps
    
    // Initialize currentPath
    currentPath.push(playerHex); // Add starting hex to path
    
    // Iterate step-by-step in the chosen direction
    for (let step = 1; step <= distanceValue; step++) {
      let intermediateCoords = {
        x: targetHex.cubeX + chosenDirection.x,
        y: targetHex.cubeY + chosenDirection.y,
        z: targetHex.cubeZ + chosenDirection.z
      };
      let intermediateHex = getHexAt(intermediateCoords.x, intermediateCoords.y, intermediateCoords.z);
      
      if (!intermediateHex) {
        console.log(`Step ${step}: Hex is out of bounds.`);
        message += ` Cannot move off the map.`;
        break; // Cannot move further
      }
      
      if (!isHexFullyVisible(intermediateHex)) {
        console.log(`Step ${step}: Hex is partially visible or off-screen.`);
        message += ` Cannot move off the map.`;
        break; // Cannot move further
      }
      
      if (!isTraversable(intermediateHex, currentPlayer)) {
        console.log(`Step ${step}: Hex is not traversable (${intermediateHex.type}).`);
        message += ` Encountered impassable terrain.`;
        break; // Cannot move further
      }
      
      // Check if the hex is occupied by a enemy
      let enemyOnHex = enemies.find(enemy => 
        enemy.alive &&
        enemy.gridX === intermediateHex.cubeX &&
        enemy.gridY === intermediateHex.cubeY &&
        enemy.gridZ === intermediateHex.cubeZ
      );
      
      if (enemyOnHex) {
        console.log(`Step ${step}: Encountered enemy at (${intermediateHex.cubeX}, ${intermediateHex.cubeY}, ${intermediateHex.cubeZ}). Including in path.`);
        message += ` Encountered a enemy. Initiating battle.`;
        targetHex = intermediateHex;
        stepsTaken++;
        currentPath.push(targetHex); // Include enemy's hex in the path
        break; // Stop movement after including the enemy's hex
      }
      
      // Check for Teleportation
      if (intermediateHex.type === 'teleporter') {
        console.log(`Step ${step}: Passed over a teleporter at (${intermediateHex.cubeX}, ${intermediateHex.cubeY}, ${intermediateHex.cubeZ}).`);
        message += ` Teleporting...`;
        let destination = (intermediateHex === teleportHex1) ? teleportHex2 : teleportHex1;
        targetHex = intermediateHex; // The teleporter's hex
        stepsTaken++;
        currentPath.push(targetHex); // Add teleporter hex to path
        currentPath.push(destination); // Add destination to path
        console.log(`Teleportation destination added to path: (${destination.cubeX}, ${destination.cubeY}, ${destination.cubeZ})`);
        break; // Stop further movement
      }
      
      // Move to the next hex
      targetHex = intermediateHex;
      stepsTaken++;
      currentPath.push(targetHex);
      
      // **Check for Traps on the Current Hex**
      if (targetHex.hasTrap) {
        console.log(`Step ${step}: Detected a trap at (${targetHex.cubeX}, ${targetHex.cubeY}, ${targetHex.cubeZ}).`);
        message += ` Detected a trap on your path. One die will be removed.`;
        currentTrappedHexes.push(targetHex); // Record the trap without applying any effects
        // Do not remove the trap or reduce dice here
      }
      
      // **Check if the current hex is a swamp**
      if (targetHex.type === 'swamp') {
        console.log(`Step ${step}: Entering a swamp at (${targetHex.cubeX}, ${targetHex.cubeY}, ${targetHex.cubeZ}). Movement stops.`);
        message += `Entering a swamp. Movement stops.`;
        break; // Stop movement
      }
      
    }
    
    if (stepsTaken > 0) {
      console.log(`Current Path: ${currentPath.map(hex => `(${hex.cubeX},${hex.cubeY},${hex.cubeZ})`).join(' -> ')}`);
      
      // Highlight the path
      for (let hex of currentPath) {
        hex.highlighted = true;
      }
      
      // Change gamePhase to 'confirmMove'
      gamePhase = 'confirmMove';
      
      // Show Next button and hide Roll Dice button
      nextButton.show();
      rollButton.hide();
    } else {
      // If no movement is possible, stay in the same hex
      console.log(`No valid movement. Player ${currentPlayer.index + 1} stays in the same hex.`);
      message += ` Player ${currentPlayer.index + 1} can't move there.`;
      gamePhase = 'confirmMove';
      nextButton.show();
    }
  }
}

/**
 * Collects a treasure if present on the given hex.
 * @param {Hexagon} hex - The hexagon where the player is.
 */
function collectTreasure(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let treasure of treasures) {
    if (!treasure.collected &&
        treasure.hex.cubeX === hex.cubeX &&
        treasure.hex.cubeY === hex.cubeY &&
        treasure.hex.cubeZ === hex.cubeZ) {
      treasure.collected = true;
      currentPlayer.treasures += 1;
      console.log(`Player ${currentPlayer.index + 1} collected a treasure!`);
      message += ` Player ${currentPlayer.index + 1} collected a treasure!`;
    }
  }
}

/**
 * Collects a horse if present on the given hex.
 * @param {Hexagon} hex - The hexagon where the player is.
 */
function collectHorse(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let horse of horses) {
    if (horse.carriedBy === null &&
        horse.gridX === hex.cubeX &&
        horse.gridY === hex.cubeY &&
        horse.gridZ === hex.cubeZ) {
      horse.carriedBy = currentPlayer.index;
      currentPlayer.extraDice += 1; // Increase player's dice
      console.log(`Player ${currentPlayer.index + 1} collected a horse!`);
      message += ` Player ${currentPlayer.index + 1} collected a horse! Extra die added.`;
      break; // Only collect one horse per hex
    }
  }
}

/**
 * Collects a ship if present on the given hex.
 * @param {Hexagon} hex - The hexagon where the player is.
 */
function collectShip(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let ship of ships) {
    if (ship.carriedBy === null &&
        ship.gridX === hex.cubeX &&
        ship.gridY === hex.cubeY &&
        ship.gridZ === hex.cubeZ) {
      ship.carriedBy = currentPlayer.index;
      currentPlayer.hasShip = true;
      console.log(`Player ${currentPlayer.index + 1} picked up a ship.`);
      message += ` Player ${currentPlayer.index + 1} picked up a ship.`;
    }
  }
}


/**
 * Checks for battles between players and enemies, including archers within range.
 */
function checkForBattles() {
  for (let player of players) {
    if (!player.alive) continue; // Skip dead players

    for (let enemy of enemies) {
      if (!enemy.alive) continue; // Skip dead enemies

      if (enemy.hasAttackedThisTurn) continue;

      let distance = cubeDistance(player, enemy);

      if (enemy.attackRange && distance <= enemy.attackRange) {
        // Enemies with an attack range can attack if within range
        console.log(`Triggered ranged battle between Player ${player.index + 1} and ${enemy.constructor.name} at (${enemy.gridX}, ${enemy.gridY}, ${enemy.gridZ})`);
        gamePhase = 'battle';
        selectionPhase = false;
        initiateBattle(player, enemy);
        enemy.hasAttackedThisTurn = true; // mark that this enemy has attacked
        return; // Handle one battle at a time
      } else if (!enemy.attackRange && distance === 0) {
        // Enemies without attack range attack if on the same hex
        console.log(`Triggered melee battle between Player ${player.index + 1} and enemy at (${enemy.gridX}, ${enemy.gridY}, ${enemy.gridZ})`);
        gamePhase = 'battle';
        selectionPhase = false;
        initiateBattle(player, enemy);
        return; // Handle one battle at a time
      }
    }
  }
}


/**
 * Initiates a battle between a player and a enemy.
 * @param {Player} player - The player involved in the battle.
 * @param {enemy} enemy - The enemy involved in the battle.
 */
function initiateBattle(player, enemy) {
  battlePlayer = player; // Set the battling player
  battleenemy = enemy; // Set the battling enemy

  // Reset battle outcome flags
  enemyDefeated = false;
  playerDefeated = false;

  // Determine the enemy's battle roll
  if (typeof enemy.getBattleRoll === 'function') {
    // If the enemy has a custom battle roll method (e.g., Archer)
    enemyBattleRoll = enemy.getBattleRoll();
  } else if (enemy instanceof DragonEnemy) {
    enemyBattleRoll = floor(random(1, 7)) + floor(random(1, 7)); // 2-12 for Dragon
  } else {
    enemyBattleRoll = floor(random(1, 7)); // 1-6 for regular enemies
  }

  playerBattleRoll = 0; // Reset player's battle roll
  console.log(`enemy rolled: ${enemyBattleRoll}`);
  message = `Battle initiated! enemy rolled a ${enemyBattleRoll}. Click 'Roll Dice' to roll your die.`;

  // Show Roll Dice button and hide Next button during battle setup
  rollButton.show();
  nextButton.hide();
}
/**
 * Determines the outcome of a battle after the player has rolled.
 */
function determineBattleOutcome() {
  let player = battlePlayer; // Use the player involved in the battle

  // Reset bonus
  bonus = 0;

  // Before comparing rolls, check for castle vicinity bonus
  let battleHex = getHexAt(player.gridX, player.gridY, player.gridZ);
  if (battleHex && battleHex.castleVicinity || (battleHex.type == 'castle')) {
    bonus = 2;
    message += ` You gain a +${bonus} bonus for fighting near a castle!`;
  }

  totalPlayerRoll = playerBattleRoll + battlePlayer.treasures + bonus;

  // Compare rolls
  if (totalPlayerRoll > enemyBattleRoll) {
    // Player wins, enemy dies

   message = ` Player ${player.index + 1} defended successfully`;
    // Find the enemy at player's location
    let enemy = enemies.find(
      m =>
        m.gridX === player.gridX &&
        m.gridY === player.gridY &&
        m.gridZ === player.gridZ
    );
    if (enemy) {
      enemy.alive = false;
      enemyDefeated = true; // enemy was defeated
      enemies = enemies.filter(m => m !== enemy);

      // Player gains a treasure for defeating the enemy
      player.treasures += 1;
      message = ` Player ${player.index + 1} gains a treasure for defeating the enemies!`;
    }

    // Check if all enemies are defeated
    if (enemies.length === 0) {
      message = ` All enemies have been defeated! Victory!`;
      gamePhase = 'end';
      gameResult = 'victory';
      nextButton.show(); // Show Next button to proceed to game over
    } else {
      // Show Next button after battle outcome is determined
      nextButton.show();
      // Change game phase to indicate battle has ended
      gamePhase = 'battleEnd';
    }
  } else {
    // enemy wins, Player dies (including tie)
    console.log(`enemy wins the battle. Player ${player.index + 1} is defeated.`);
    message = ` Player ${player.index + 1} was defeated by a enemy!`;
    player.alive = false;
    playerDefeated = true; // Player was defeated

    // Check if all players are defeated
    if (players.every(player => !player.alive)) {
      message = ` All players have been defeated. Game Over!`;
      gamePhase = 'end';
      gameResult = 'defeat';
      nextButton.show(); // Show Next button to proceed to game over
    } else {
      // Show Next button after battle outcome is determined
      nextButton.show();
      // Change game phase to indicate battle has ended
      gamePhase = 'battleEnd';
      battlePlayer = null;
      battleenemy = null;
    }
  }

  // Hide Roll Dice button to prevent further rolls until Next is pressed
  rollButton.hide();
  

}
/**
 * Moves the current player to the specified hex.
 * @param {Hexagon} hex - The target hex to move the player to.
 */
/**
 * Moves the current player to the specified hex.
 * @param {Hexagon} hex - The target hex to move the player to.
 */
/**
 * Moves the current player to the specified hex.
 * @param {Hexagon} hex - The target hex to move the player to.
 */
function movePlayerToHex(hex) {
  let player = players[currentPlayerIndex];

  // Update player's position
  player.x = hex.x;
  player.y = hex.y;
  player.gridX = hex.cubeX;
  player.gridY = hex.cubeY;
  player.gridZ = hex.cubeZ;

  // Add to player's history
  player.history.push({ x: hex.x, y: hex.y });

  // If the player has a ship, move the ship with the player
  if (player.hasShip) {
    let ship = ships.find(s => s.carriedBy === player.index);
    if (ship) {
      ship.gridX = hex.cubeX;
      ship.gridY = hex.cubeY;
      ship.gridZ = hex.cubeZ;
      ship.x = hex.x;
      ship.y = hex.y;
      console.log(`Ship carried by Player ${player.index + 1} moved to (${ship.gridX}, ${ship.gridY}, ${ship.gridZ}).`);
    }
  }

  // **Remove Teleporter Highlighting After Teleportation**
  if (hex.type === 'teleporter') {
    hex.highlighted = false; // Remove highlight
  }
}
