# HexQuest Refactoring Guide

## Overview

This document outlines the comprehensive refactoring plan for HexQuest, a hex-based strategy game built with p5.js. The current codebase suffers from significant architectural issues that make it difficult to maintain, extend, and debug. This guide provides a systematic approach to transform the monolithic structure into a clean, modular architecture.

## Current State Analysis

### Critical Problems

#### 1. Monolithic Architecture
- **Single File**: 3,313 lines of code in `sketch.js`
- **No Separation of Concerns**: Game logic, UI, rendering, and data management all mixed together
- **Maintenance Nightmare**: Finding and modifying specific features is extremely difficult

#### 2. Global Variable Chaos
```javascript
// Over 30 global variables scattered throughout
let cols, rows, hexGrid, treasures, enemies, ships, players, horses;
let currentTrappedHexes, teleportHex1, teleportHex2;
let hasTeleportedThisMove, currentPlayerIndex, diceRolls;
let gamePhase, gameResult, message, font;
// ... and many more
```

#### 3. Mixed Responsibilities
- Classes defined alongside utility functions
- Game flow logic mixed with rendering code
- UI management scattered throughout game logic
- SVG export functionality embedded in display methods

#### 4. Inconsistent Code Quality
- **Naming**: Mix of camelCase and inconsistent patterns (`enemy` vs `enemies`, `moveenemies`)
- **Functions**: Some functions are 100+ lines with multiple responsibilities
- **Hard-coded Values**: Magic numbers mixed with configuration constants

#### 5. Complex Game Flow
- Game phases managed through string comparisons
- State transitions scattered across multiple functions
- Battle system logic distributed across the codebase

#### 6. SVG Export Concerns
- Critical functionality embedded throughout the codebase
- Risk of breaking during refactoring
- Display methods contain SVG-specific logic

## Target Architecture

### Proposed File Structure
```
HexQuest/
├── index.html
├── style.css
├── sketch.js                 # Main coordinator
├── config/
│   └── GameConfig.js         # All game constants and settings
├── entities/
│   ├── BaseEntity.js         # Base class for all game entities
│   ├── Player.js             # Player class
│   ├── enemies/
│   │   ├── Enemy.js          # Base enemy class
│   │   ├── Archer.js         # Archer enemy
│   │   ├── BowDefender.js    # Bow defender enemy
│   │   ├── DragonEnemy.js    # Dragon enemy
│   │   └── SeaMonster.js     # Sea monster enemy
│   ├── Ship.js               # Ship entity
│   ├── Horse.js              # Horse entity
│   └── Treasure.js           # Treasure entity
├── hexgrid/
│   ├── Hexagon.js            # Individual hex logic
│   ├── HexGrid.js            # Grid management
│   ├── TerrainGenerator.js   # Terrain generation logic
│   └── HexUtils.js           # Coordinate calculations
├── game/
│   ├── GameStateManager.js   # Centralized state management
│   ├── BattleManager.js      # Battle system logic
│   ├── MovementManager.js    # Movement and pathfinding
│   └── CollectionManager.js  # Treasure/item collection
├── ui/
│   ├── UIManager.js          # UI coordination
│   ├── DiceDisplay.js        # Dice rendering and interaction
│   ├── ButtonManager.js      # Button management
│   ├── IntroScreen.js        # Intro screen UI
│   └── GameOverScreen.js     # Game over screen UI
├── rendering/
│   ├── Renderer.js           # Main rendering coordinator
│   ├── EntityRenderer.js     # Entity rendering
│   ├── HexRenderer.js        # Hex grid rendering
│   └── SVGExporter.js        # SVG export functionality
└── utils/
    ├── MathUtils.js          # Mathematical operations
    ├── ValidationUtils.js    # Validation functions
    └── Constants.js          # Shared constants
```

### Core Principles
1. **Single Responsibility**: Each module has one clear purpose
2. **Dependency Injection**: Clear dependencies between modules
3. **State Centralization**: Game state managed in one place
4. **Preserved Functionality**: All existing features, especially SVG export
5. **Consistent Naming**: Clear, descriptive naming conventions

## Refactoring Stages

### Stage 1: Foundation Setup
**Goal**: Create the basic modular structure without breaking existing functionality

#### Step 1.1: Create Configuration Module
- Extract all constants from the top of `sketch.js`
- Create `config/GameConfig.js` with organized sections
- Group related constants (terrain, entities, UI, etc.)

#### Step 1.2: Create Utility Modules
- Extract mathematical functions (`cubeDistance`, `calculateHexPosition`, etc.)
- Create `utils/MathUtils.js` and `utils/ValidationUtils.js`
- Move coordinate conversion functions

#### Step 1.3: Set Up Base Classes
- Create `entities/BaseEntity.js` for common entity functionality
- Define common interface for position, display, and basic properties

### Stage 2: Entity Extraction
**Goal**: Separate all game entities into individual modules

#### Step 2.1: Extract Player Class
- Move `Player` class to `entities/Player.js`
- Ensure all dependencies are properly imported
- Test that player functionality remains intact

#### Step 2.2: Extract Enemy Classes
- Create base `entities/enemies/Enemy.js`
- Move specific enemy types to individual files
- Maintain inheritance hierarchy
- Preserve battle mechanics and movement logic

