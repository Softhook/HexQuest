// Game Parameters
const HEX_SIZE = 25; // Set size
const NUM_DICE = 4; // Default can increase with horses
const numberSpearman = 0;
const numberArchers = 10;
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
let hasTeleportedThisMove = false;
let currentPlayerIndex = 0;
let diceRolls = [];
let gamePhase = 'intro'; 
let gameResult = ''; 
let message = ''; 
let font;

// Variables for Dice Selection
let selectedDiceIndices = []; 
let selectionPhase = false;
let toggleDiceButton; 
let diceVisible = true; 

// Variables for Battle Phase
let enemyBattleRoll = 0;
let playerBattleRoll = 0;
let bonus = 0;
let battlePlayer = null; 
let battleenemy = null;
let totalPlayerRoll;
let enemyDefeated = false;
let playerDefeated = false;
let enemiesHaveMoved = false;

// Global Variables for Buttons
let rollButton;
let nextButton;
let onePlayerButton, twoPlayersButton, pathToggleButton, exportToggleButton, startGameButton;
let restartButton; 
let exportButton;
let exportShow = false;

// Movement
let currentPath = [];
let pathDrawing = false;

// Multi‐battle queue
let pendingBattles = []; // Stores all battles for a round

/**
 * Checks if a point is inside a hexagon.
 */
function isPointInHex(px, py, size) {
  let x = abs(px);
  let y = abs(py);
  let h = sqrt(3) * size / 2;
  if (x > 1.5 * size || y > h) return false;
  if (y <= h - (h / 1.5) * x / size) return true;
  return false;
}

/**
 * Calculate the pixel position of a hex from axial coords.
 */
function calculateHexPosition(q, r) {
  let x = q * HEX_SIZE * 1.5 + width / 2;
  let y = r * HEX_SIZE * sqrt(3) + (q % 2 !== 0 ? HEX_SIZE * sqrt(3) / 2 : 0) + height / 2;
  return { x, y };
}

/**
 * Convert axial coords to cube coords.
 */
function calculateCubeCoordinates(q, r) {
  let cubeX = q;
  let cubeZ = r - Math.floor(q / 2);
  let cubeY = -cubeX - cubeZ;
  return { cubeX, cubeY, cubeZ };
}

/**
 * Cube distance.
 */
