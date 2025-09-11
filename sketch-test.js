// Minimal sketch.js test
import { GameConfig } from './config/GameConfig.js';

console.log('sketch.js loaded, GameConfig:', GameConfig);

function setup() {
  createCanvas(800, 600);
  console.log('p5.js setup called');
}

function draw() {
  background(220);
  fill(0);
  text('Refactored HexQuest Test', 20, 30);
  text('GameConfig loaded: ' + (GameConfig ? 'Yes' : 'No'), 20, 50);
}