#### Step 2.3: Extract Other Entities
- Move `Ship`, `Horse`, and create `Treasure` classes
- Ensure collection mechanics remain functional

### Stage 3: Hex Grid System
**Goal**: Modularize the hex grid system

#### Step 3.1: Extract Hexagon Class
- Move `Hexagon` class to `hexgrid/Hexagon.js`
- Preserve all terrain rendering logic
- Maintain SVG compatibility in display methods

#### Step 3.2: Create Grid Management
- Extract grid population logic to `hexgrid/HexGrid.js`
- Move terrain generation to `hexgrid/TerrainGenerator.js`
- Create utilities for hex operations in `hexgrid/HexUtils.js`

### Stage 4: Game State Management
**Goal**: Centralize game state and phase management

#### Step 4.1: Create GameStateManager
- Extract all game phase logic
- Create clear state transition methods
- Centralize game variables (current player, game phase, etc.)

#### Step 4.2: Create Specialized Managers
- `BattleManager`: Handle all battle logic and outcomes
- `MovementManager`: Handle movement validation and execution
- `CollectionManager`: Handle treasure, horse, and ship collection

### Stage 5: UI System
**Goal**: Separate UI components from game logic

#### Step 5.1: Extract Button Management
- Create `ui/ButtonManager.js` for all button logic
- Separate button positioning from game logic
- Maintain responsive behavior

#### Step 5.2: Extract Display Components
- Create `ui/DiceDisplay.js` for dice rendering and selection
- Extract intro and game over screens
- Create message display system

### Stage 6: Rendering System
**Goal**: Separate rendering concerns and preserve SVG export

#### Step 6.1: Create Renderer Architecture
- Create `rendering/Renderer.js` as main coordinator
- Separate entity rendering from entity logic
- Maintain both canvas and SVG rendering capabilities

#### Step 6.2: Preserve SVG Export
- Create dedicated `rendering/SVGExporter.js`
- Ensure all entities can render to both canvas and SVG
- Test SVG output thoroughly

### Stage 7: Main File Refactoring
**Goal**: Transform sketch.js into a clean coordinator

#### Step 7.1: Import All Modules
- Add proper imports for all created modules
- Initialize all managers and systems

#### Step 7.2: Simplify Main Functions
- Reduce `setup()` and `draw()` to coordination only
- Move specific logic to appropriate managers

### Stage 8: Testing and Validation
**Goal**: Ensure all functionality works as before

#### Step 8.1: Functional Testing
- Test all game mechanics
- Verify SVG export functionality
- Check responsive behavior

#### Step 8.2: Performance Validation
- Ensure refactoring hasn't impacted performance
- Optimize any performance regressions

## Implementation Guidelines

### Code Standards
```javascript
// File naming: PascalCase for classes, camelCase for utilities
// Class example
class GameStateManager {
  constructor() {
    this.currentPhase = 'intro';
    this.currentPlayerIndex = 0;
  }
  
  transitionTo(newPhase) {
    // Clear phase transition logic
  }
}

// Utility example
export function calculateHexPosition(q, r) {
  // Clear, focused function
}
```

### Import/Export Pattern
```javascript
// In each module
export class Player {
  // class implementation
}

// In main sketch.js
import { Player } from './entities/Player.js';
import { GameConfig } from './config/GameConfig.js';
```

### SVG Preservation Strategy
- Maintain dual rendering capability in all display methods
- Use graphics context parameter: `display(pg = window)`
- Test SVG export after each major change

### Critical Checkpoints
1. After each stage, verify the game still runs
2. Test SVG export functionality
3. Validate all game mechanics work as before
4. Check responsive UI behavior

## Risk Mitigation

### High-Risk Areas
1. **SVG Export**: Critical functionality that must be preserved
2. **Game State**: Complex state transitions that could break
3. **Battle System**: Intricate logic with many edge cases
4. **UI Responsiveness**: Button positioning and window resizing

### Mitigation Strategies
1. **Incremental Changes**: Small, testable changes at each step
2. **Backup Points**: Commit working state after each stage
3. **Parallel Development**: Keep original working while refactoring
4. **Extensive Testing**: Test each component thoroughly

## Success Criteria

### Functional Requirements
- ✅ All game mechanics work identically to original
- ✅ SVG export produces identical output
- ✅ UI remains responsive and functional
- ✅ Performance is maintained or improved

### Code Quality Requirements
- ✅ No file exceeds 500 lines
- ✅ Each module has single responsibility
- ✅ Clear dependency structure
- ✅ Consistent naming conventions
- ✅ Comprehensive code organization

### Maintainability Requirements
- ✅ Easy to locate specific features
- ✅ Simple to add new enemy types
- ✅ Clear game state management
- ✅ Modular testing capabilities

## Conclusion

This refactoring will transform HexQuest from a monolithic codebase into a professional, maintainable game architecture. While the process is extensive, the systematic approach ensures that functionality is preserved while dramatically improving code quality and maintainability.

The modular structure will make future enhancements significantly easier, whether adding new enemy types, expanding the game mechanics, or improving the user interface. Most importantly, the critical SVG export functionality will be preserved and potentially enhanced through the dedicated rendering system.