function cubeDistance(a, b) {
  if (!a || !b || a.gridX === undefined || a.gridY === undefined || a.gridZ === undefined ||
      b.gridX === undefined || b.gridY === undefined || b.gridZ === undefined) {
    console.error("cubeDistance function received undefined properties.");
    return Infinity;
  }
  return Math.max(
    abs(a.gridX - b.gridX),
    abs(a.gridY - b.gridY),
    abs(a.gridZ - b.gridZ)
  );
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

function getDirectionName(directionNumber) {
  switch (directionNumber) {
    case 1: return 'N';
    case 2: return 'NE';
    case 3: return 'SE';
    case 4: return 'S';
    case 5: return 'SW';
    case 6: return 'NW';
    default: return '';
  }
}

function isTraversable(hex, player) {
  if (hex.type === 'water') {
    return player.hasShip || ships.some(ship =>
      ship.gridX === hex.cubeX &&
      ship.gridY === hex.cubeY &&
      ship.gridZ === hex.cubeZ &&
      ship.carriedBy === null
    );
  }
  return true;
}

// ---- Classes ----

class Horse {
  constructor(hex) {
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
    this.carriedBy = null;
  }

  display(pg = window) {
    let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
    if (hex && this.carriedBy === null) {
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
    this.castleVicinity = false;
    this.bushes = [];
    this.trees = [];
    this.reeds = [];
    this.mountains = [];
    this.hasTrap = false;

    if (this.type === 'grass') this.generateBushes();
    if (this.type === 'forest') this.generateTrees();
    if (this.type === 'mountain') this.generateMountains();
    if (this.type === 'swamp') this.generateReeds();
  }

  generateBushes() {
    let bushCount = floor(random(5, 8));
    for (let i = 0; i < bushCount; i++) {
      let angle = random(TWO_PI);
      let distance = random(this.size * 0.2, this.size * 0.7);
      let px = cos(angle) * distance;
      let py = sin(angle) * distance;
      if (!isPointInHex(px, py, this.size)) continue;
      let bushWidth = random(3, 8);
      let bushHeight = bushWidth * 0.6;
      this.bushes.push({ x: px, y: py, width: bushWidth, height: bushHeight });
    }
  }

  generateMountains() {
    const mountainLayers = floor(random(2, 3));
    for (let i = 0; i < mountainLayers; i++) {
      let angle = random(TWO_PI);
      let distance = random(this.size * 0.1, this.size * 0.6);
      let px = cos(angle) * distance;
      let py = sin(angle) * distance;
      if (!isPointInHex(px, py, this.size)) continue;
      let baseWidth = random(this.size, this.size);
      let height = random(this.size * 0.5, this.size * 2);
      this.mountains.push({
        x: px,
        y: py,
        baseWidth: baseWidth,
        height: height,
      });
    }
  }

  generateReeds() {
    let reedCount = floor(random(6, 15));
    for (let i = 0; i < reedCount; i++) {
      let angle = random(TWO_PI);
      let distance = random(this.size * 0.1, this.size * 0.7);
      let px = cos(angle) * distance;
      let py = sin(angle) * distance;
      if (!isPointInHex(px, py, this.size)) continue;
      let reedAngle = random(-PI / 6, PI / 6) + PI / 2;
      let reedLength = this.size * 0.4;
      this.reeds.push({
        x: px,
        y: py,
        angle: reedAngle,
        length: reedLength
      });
    }
  }

  generateTrees() {
    let treeCount = floor(random(1, 3));
    for (let i = 0; i < treeCount; i++) {
      let angle = random(TWO_PI);
      let distance = random(this.size * 0.1, this.size * 0.6);
      let px = cos(angle) * distance;
      let py = sin(angle) * distance;
      if (!isPointInHex(px, py, this.size)) continue;
      let treeType = random(['pine', 'oak']);
      this.trees.push({ x: px, y: py, type: treeType });
    }
  }

  display(pg = window) {
    pg.push();
    pg.translate(this.x, this.y);
    pg.fill(this.getTerrainColour());
    pg.stroke(0);
    pg.strokeWeight(1);

    // Draw the hex
    pg.beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = TWO_PI / 6 * i;
      pg.vertex(this.size * cos(angle), this.size * sin(angle));
    }
    pg.endShape(CLOSE);

    if (this.type === 'castle') {
      this.drawCastle(pg);
    }
    if (this.castleVicinity && this.type !== 'castle') {
      this.drawCastleVicinityStripes(pg);
    }
    if (this.type === 'grass') this.drawBushes(pg);
    if (this.type === 'forest') this.drawTreesOutlines(pg);
    if (this.type === 'swamp') this.drawReedBushes(pg);
    if (this.type === 'mountain') this.drawMountains(pg);
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
    if (this.hasTrap) {
      this.drawTrap(pg);
    }
    if (this.highlighted) {
      pg.fill(255, 255, 0, 100);
      pg.noStroke();
      pg.beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = TWO_PI / 6 * i;
        pg.vertex(this.size * cos(angle), this.size * sin(angle));
      }
      pg.endShape(CLOSE);
    }
    pg.pop();
  }

  getTerrainColour() {
    switch (this.type) {
      case 'mountain': return color(139, 69, 19);
      case 'grass': return color(124, 200, 0);
      case 'forest': return color(34, 139, 34);
      case 'beach': return color(238, 214, 175);
      case 'castle': return color(200, 200, 200);
      case 'swamp': return color(50, 107, 47);
      case 'water': return color(70, 130, 180);
      case 'teleporter':
      default:
        return color(255, 60, 180);
    }
  }

  drawCastle(pg) {
    pg.fill(150);
    pg.stroke(0);
    pg.strokeWeight(1);
    let towerWidth = this.size / 3;
    let towerHeight = this.size / 2;
    pg.rectMode(CENTER);
    pg.rect(0, -this.size / 4, this.size, towerHeight);
    pg.rect(-this.size / 2 + towerWidth / 2, -this.size / 2, towerWidth, towerHeight);
    pg.rect(this.size / 2 - towerWidth / 2, -this.size / 2, towerWidth, towerHeight);
    let battlementSize = towerWidth / 2;
    pg.rect(-this.size / 2 + battlementSize / 2, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
    pg.rect(0, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
    pg.rect(this.size / 2 - battlementSize / 2, -this.size / 2 - towerHeight / 2, battlementSize, battlementSize);
  }

  drawCastleVicinityStripes(pg) {
    pg.push();
    let hexVertices = [];
    for (let i = 0; i < 6; i++) {
      let angle = TWO_PI / 6 * i - PI / 6;
      let x_i = this.size * cos(angle);
      let y_i = this.size * sin(angle);
      hexVertices.push(createVector(x_i, y_i));
    }
    let minY = min(hexVertices.map(v => v.y));
    let maxY = max(hexVertices.map(v => v.y));
    pg.stroke(255, 128, 128);
    pg.strokeWeight(1);
    let stripeSpacing = 8;
    for (let y = minY - this.size; y <= maxY + this.size; y += stripeSpacing) {
      let intersections = [];
      for (let i = 0; i < 6; i++) {
        let a1 = hexVertices[i];
        let a2 = hexVertices[(i + 1) % 6];
        let c = y;
        let denom = (a2.x - a1.x) + (a2.y - a1.y);
        if (denom === 0) continue;
        let t = ((c - a1.x - a1.y) / denom);
        if (t >= 0 && t <= 1) {
          let intersectX = a1.x + t * (a2.x - a1.x);
          let intersectY = a1.y + t * (a2.y - a1.y);
          intersections.push(createVector(intersectX, intersectY));
        }
      }
      intersections.sort((p1, p2) => p1.x - p2.x);
      for (let i = 0; i < intersections.length - 1; i += 2) {
        let p1 = intersections[i];
        let p2 = intersections[i + 1];
        pg.line(p1.x, p1.y, p2.x, p2.y);
      }
    }
    pg.pop();
  }

  drawTrap(pg) {
    pg.push();
    pg.fill(255, 0, 0);
    pg.noStroke();
    let spikeHeight = this.size * 0.5;
    let spikeWidth = this.size * 0.2;
    let spikeCount = 6;
    for (let i = 0; i < spikeCount; i++) {
      let angle = TWO_PI / spikeCount * i - PI / 2;
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

  drawMountains(pg) {
    pg.push();
    this.mountains.sort((a, b) => b.baseWidth - a.baseWidth);
    pg.stroke(0);
    pg.fill(139, 69, 19);
    for (let mountain of this.mountains) {
      pg.push();
      pg.translate(mountain.x, mountain.y);
      pg.beginShape();
      pg.vertex(-mountain.baseWidth / 2, 0);
      pg.vertex(mountain.baseWidth / 2, 0);
      pg.vertex(0, -mountain.height);
      pg.endShape(CLOSE);
      pg.pop();
    }
    pg.pop();
  }

  drawReedBushes(pg) {
    pg.push();
    pg.stroke(0, 150);
    pg.strokeWeight(1);
    for (let reed of this.reeds) {
      let { x, y, angle, length } = reed;
      let endX = x + length * cos(angle);
      let endY = y + length * sin(angle);
      pg.line(x, y, endX, endY);
    }
    pg.pop();
  }

  drawBushes(pg) {
    pg.noFill();
    pg.stroke(0, 100);
    pg.strokeWeight(1);
    pg.fill(124, 200, 0);
    for (let bush of this.bushes) {
      pg.ellipse(bush.x, bush.y, bush.width, bush.height);
    }
  }

  drawTreesOutlines(pg) {
    pg.noFill();
    pg.stroke(0);
    pg.strokeWeight(1);
    for (let tree of this.trees) {
      this.drawSimpleTree(pg, tree.x, tree.y, tree.type);
    }
  }

  drawSimpleTree(pg, x, y, type) {
    pg.push();
    pg.translate(x, y);
    pg.fill(34, 139, 34);
    if (type === 'pine') {
      pg.beginShape();
      pg.vertex(-10, 0);
      pg.vertex(10, 0);
      pg.vertex(0, -30);
      pg.endShape(CLOSE);
    } else if (type === 'oak') {
      pg.line(0, 0, 0, -20);
      pg.ellipse(0, -25, 20, 15);
    }
    pg.pop();
  }
}

class Player {
  constructor(index, hex, colour) {
    this.index = index;
    this.x = hex.x;
    this.y = hex.y;
    this.gridX = hex.cubeX;
    this.gridY = hex.cubeY;
    this.gridZ = hex.cubeZ;
    this.colour = colour;
    this.treasures = 0;
    this.extraDice = 0;
    this.hasShip = false;
    this.alive = true;
    this.history = [{ x: this.x, y: this.y }];
    this.baseDice = NUM_DICE;
  }

  getCurrentDiceCount() {
    return this.baseDice + this.extraDice;
  }

  reduceBaseDice() {
    if (this.baseDice > 0) {
      this.baseDice -= 1;
      console.log(`Player ${this.index + 1}'s base dice reduced to ${this.baseDice}.`);
    } else {
      console.log(`Player ${this.index + 1} has no base dice left to reduce.`);
    }
  }

  display(pg = window) {
    if (!this.alive) return;
    let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
    if (hex) {
      pg.fill(this.colour);
      pg.noStroke();
      pg.ellipse(hex.x, hex.y, HEX_SIZE * 1.8, HEX_SIZE * 1.8);
      pg.image(svgKnight, hex.x - 24, hex.y - 30, 52, 52);
      if (this.hasShip) {
        pg.fill(255);
        pg.noStroke();
        let shipSize = HEX_SIZE / 1.5;
        pg.triangle(
          hex.x, hex.y - shipSize / 2,
          hex.x - shipSize / 2, hex.y + shipSize / 2,
          hex.x + shipSize / 2, hex.y + shipSize / 2
        );
      }
      pg.fill(255, 255, 0);
      pg.textSize(10);
      pg.textAlign(CENTER, CENTER);
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
    this.alive = true;
  }

  display(pg = window) {
    if (!this.alive) return;
    pg.fill(0);
    pg.noStroke();
    pg.image(svgSpearman, this.x - 22, this.y - 29, HEX_SIZE * 2, HEX_SIZE * 2);
  }

  moveTowards(players, enemies) {
    if (!this.alive) return;
    let currentHex = getHexAt(this.gridX, this.gridY, this.gridZ);
    let stepsToMove = 1;
    if (currentHex && currentHex.type === 'grass') {
      stepsToMove = 2;
    }
    let closestPlayer = null;
    let minDist = Infinity;
    for (let player of players) {
      if (!player.alive) continue;
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
            let occupiedByEnemy = enemies.some(enemy =>
              enemy !== this &&
              enemy.alive &&
              enemy.gridX === nextStep.x &&
              enemy.gridY === nextStep.y &&
              enemy.gridZ === nextStep.z
            );
            if (!occupiedByEnemy) {
              this.updatePosition(nextStep);
            } else {
              break;
            }
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
  }

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
    this.attackRange = 1;
  }

  display(pg = window) {
    if (!this.alive) return;
    pg.push();
    pg.translate(this.x, this.y);
    pg.image(svgKraken, -22, -23, HEX_SIZE * 1.8, HEX_SIZE * 1.8);
    pg.pop();
  }

  moveTowards(players, enemies) {
    if (!this.alive) return;
    let closestPlayer = null;
    let minDist = Infinity;
    for (let player of players) {
      if (!player.alive) continue;
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
      }
    }
  }

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
      if (!hex || hex.type !== 'water' || !isHexFullyVisible(hex)) continue;
      let occupiedByEnemy = enemies.some(enemy =>
        enemy !== this &&
        enemy.alive &&
        enemy.gridX === nextHexCoords.gridX &&
        enemy.gridY === nextHexCoords.gridY &&
        enemy.gridZ === nextHexCoords.gridZ
      );
      if (occupiedByEnemy) continue;
      let distVal = cubeDistance(nextHexCoords, target);
      if (distVal < minDist) {
        minDist = distVal;
        bestStep = nextHexCoords;
      }
    }
    return bestStep;
  }

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

  display(pg = window) {
    if (!this.alive) return;
    pg.push();
    pg.translate(this.x, this.y);
    pg.image(svgBowDefender, -22, -29, HEX_SIZE * 1.8, HEX_SIZE * 1.8);
    pg.pop();
  }

  moveTowards(players, enemies) {
    // BowDefenders do not move
  }

  getBattleRoll() {
    return floor(random(1, 5));
  }
}

class Archer extends enemy {
  constructor(hex) {
    super(hex);
    this.attackRange = 2;
    this.hasAttackedThisTurn = false;
  }

  display(pg = window) {
    if (!this.alive) return;
    pg.push();
    pg.translate(this.x, this.y);
    pg.image(svgArcher, -22, -29, HEX_SIZE * 2.2, HEX_SIZE * 2);
    pg.pop();
  }

  getBattleRoll() {
    // Range is user preference. If you prefer 1-4, set random(1,5). If you prefer 1-6, set random(1,7).
    return floor(random(1, 1));
  }

  moveTowards(players, enemies) {
    if (!this.alive) return;
    let currentHex = getHexAt(this.gridX, this.gridY, this.gridZ);
    let stepsToMove = 1;
    if (currentHex && currentHex.type === 'grass') {
      stepsToMove = 2;
    }
    let closestPlayer = null;
    let minDist = Infinity;
    for (let player of players) {
      if (!player.alive) continue;
      let distVal = cubeDistance(this, player);
      if (distVal < minDist) {
        minDist = distVal;
        closestPlayer = player;
      }
    }
    if (closestPlayer) {
      if (minDist <= this.attackRange) {
        return;
      }
      for (let step = 0; step < stepsToMove; step++) {
        let nextStep = getNextStepTowards(this, closestPlayer);
        if (nextStep) {
          let intermediateHex = getHexAt(nextStep.x, nextStep.y, nextStep.z);
          if (intermediateHex && isenemyTraversable(intermediateHex) && isHexFullyVisible(intermediateHex)) {
            let futureDistance = cubeDistance(
              { gridX: nextStep.x, gridY: nextStep.y, gridZ: nextStep.z },
              closestPlayer
            );
            if (futureDistance < this.attackRange) {
              break;
            }
            let occupiedByEnemy = enemies.some(enemy =>
              enemy !== this &&
              enemy.alive &&
              enemy.gridX === nextStep.x &&
              enemy.gridY === nextStep.y &&
              enemy.gridZ === nextStep.z
            );
            if (!occupiedByEnemy) {
              this.updatePosition(nextStep);
            } else {
              break;
            }
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
  }
}

class DragonEnemy extends enemy {
  constructor(hex) {
    super(hex);
    this.sizeMultiplier = 1.5;
  }

  display(pg = window) {
    if (!this.alive) return;
    pg.image(svgDragon, this.x - 25, this.y - 23, HEX_SIZE * 1.8, HEX_SIZE * 1.8);
  }

  moveTowards(players, enemies) {
    if (!this.alive) return;
    let closestPlayer = null;
    let minDist = Infinity;
    for (let player of players) {
      if (!player.alive) continue;
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
          let occupiedByEnemy = enemies.some(enemy =>
            enemy !== this &&
            enemy.alive &&
            enemy.gridX === nextStep.x &&
            enemy.gridY === nextStep.y &&
            enemy.gridZ === nextStep.z
          );
          if (!occupiedByEnemy) {
            this.updatePosition(nextStep);
          }
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

  display(pg = window) {
    let hex = getHexAt(this.gridX, this.gridY, this.gridZ);
    if (hex && this.carriedBy === null) {
      pg.push();
      pg.translate(hex.x, hex.y);
      pg.fill(165, 42, 42);
      pg.noStroke();
      pg.beginShape();
      pg.vertex(-HEX_SIZE * 0.3, HEX_SIZE * 0.1);
      pg.vertex(HEX_SIZE * 0.3, HEX_SIZE * 0.1);
      pg.vertex(HEX_SIZE * 0.2, HEX_SIZE * 0.3);
      pg.vertex(-HEX_SIZE * 0.2, HEX_SIZE * 0.3);
      pg.endShape(CLOSE);
      pg.stroke(160, 82, 45);
      pg.strokeWeight(2);
      pg.line(0, HEX_SIZE * 0.1, 0, -HEX_SIZE * 0.3);
      pg.fill(255);
      pg.noStroke();
      pg.triangle(0, -HEX_SIZE * 0.3, HEX_SIZE * 0.2, 0, 0, 0);
      pg.pop();
    }
  }
}

// ---- Setup and Map Building ----

function initialisePlayers() {
  let centerX = 0;
  let centerY = 0;
  let startingHexes = hexGrid.filter(hex =>
    isLandHex(hex) &&
    Math.abs(hex.cubeX - centerX) <= 5 &&
    Math.abs(hex.cubeY - centerY) <= 5 &&
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex)
  );
  if (startingHexes.length === 0) {
    startingHexes = hexGrid.filter(hex => isLandHex(hex) && isHexFullyVisible(hex) && !isHexOccupied(hex));
  }
  players = [];
  for (let i = 0; i < numPlayers; i++) {
    if (startingHexes.length === 0) {
      console.error('No available starting hexes for players.');
      break;
    }
    let playerHex = random(startingHexes);
    let colour = i === 0 ? 'red' : 'blue';
    players.push(new Player(i, playerHex, colour));
    startingHexes = startingHexes.filter(h => h !== playerHex);
  }
}

function calculateGridDimensions() {
  cols = ceil(width / (HEX_SIZE * 1.5)) + 1;
  rows = ceil(height / (HEX_SIZE * sqrt(3))) + 1;
}

function populateHexGrid() {
  hexGrid = [];
  for (let q = -cols; q <= cols; q++) {
    for (let r = -rows; r <= rows; r++) {
      let { x, y } = calculateHexPosition(q, r);
      if (x < -HEX_SIZE || x > width + HEX_SIZE || y < -HEX_SIZE || y > height + HEX_SIZE) {
        continue;
      }
      let { cubeX, cubeY, cubeZ } = calculateCubeCoordinates(q, r);
      let type = determineTerrainType({ cubeX, cubeY, cubeZ });
      hexGrid.push(new Hexagon(x, y, HEX_SIZE, type, cubeX, cubeY, cubeZ));
    }
  }
}

function determineTerrainType(hex) {
  let { cubeX, cubeY, cubeZ } = hex;
  let noiseScale = 0.1;
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

function isHexOccupied(hex) {
  let playerOnHex = players.some(p => p.gridX === hex.cubeX && p.gridY === hex.cubeY && p.gridZ === hex.cubeZ);
  let enemyOnHex = enemies.some(m => m.gridX === hex.cubeX && m.gridY === hex.cubeY && m.gridZ === hex.cubeZ);
  let isTeleporterHex = (hex.type === 'teleporter');
  let treasureOnHex = treasures.some(t => t.hex.cubeX === hex.cubeX && t.hex.cubeY === hex.cubeY && t.hex.cubeZ === hex.cubeZ);
  let shipOnHex = ships.some(s => s.gridX === hex.cubeX && s.gridY === hex.cubeY && s.gridZ === hex.cubeZ);
  let hexHasTrap = hex.hasTrap;
  return playerOnHex || enemyOnHex || isTeleporterHex || treasureOnHex || shipOnHex || hexHasTrap;
}

function placeHorses() {
  horses = [];
  let landHexes = hexGrid.filter(hex =>
    isLandHex(hex) &&
    hex.type !== 'mountain' &&
    hex.type !== 'castle' &&
    hex.type !== 'beach' &&
    isHexFullyVisible(hex)
  );
  for (let i = 0; i < numberHorses; i++) {
    if (landHexes.length === 0) break;
    let randomHex = random(landHexes);
    if (!horses.some(h => h.gridX === randomHex.cubeX &&
                          h.gridY === randomHex.cubeY &&
                          h.gridZ === randomHex.cubeZ)) {
      horses.push(new Horse(randomHex));
      landHexes = landHexes.filter(h => h !== randomHex);
    }
  }
}

function placeTraps() {
  let landHexes = hexGrid.filter(hex =>
    isLandHex(hex) &&
    hex.type !== 'castle' &&
    hex.type !== 'teleporter' &&
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex)
  );
  if (landHexes.length < numberTraps) {
    console.error("Not enough land hexes to place traps.");
    return;
  }
  for (let i = 0; i < numberTraps; i++) {
    let randomHex = random(landHexes);
    randomHex.hasTrap = true;
    landHexes = landHexes.filter(h => h !== randomHex);
  }
}

function placeTeleporters() {
  if (!teleporters) return;
  let landHexes = hexGrid.filter(hex =>
    isLandHex(hex) &&
    hex.type !== 'castle' &&
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex)
  );
  if (landHexes.length < 2) {
    console.error("Not enough land hexes to place teleporters.");
    return;
  }
  teleportHex1 = random(landHexes);
  landHexes = landHexes.filter(hex => hex !== teleportHex1);
  teleportHex2 = random(landHexes);
  teleportHex1.type = 'teleporter';
  teleportHex2.type = 'teleporter';
}

function placeTreasures() {
  treasures = [];
  let allHexes = hexGrid.filter(hex => isHexFullyVisible(hex) && !isHexOccupied(hex));
  for (let i = 0; i < numberTreasure; i++) {
    if (allHexes.length === 0) break;
    let randomHex = random(allHexes);
    treasures.push({ hex: randomHex, collected: false });
    allHexes = allHexes.filter(h => h !== randomHex);
  }
}

function placeCastles() {
  let suitableHexes = hexGrid.filter(hex => isLandHex(hex) && hex.type !== 'mountain' && isHexFullyVisible(hex));
  for (let i = 0; i < castleCount; i++) {
    if (suitableHexes.length === 0) break;
    let randomHex = random(suitableHexes);
    randomHex.type = 'castle';
    suitableHexes = suitableHexes.filter(h => h !== randomHex);
    let neighbours = getNeighbors(randomHex.cubeX, randomHex.cubeY, randomHex.cubeZ);
    neighbours.forEach(neighborCoords => {
      let neighborHex = getHexAt(neighborCoords.x, neighborCoords.y, neighborCoords.z);
      if (neighborHex) {
        neighborHex.castleVicinity = true;
      }
    });
  }
}

function placeenemies() {
  enemies = [];
  let landHexes = hexGrid.filter(hex =>
    isLandHex(hex) &&
    hex.type !== 'mountain' &&
    hex.type !== 'castle' &&
    isHexFullyVisible(hex) &&
    !isHexOccupied(hex)
  );
  for (let i = 0; i < numberSpearman; i++) {
    if (landHexes.length === 0) break;
    let randomHex = random(landHexes);
    enemies.push(new enemy(randomHex));
    landHexes = landHexes.filter(h => h !== randomHex);
  }
  for (let i = 0; i < numberDragons; i++) {
    if (landHexes.length === 0) break;
    let DragonHex = random(landHexes);
    enemies.push(new DragonEnemy(DragonHex));
    landHexes = landHexes.filter(h => h !== DragonHex);
  }
  for (let i = 0; i < numberSeaMonsters; i++) {
    let waterHexes = hexGrid.filter(hex => isWaterHex(hex));
    if (waterHexes.length === 0) break;
    let seaMonsterHex = random(waterHexes);
    enemies.push(new SeaMonster(seaMonsterHex));
    waterHexes = waterHexes.filter(h => h !== seaMonsterHex);
  }
  for (let i = 0; i < numberArchers; i++) {
    if (landHexes.length === 0) break;
    let archerHex = random(landHexes);
    enemies.push(new Archer(archerHex));
    landHexes = landHexes.filter(h => h !== archerHex);
  }
  let possibleDefenderHexes = [];
  for (let treasure of treasures) {
    let neighborHexes = getNeighbors(treasure.hex.cubeX, treasure.hex.cubeY, treasure.hex.cubeZ)
      .map(coords => getHexAt(coords.x, coords.y, coords.z))
      .filter(hex => hex && isLandHex(hex) && !isHexOccupied(hex));
    possibleDefenderHexes = possibleDefenderHexes.concat(neighborHexes);
  }
  if (teleporters && teleportHex1 && teleportHex2) {
    let teleportHexes = [teleportHex1, teleportHex2];
    for (let teleHex of teleportHexes) {
      if (!teleHex) continue;
      let neighborHexes = getNeighbors(teleHex.cubeX, teleHex.cubeY, teleHex.cubeZ)
        .map(coords => getHexAt(coords.x, coords.y, coords.z))
        .filter(hex => hex && isLandHex(hex) && !isHexOccupied(hex));
      possibleDefenderHexes = possibleDefenderHexes.concat(neighborHexes);
    }
  }
  possibleDefenderHexes = [...new Set(possibleDefenderHexes)];
  possibleDefenderHexes = possibleDefenderHexes.filter(hex => !isHexOccupied(hex));
  let defendersToPlace = Math.min(numberBowDefenders, possibleDefenderHexes.length);
  for (let i = 0; i < defendersToPlace; i++) {
    if (possibleDefenderHexes.length === 0) break;
    let index = floor(random(possibleDefenderHexes.length));
    let defenderHex = possibleDefenderHexes.splice(index, 1)[0];
    enemies.push(new BowDefender(defenderHex));
    landHexes = landHexes.filter(h => h !== defenderHex);
  }
}

function placeShips() {
  ships = [];
  let edgeWaterHexes = hexGrid.filter(hex => isEdgeWaterHex(hex) && isHexFullyVisible(hex) && !isHexOccupied(hex));
  for (let i = 0; i < numberShips; i++) {
    if (edgeWaterHexes.length === 0) break;
    let randomHex = random(edgeWaterHexes);
    ships.push(new Ship(randomHex));
    edgeWaterHexes = edgeWaterHexes.filter(h => h !== randomHex);
  }
}

function isLandHex(hex) {
  return ['grass', 'forest', 'mountain', 'beach', 'castle'].includes(hex.type);
}
function isWaterHex(hex) {
  return hex.type === 'water';
}
function isMountainHex(hex) {
  return hex.type === 'mountain';
}
function isEdgeWaterHex(hex) {
  if (hex.type !== 'water') return false;
  let neighbors = getNeighbors(hex.cubeX, hex.cubeY, hex.cubeZ);
  return neighbors.some(neighbor => {
    let neighborHex = getHexAt(neighbor.x, neighbor.y, neighbor.z);
    return neighborHex && isLandHex(neighborHex);
  });
}
function getNeighbors(x, y, z) {
  return CUBE_DIRECTIONS.map(direction => ({
    x: x + direction.x,
    y: y + direction.y,
    z: z + direction.z
  }));
}
function getHexAt(cubeX, cubeY, cubeZ) {
  return hexGrid.find(hex =>
    hex.cubeX === cubeX &&
    hex.cubeY === cubeY &&
    hex.cubeZ === cubeZ
  ) || null;
}
function isHexFullyVisible(hex) {
  const cornerDistance = HEX_SIZE;
  const left = hex.x - cornerDistance;
  const right = hex.x + cornerDistance;
  const top = hex.y - cornerDistance;
  const bottom = hex.y + cornerDistance;
  return left >= 0 && right <= width && top >= 0 && bottom <= height;
}

function displayHexGrid() {
  for (let hex of hexGrid) {
    hex.display();
  }
}
function displayShips() {
  for (let ship of ships) {
    ship.display();
  }
}
function displayHorses() {
  for (let horse of horses) {
    horse.display();
  }
}
function displayPlayers() {
  for (let player of players) {
    player.display();
  }
}
function displayPlayerPaths() {
  for (let player of players) {
    if (player.history.length > 1) {
      stroke(player.colour);
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
function displayenemies() {
  for (let enemy of enemies) {
    enemy.display();
  }
}
function displayDirectionNumbers() {
  if (gamePhase === 'battle' || gamePhase === 'battleEnd') return;
  if (players.length === 0) return;
  let currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer.alive) return;
  let playerHex = getHexAt(currentPlayer.gridX, currentPlayer.gridY, currentPlayer.gridZ);
  if (playerHex) {
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
function displayDiceRoll() {
  textSize(20);
  fill(255);
  textAlign(LEFT, TOP);
  if (players.length === 0) return;
  let currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer.alive) return;
  text(`${seed} `, width - 100, 20);
  if (gamePhase === 'roll') {
    text(`Player ${currentPlayer.index + 1} - ${currentPlayer.getCurrentDiceCount()} horses ${currentPlayer.treasures} treasure`, 10, 20);
  } else if (selectionPhase) {
    text(`Player ${currentPlayer.index + 1} - ${currentPlayer.getCurrentDiceCount()} horses ${currentPlayer.treasures} treasure`, 10, 20);
    text(`Select Dice for Direction and Distance`, 10, 50);
  } else if (gamePhase === 'move') {
    text(`Player ${currentPlayer.index + 1} has moved.`, 10, 20);
  } else if (gamePhase === 'battle') {
    text(`Battle Phase: Click 'Roll Dice' to fight.`, 10, 20);
  } else if (gamePhase === 'end') {
    text(`Game Over! Click 'Next' to continue.`, 10, 20);
  }
}
function displayMessage() {
  if (message !== '') {
    textSize(16);
    fill(255, 0, 0);
    textAlign(CENTER, TOP);
    text(message, width / 2, 80);
  }
}
function displayDice() {
  if (!diceVisible) return;
  let currentPlayer = players[currentPlayerIndex];
  let diceCount = currentPlayer.getCurrentDiceCount();
  let dieSize = 80;
  let dieSpacing = 15;
  let totalWidth = diceCount * dieSize + (diceCount - 1) * dieSpacing;
  let startX = (width - totalWidth) / 2;
  let dieY = height - dieSize - 150;
  if (selectionPhase || gamePhase === 'confirmMove') {
    for (let i = 0; i < diceCount; i++) {
      let dieX = startX + i * (dieSize + dieSpacing);
      drawDie(dieX, dieY, dieSize, diceRolls[i], 'player');
    }
    for (let i = 0; i < selectedDiceIndices.length; i++) {
      let dieIndex = selectedDiceIndices[i];
      if (dieIndex >= diceCount) continue;
      let dieX = startX + dieIndex * (dieSize + dieSpacing);
      let dieYPos = dieY;
      stroke(i === 0 ? '#F44336' : '#2196F3');
      strokeWeight(5);
      noFill();
      rect(dieX - 5, dieYPos - 5, dieSize + 10, dieSize + 10, 10);
      noStroke();
    }
  }
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
    if (playerBattleRoll > 0) {
      let playerDieSize = 100;
      let playerDieX = width / 2 - playerDieSize / 2;
      let playerDieY = height / 2 + enemyDieSize;
      drawDie(playerDieX, playerDieY, playerDieSize, totalPlayerRoll, 'player', playerDefeated);
      textSize(16);
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      text(`Roll ${playerBattleRoll} + ${totalPlayerRoll - playerBattleRoll - bonus} treasures + ${bonus} castle bonus`, width / 2, playerDieY + playerDieSize + 20);
    }
  }
}

function drawDie(x, y, size, value, role, dead) {
  push();
  translate(x, y);
  if (role === 'enemy') {
    fill(0);
  } else if (role === 'player') {
    fill(255);
  } else {
    fill(255);
  }
  stroke(0);
  strokeWeight(2);
  rect(0, 0, size, size, 10);
  if (dead === true) {
    stroke(255, 0, 0);
    strokeWeight(5);
    line(0, 0, size, size);
    line(size, 0, 0, size);
  }
  if (role === 'player') {
    fill(0);
  } else {
    fill(255);
  }
  noStroke();
  let dotSize = size / 8;
  let offset = size / 4;
  if (value <= 6) {
    let positions = {
      1: [[size / 2, size / 2]],
      2: [[offset, offset], [size - offset, size - offset]],
      3: [[offset, offset], [size / 2, size / 2], [size - offset, size - offset]],
      4: [[offset, offset], [offset, size - offset], [size - offset, offset], [size - offset, size - offset]],
      5: [[offset, offset], [offset, size - offset], [size / 2, size / 2], [size - offset, offset], [size - offset, size - offset]],
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
    fill(role === 'player' ? 0 : 255);
    textSize(size / 2);
    textAlign(CENTER, CENTER);
    text(value, size / 2, size / 2);
  }
  pop();
}

function exportSVG() {
  let svgCanvas = createGraphics(width, height, SVG);
  svgCanvas.background(220);
  for (let hex of hexGrid) {
    hex.display(svgCanvas);
  }
  for (let treasure of treasures) {
    if (!treasure.collected) {
      svgCanvas.fill(255, 223, 0);
      svgCanvas.noStroke();
      svgCanvas.ellipse(treasure.hex.x, treasure.hex.y, HEX_SIZE / 2, HEX_SIZE / 2);
    }
  }
  for (let ship of ships) {
    if (ship.carriedBy === null) {
      ship.display(svgCanvas);
    }
  }
  for (let enemy of enemies) {
    enemy.display(svgCanvas);
  }
  for (let horse of horses) {
    if (horse.carriedBy === null) {
      horse.display(svgCanvas);
    }
  }
  for (let player of players) {
    player.display(svgCanvas);
  }
  svgCanvas.save(`${seed}_HexQuest_Map.svg`);
}

function keyPressed() {
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

function mousePressed() {
  const activePhases = ['roll', 'select', 'confirmMove', 'battle', 'battleEnd', 'end', 'noMove', 'multiBattle'];
  if (!activePhases.includes(gamePhase)) {
    return;
  }
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
  let rollButtonX = rollButton.position().x;
  let rollButtonY = rollButton.position().y;
  let rollButtonW = rollButton.size().width;
  let rollButtonH = rollButton.size().height;
  let nextButtonX = nextButton.position().x;
  let nextButtonY = nextButton.position().y;
  let nextButtonW = nextButton.size().width;
  let nextButtonH = nextButton.size().height;
  let clickOnRollButton = mouseX >= rollButtonX && mouseX <= rollButtonX + rollButtonW &&
                          mouseY >= rollButtonY && mouseY <= rollButtonY + rollButtonH;
  let clickOnNextButton = mouseX >= nextButtonX && mouseX <= nextButtonX + nextButtonW &&
                          mouseY >= nextButtonY && mouseY <= nextButtonY + nextButtonH;

  if ((gamePhase === 'select' && selectionPhase) || (gamePhase === 'battle' && playerBattleRoll === 0)) {
    let dieSize = 80;
    let dieSpacing = 15;
    let totalWidth = diceCount * dieSize + (diceCount - 1) * dieSpacing;
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
          rollBattleDice();
        }
        break;
      }
    }
    if (!dieClicked && !clickOnRollButton && !clickOnNextButton) {
      selectedDiceIndices = [];
      if (gamePhase === 'confirmMove') {
        for (let hex of currentPath) {
          hex.highlighted = false;
        }
        currentPath = [];
        gamePhase = 'select';
        message = 'Movement canceled. Please select your dice again.';
        selectedDiceIndices = [];
        nextButton.hide();
        rollButton.show();
      }
    }
  } else if (gamePhase === 'confirmMove') {
    if (!clickOnNextButton) {
      for (let hex of currentPath) {
        hex.highlighted = false;
      }
      currentPath = [];
      gamePhase = 'select';
      message = 'Movement canceled. Please select your dice again.';
      selectedDiceIndices = [];
      nextButton.hide();
      rollButton.hide();
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  seedInput = createInput();
  seedInput.attribute('placeholder', 'Enter Seed');
  seedInput.size(192, 30);
  seedInput.position(width / 2 - 100, height / 2 + 140);
  generateSeedButton = createButton('Generate Seed');
  generateSeedButton.size(120, 30);
  generateSeedButton.position(width / 2 - 60, height / 2 + 175);
  generateSeedButton.mousePressed(() => {
    seed = floor(random(1, 1000000));
    seedInput.value(seed);
  });
  rollButton = createButton('Roll Dice');
  let buttonWidth = 100;
  let buttonHeight = 40;
  rollButton.size(buttonWidth, buttonHeight);
  rollButton.style('font-size', '16px');
  rollButton.style('background-color', '#4CAF50');
  rollButton.style('color', 'white');
  rollButton.style('border', 'none');
  rollButton.style('border-radius', '5px');
  rollButton.position(width / 2 - buttonWidth / 2, height - 70);
  rollButton.mousePressed(() => {
    if (gamePhase === 'roll') {
      rollDice();
    } else if (gamePhase === 'battle') {
      rollBattleDice();
    }
  });
  toggleDiceButton = createButton('Toggle Dice');
  toggleDiceButton.size(100, 40);
  toggleDiceButton.style('font-size', '16px');
  toggleDiceButton.style('background-color', '#FF5722');
  toggleDiceButton.style('color', 'white');
  toggleDiceButton.style('border', 'none');
  toggleDiceButton.style('border-radius', '5px');
  toggleDiceButton.position(width - 100, height - 70);
  toggleDiceButton.mousePressed(() => {
    diceVisible = !diceVisible;
  });
  toggleDiceButton.hide();
  nextButton = createButton('Next');
  nextButton.size(buttonWidth, buttonHeight);
  nextButton.style('font-size', '16px');
  nextButton.style('background-color', '#008CBA');
  nextButton.style('color', 'white');
  nextButton.style('border', 'none');
  nextButton.style('border-radius', '5px');
  nextButton.position(width / 2 - buttonWidth / 2, height - 70);
  nextButton.mousePressed(() => {
    if (gamePhase === 'confirmMove') {
      confirmMove();
    } else if (gamePhase === 'battle' || gamePhase === 'battleEnd' || gamePhase === 'end') {
      if (gamePhase === 'end') {
        gamePhase = 'gameover';
      } else {
        endTurn();
      }
    } else if (gamePhase === 'noMove') {
      endTurn();
    } else if (gamePhase === 'multiBattle') {
      // If a multiBattle queue is being processed, do nothing here. 
      // Moves happen after determineBattleOutcome or confirmMove calls initiateNextBattle.
    }
  });
  nextButton.hide();
  gamePhase = 'intro';
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
  onePlayerButton.style('background-color', '#4CAF50');
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
      initialiseGameWithSeed(seed);
    } else {
      seed = floor(random(1, 1000000));
      initialiseGameWithSeed(seed);
    }
    gamePhase = 'roll';
    hideIntroButtons();
    rollButton.show();
    if (exportShow){
      exportButton.show();
    } else {
      exportButton.hide();
    }
    loop();
  });
  restartButton = createButton('Restart');
  restartButton.size(200, 40);
  restartButton.position(width / 2 - 100, height / 2 + 60);
  restartButton.mousePressed(() => {
    gamePhase = 'intro';
    seedInput.show();
    generateSeedButton.show();
    showIntroButtons();
    restartButton.hide();
    nextButton.hide();
    loop();
  });
  restartButton.hide();
  exportButton = createButton('Export SVG');
  exportButton.size(120, 40);
  exportButton.style('font-size', '16px');
  exportButton.style('background-color', '#FF9800');
  exportButton.style('color', 'white');
  exportButton.style('border', 'none');
  exportButton.style('border-radius', '5px');
  exportButton.position(0, height - 70);
  exportButton.mousePressed(() => {
    exportSVG();
  });
  exportButton.hide();
  noLoop();
}

/**
 * Multi‐Battle: initiate next battle in the queue
 */
function initiateNextBattle() {
  if (pendingBattles.length === 0) {
    // Done with multi battles
    gamePhase = 'battleEnd';
    nextButton.show();
    return;
  }
  let { player, enemy } = pendingBattles.shift();
  initiateBattle(player, enemy);
}

/**
 * Checks for battles between players and enemies. Collect them all instead of returning early.
 */
function checkForBattles() {
  pendingBattles = [];
  for (let player of players) {
    if (!player.alive) continue;
    for (let enemy of enemies) {
      if (!enemy.alive) continue;
      if (enemy.hasAttackedThisTurn) continue;
      let distance = cubeDistance(player, enemy);
      if ((enemy.attackRange && distance <= enemy.attackRange) ||
          (!enemy.attackRange && distance === 0)) {
        pendingBattles.push({ player, enemy });
        enemy.hasAttackedThisTurn = true;
      }
    }
  }
  if (pendingBattles.length > 0) {
    gamePhase = 'multiBattle';
    selectionPhase = false;
    initiateNextBattle();
  }
}

/**
 * Initialises game with a seed.
 */
function initialiseGameWithSeed(seedValue) {
  randomSeed(seedValue);
  noiseSeed(seedValue);
  gamePhase = 'roll';
  calculateGridDimensions();
  populateHexGrid();
  placeTreasures();
  placeCastles();
  placeenemies();
  placeShips();
  placeHorses();
  placeTeleporters();
  placeTraps();
  initialisePlayers();
  currentPlayerIndex = 0;
  diceRolls = Array(players.length > 0 ? players[0].getCurrentDiceCount() : NUM_DICE).fill(0);
  message = '';
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
 * Resizes canvas and repositions buttons on window resize.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight * 0.9);
  let buttonWidth = 100;
  let buttonHeight = 40;
  rollButton.position(width / 2 - buttonWidth / 2, height - 70);
  nextButton.position(width / 2 - buttonWidth / 2, height - 70);
  onePlayerButton.position(width / 2 - 160, height / 2);
  twoPlayersButton.position(width / 2 + 60, height / 2);
  pathToggleButton.position(width / 2 - 100, height / 2 + 60);
  exportToggleButton.position(width / 2 - 100, height / 2 + 100);
  generateSeedButton.position(width / 2 - 60, height / 2 + 175);
  seedInput.position(width / 2 - 100, height / 2 + 140);
  startGameButton.position(width / 2 - 100, height / 2 + 220);
  toggleDiceButton.position(width - 100, height - 70);
  restartButton.position(width / 2 - 100, height / 2 + 60);
  exportButton.position(0, height - 70);
}

function hideIntroButtons() {
  onePlayerButton.hide();
  twoPlayersButton.hide();
  pathToggleButton.hide();
  exportToggleButton.hide();
  startGameButton.hide();
}

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
    image(svgKnight, width / 2 - 30, height / 2 - 290, 60, 60);
    textFont(font);
    textSize(60);
    text('HexQuest', width / 2, height / 2 - 200);
    textFont('Verdana');
    textSize(13.5);
    text('Embark on a quest to protect the kingdom. Collect treasures to defeat enemies. Each turn, choose a die for direction and one for distance. Use horses, boats and portals. Fights near castles grant a bonus.', width / 2 - 200, height / 2 - 140, 400);
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
    restartButton.show();
    nextButton.hide();
    return;
  }
  background(220);
  displayHexGrid();
  displayShips();
  displayHorses();
  if (pathDrawing) {
    displayPlayerPaths();
  }
  displayPlayers();
  displayTreasures();
  displayenemies();
  displayDirectionNumbers();
  displayDiceRoll();
  displayMessage();
  displayFightHighlights();
  if ((gamePhase === 'select' && selectionPhase) || gamePhase === 'confirmMove') {
    toggleDiceButton.show();
  } else {
    toggleDiceButton.hide();
  }
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

function displayFightHighlights(){
  if (gamePhase === 'battle' || gamePhase === 'battleEnd') {
    if (battlePlayer && battlePlayer.alive) {
      noFill();
      stroke(255, 0, 0);
      strokeWeight(4);
      ellipse(battlePlayer.x, battlePlayer.y, HEX_SIZE * 1.5, HEX_SIZE * 1.5);
    }
    if (battleenemy && battleenemy.alive) {
      noFill();
      stroke(255, 0, 0);
      strokeWeight(4);
      ellipse(battleenemy.x, battleenemy.y, HEX_SIZE * 1.5, HEX_SIZE * 1.5);
    }
  }
}

function moveenemies() {
  for (let e of enemies) {
    e.moveTowards(players, enemies);
  }
}

/**
 * End of turn logic: see if all players have moved, then let enemies move.
 */
function endTurn() {
  for (let hex of hexGrid) {
    hex.highlighted = false;
  }
  if (players.every(player => !player.alive)) {
    gamePhase = 'end';
    gameResult = 'defeat';
    nextButton.show();
    return;
  }
  players[currentPlayerIndex].hasMoved = true;
  if (players.filter(player => player.alive).every(player => player.hasMoved)) {
    for (let player of players) {
      player.hasMoved = false;
    }
    moveenemies();
    checkForBattles();
    if (gamePhase !== 'multiBattle' && gamePhase !== 'battle') {
      for (let e of enemies) {
        e.hasAttackedThisTurn = false;
      }
      gamePhase = 'roll';
      currentPlayerIndex = players.findIndex(player => player.alive);
    }
  } else {
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

function rollDice() {
  if (gamePhase === 'roll') {
    let currentPlayer = players[currentPlayerIndex];
    let diceCount = currentPlayer.getCurrentDiceCount();
    diceRolls = Array(diceCount).fill(0);
    for (let i = 0; i < diceCount; i++) {
      diceRolls[i] = floor(random(1, 7));
    }
    gamePhase = 'select';
    selectionPhase = true;
    rollButton.hide();
  }
}

function rollBattleDice() {
  if (gamePhase === 'battle' && playerBattleRoll === 0) {
    playerBattleRoll = floor(random(1, 7));
    determineBattleOutcome();
  }
}

function selectDice(dieIndex) {
  if (gamePhase === 'select' && selectionPhase) {
    let currentPlayer = players[currentPlayerIndex];
    let diceCount = currentPlayer.getCurrentDiceCount();
    if (dieIndex >= diceCount) return;
    if (selectedDiceIndices.includes(dieIndex)) {
      // Optionally deselect
    } else {
      if (selectedDiceIndices.length >= 2) {
        return;
      }
      selectedDiceIndices.push(dieIndex);
    }
    if (selectedDiceIndices.length === 2) {
      let directionDieValue = diceRolls[selectedDiceIndices[0]];
      let distanceDieValue = diceRolls[selectedDiceIndices[1]];
      proceedWithMovement(directionDieValue, distanceDieValue);
    }
  }
}

function proceedWithMovement(directionValue, distanceValue) {
  message = '';
  currentPath = [];
  currentTrappedHexes = [];
  let currentPlayer = players[currentPlayerIndex];
  let playerHex = getHexAt(currentPlayer.gridX, currentPlayer.gridY, currentPlayer.gridZ);
  if (playerHex && currentPlayer.alive) {
    let directionIndex = (directionValue - 1) % CUBE_DIRECTIONS.length;
    let chosenDirection = CUBE_DIRECTIONS[directionIndex];
    let targetHex = playerHex;
    let stepsTaken = 0;
    for (let step = 1; step <= distanceValue; step++) {
      let intermediateCoords = {
        x: targetHex.cubeX + chosenDirection.x,
        y: targetHex.cubeY + chosenDirection.y,
        z: targetHex.cubeZ + chosenDirection.z
      };
      let intermediateHex = getHexAt(intermediateCoords.x, intermediateCoords.y, intermediateCoords.z);
      if (!intermediateHex) {
        message += ` Cannot move off the map.`;
        break;
      }
      if (!isHexFullyVisible(intermediateHex)) {
        message += ` Cannot move off the map.`;
        break;
      }
      if (!isTraversable(intermediateHex, currentPlayer)) {
        message += ` Encountered impassable terrain.`;
        break;
      }
      let enemyOnHex = enemies.find(e =>
        e.alive &&
        e.gridX === intermediateHex.cubeX &&
        e.gridY === intermediateHex.cubeY &&
        e.gridZ === intermediateHex.cubeZ
      );
      if (enemyOnHex) {
        message += ` Encountered an enemy. Initiating battle.`;
        targetHex = intermediateHex;
        stepsTaken++;
        currentPath.push(playerHex);
        currentPath.push(targetHex);
        break;
      }
      if (intermediateHex.type === 'teleporter') {
        let destination = (intermediateHex === teleportHex1) ? teleportHex2 : teleportHex1;
        targetHex = intermediateHex;
        stepsTaken++;
        currentPath.push(playerHex);
        currentPath.push(targetHex);
        currentPath.push(destination);
        break;
      }
      targetHex = intermediateHex;
      stepsTaken++;
      if (stepsTaken === 1) {
        currentPath.push(playerHex);
      }
      currentPath.push(targetHex);
      if (targetHex.hasTrap) {
        message += ` Trap triggered.`;
        currentTrappedHexes.push(targetHex);
      }
      if (targetHex.type === 'swamp') {
        message += ` Swamp. Movement stops.`;
        break;
      }
    }
    if (stepsTaken > 0) {
      for (let h of currentPath) {
        h.highlighted = true;
      }
      gamePhase = 'confirmMove';
      nextButton.show();
      rollButton.hide();
    } else {
      message += ` No valid movement.`;
      gamePhase = 'confirmMove';
      nextButton.show();
    }
  }
}

function collectTreasure(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let treasure of treasures) {
    if (!treasure.collected &&
        treasure.hex.cubeX === hex.cubeX &&
        treasure.hex.cubeY === hex.cubeY &&
        treasure.hex.cubeZ === hex.cubeZ) {
      treasure.collected = true;
      currentPlayer.treasures += 1;
      message += ` Player ${currentPlayer.index + 1} collected treasure!`;
    }
  }
}

function collectHorse(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let horse of horses) {
    if (horse.carriedBy === null &&
        horse.gridX === hex.cubeX &&
        horse.gridY === hex.cubeY &&
        horse.gridZ === hex.cubeZ) {
      horse.carriedBy = currentPlayer.index;
      currentPlayer.extraDice += 1;
      message += ` Horse acquired. Extra die added.`;
      break;
    }
  }
}

function collectShip(hex) {
  let currentPlayer = players[currentPlayerIndex];
  for (let ship of ships) {
    if (ship.carriedBy === null &&
        ship.gridX === hex.cubeX &&
        ship.gridY === hex.cubeY &&
        ship.gridZ === hex.cubeZ) {
      ship.carriedBy = currentPlayer.index;
      currentPlayer.hasShip = true;
      message += ` Ship picked up.`;
    }
  }
}

function confirmMove() {
  let currentPlayer = players[currentPlayerIndex];
  if (currentTrappedHexes.length > 0) {
    let trapsTriggered = currentTrappedHexes.length;
    for (let trapHex of currentTrappedHexes) {
      trapHex.hasTrap = false;
    }
    for (let i = 0; i < trapsTriggered; i++) {
      currentPlayer.reduceBaseDice();
    }
    message += ` ${trapsTriggered} trap(s).`;
  } else {
    message += ` Movement confirmed.`;
  }
  for (let i = 1; i < currentPath.length; i++) {
    let hex = currentPath[i];
    movePlayerToHex(hex);
    collectTreasure(hex);
    collectHorse(hex);
    collectShip(hex);
    let enemyOnHex = enemies.find(e =>
      e.alive &&
      e.gridX === hex.cubeX &&
      e.gridY === hex.cubeY &&
      e.gridZ === hex.cubeZ
    );
    if (enemyOnHex) {
      gamePhase = 'battle';
      selectionPhase = false;
      battlePlayer = currentPlayer;
      initiateBattle(currentPlayer, enemyOnHex);
      break;
    }
    if (hex.type === 'teleporter' && !hasTeleportedThisMove) {
      let destination = (hex === teleportHex1) ? teleportHex2 : teleportHex1;
      movePlayerToHex(destination);
      message += ` Teleported.`;
      hasTeleportedThisMove = true;
    }
  }
  for (let hex of currentPath) {
    hex.highlighted = false;
  }
  currentPath = [];
  currentTrappedHexes = [];
  if (gamePhase === 'battle') {
    rollButton.show();
    nextButton.hide();
  } else {
    endTurn();
  }
  nextButton.hide();
  rollButton.show();
}

function movePlayerToHex(hex) {
  let player = players[currentPlayerIndex];
  player.x = hex.x;
  player.y = hex.y;
  player.gridX = hex.cubeX;
  player.gridY = hex.cubeY;
  player.gridZ = hex.cubeZ;
  player.history.push({ x: hex.x, y: hex.y });
  if (player.hasShip) {
    let ship = ships.find(s => s.carriedBy === player.index);
    if (ship) {
      ship.gridX = hex.cubeX;
      ship.gridY = hex.cubeY;
      ship.gridZ = hex.cubeZ;
      ship.x = hex.x;
      ship.y = hex.y;
    }
  }
  if (hex.type === 'teleporter') {
    hex.highlighted = false;
  }
}

function initiateBattle(player, enemy) {
  battlePlayer = player;
  battleenemy = enemy;
  enemyDefeated = false;
  playerDefeated = false;
  if (typeof enemy.getBattleRoll === 'function') {
    enemyBattleRoll = enemy.getBattleRoll();
  } else if (enemy instanceof DragonEnemy) {
    enemyBattleRoll = floor(random(1, 7)) + floor(random(1, 7));
  } else {
    enemyBattleRoll = floor(random(1, 7));
  }
  playerBattleRoll = 0;
  message = `Battle. Enemy rolled ${enemyBattleRoll}. Click 'Roll Dice'.`;
  rollButton.show();
  nextButton.hide();
  gamePhase = 'battle';
}

function determineBattleOutcome() {
  let player = battlePlayer;
  bonus = 0;
  let battleHex = getHexAt(player.gridX, player.gridY, player.gridZ);
  if (battleHex && (battleHex.castleVicinity || battleHex.type === 'castle')) {
    bonus = 2;
    message += ` +${bonus} near castle.`;
  }
  totalPlayerRoll = playerBattleRoll + battlePlayer.treasures + bonus;
  if (totalPlayerRoll > enemyBattleRoll) {
    message = `Player ${player.index + 1} wins.`;
    let en = enemies.find(
      m => m.gridX === player.gridX && m.gridY === player.gridY && m.gridZ === player.gridZ
    );
    if (en) {
      en.alive = false;
      enemyDefeated = true;
      enemies = enemies.filter(m => m !== en);
      player.treasures += 1;
      message = `Enemy defeated. +1 treasure.`;
    }
    if (enemies.length === 0) {
      message = `All enemies defeated. Victory!`;
      gamePhase = 'end';
      gameResult = 'victory';
      nextButton.show();
    } else {
      nextButton.show();
      gamePhase = 'battleEnd';
    }
  } else {
    message = `Player ${player.index + 1} is defeated.`;
    player.alive = false;
    playerDefeated = true;
    if (players.every(p => !p.alive)) {
      message = `All players defeated. Game Over.`;
      gamePhase = 'end';
      gameResult = 'defeat';
      nextButton.show();
    } else {
      nextButton.show();
      gamePhase = 'battleEnd';
      battlePlayer = null;
      battleenemy = null;
    }
  }
  rollButton.hide();
}