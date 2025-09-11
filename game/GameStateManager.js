// Game State Manager for HexQuest
// Handles game phases, player turns, and state transitions

import { GameConfig } from '../config/GameConfig.js';

export class GameStateManager {
  constructor() {
    this.currentPhase = GameConfig.GAME_PHASES.INTRO;
    this.currentPlayerIndex = 0;
    this.numPlayers = GameConfig.DEFAULTS.NUM_PLAYERS;
    this.gameResult = null;
    this.message = '';
    this.diceRolls = [];
    this.diceVisible = GameConfig.DEFAULTS.DICE_VISIBLE;
    
    // Game entities - will be populated later
    this.players = [];
    this.enemies = [];
    this.treasures = [];
    this.ships = [];
    this.horses = [];
    
    // Game flow control
    this.movesRemaining = 0;
    this.battleInProgress = false;
    this.selectedEntity = null;
    
    console.log('GameStateManager initialized in phase:', this.currentPhase);
  }

  /**
   * Transition to a new game phase
   * @param {string} newPhase - The phase to transition to
   * @param {string} reason - Optional reason for the transition
   */
  transitionTo(newPhase, reason = '') {
    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;
    
    console.log(`Phase transition: ${oldPhase} → ${newPhase}`, reason ? `(${reason})` : '');
    
    // Handle phase-specific logic
    this.onPhaseEnter(newPhase, oldPhase);
  }

  /**
   * Handle logic when entering a new phase
   * @param {string} newPhase - The phase being entered
   * @param {string} oldPhase - The phase being left
   */
  onPhaseEnter(newPhase, oldPhase) {
    switch (newPhase) {
      case GameConfig.GAME_PHASES.INTRO:
        this.message = 'Welcome to HexQuest! Click to start.';
        break;
        
      case GameConfig.GAME_PHASES.ROLL:
        this.message = `Player ${this.currentPlayerIndex + 1}: Roll the dice!`;
        this.diceVisible = true;
        this.diceRolls = [];
        break;
        
      case GameConfig.GAME_PHASES.SELECT:
        this.message = `Player ${this.currentPlayerIndex + 1}: Select your moves.`;
        break;
        
      case GameConfig.GAME_PHASES.MOVE:
        this.message = `Player ${this.currentPlayerIndex + 1}: Make your moves.`;
        break;
        
      case GameConfig.GAME_PHASES.BATTLE:
        this.message = 'Battle in progress!';
        this.battleInProgress = true;
        break;
        
      case GameConfig.GAME_PHASES.GAMEOVER:
        this.message = this.gameResult || 'Game Over!';
        break;
        
      default:
        this.message = `Phase: ${newPhase}`;
    }
  }

  /**
   * Get the current player
   * @returns {Object|null} - Current player object or null
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex] || null;
  }

  /**
   * Advance to the next player's turn
   */
  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.numPlayers;
    
    // If we've cycled through all players, handle end of round
    if (this.currentPlayerIndex === 0) {
      this.onRoundComplete();
    }
    
    // Transition to roll phase for the new player
    this.transitionTo(GameConfig.GAME_PHASES.ROLL, `Player ${this.currentPlayerIndex + 1}'s turn`);
  }

  /**
   * Handle end of round logic
   */
  onRoundComplete() {
    console.log('Round completed, all players have taken their turns');
    // Add any end-of-round logic here
  }

  /**
   * Set dice rolls for the current player
   * @param {Array} rolls - Array of dice roll values
   */
  setDiceRolls(rolls) {
    this.diceRolls = [...rolls];
    this.movesRemaining = rolls.length;
    console.log(`Dice rolled:`, rolls, `- ${this.movesRemaining} moves available`);
    
    // Transition to selection phase
    this.transitionTo(GameConfig.GAME_PHASES.SELECT, `${this.movesRemaining} moves to select`);
  }

  /**
   * Use one move (decrement moves remaining)
   * @returns {boolean} - True if move was used, false if no moves remaining
   */
  useMove() {
    if (this.movesRemaining > 0) {
      this.movesRemaining--;
      console.log(`Move used, ${this.movesRemaining} moves remaining`);
      
      // If no moves left, end turn
      if (this.movesRemaining === 0) {
        this.endTurn();
      }
      
      return true;
    }
    return false;
  }

  /**
   * End the current player's turn
   */
  endTurn() {
    console.log(`Player ${this.currentPlayerIndex + 1}'s turn ended`);
    this.movesRemaining = 0;
    this.selectedEntity = null;
    
    // Check for game end conditions
    if (this.checkGameEndConditions()) {
      this.transitionTo(GameConfig.GAME_PHASES.GAMEOVER, 'Game end condition met');
    } else {
      this.nextPlayer();
    }
  }

  /**
   * Check if the game should end
   * @returns {boolean} - True if game should end
   */
  checkGameEndConditions() {
    // Add game end logic here
    // For now, game doesn't end
    return false;
  }

  /**
   * Start a battle
   * @param {Object} attacker - Attacking entity
   * @param {Object} defender - Defending entity
   */
  startBattle(attacker, defender) {
    console.log('Battle started:', attacker, 'vs', defender);
    this.battleInProgress = true;
    this.transitionTo(GameConfig.GAME_PHASES.BATTLE, `${attacker.type} vs ${defender.type}`);
  }

  /**
   * End a battle with results
   * @param {Object} result - Battle result
   */
  endBattle(result) {
    console.log('Battle ended:', result);
    this.battleInProgress = false;
    
    // Apply battle results
    this.applyBattleResult(result);
    
    // Return to appropriate phase
    if (this.movesRemaining > 0) {
      this.transitionTo(GameConfig.GAME_PHASES.MOVE, 'Battle completed, continue moving');
    } else {
      this.endTurn();
    }
  }

  /**
   * Apply the results of a battle
   * @param {Object} result - Battle result to apply
   */
  applyBattleResult(result) {
    // Battle result application logic will be implemented here
    console.log('Applying battle result:', result);
  }

  /**
   * Get current game state information
   * @returns {Object} - Current state summary
   */
  getState() {
    return {
      phase: this.currentPhase,
      currentPlayer: this.currentPlayerIndex,
      message: this.message,
      movesRemaining: this.movesRemaining,
      diceRolls: [...this.diceRolls],
      diceVisible: this.diceVisible,
      battleInProgress: this.battleInProgress,
      gameResult: this.gameResult
    };
  }

  /**
   * Initialize players for the game
   * @param {number} numPlayers - Number of players
   */
  initializePlayers(numPlayers) {
    this.numPlayers = numPlayers;
    this.currentPlayerIndex = 0;
    this.players = [];
    
    // Players will be created and added later when entity system is integrated
    console.log(`Game initialized for ${numPlayers} players`);
  }

  /**
   * Add entities to the game state
   * @param {Array} players - Player entities
   * @param {Array} enemies - Enemy entities  
   * @param {Array} treasures - Treasure entities
   * @param {Array} ships - Ship entities
   * @param {Array} horses - Horse entities
   */
  setEntities(players, enemies, treasures, ships, horses) {
    this.players = players;
    this.enemies = enemies;
    this.treasures = treasures;
    this.ships = ships;
    this.horses = horses;
    
    console.log('Entities set:', {
      players: players.length,
      enemies: enemies.length,
      treasures: treasures.length,
      ships: ships.length,
      horses: horses.length
    });
  }

  /**
   * Start the game
   */
  startGame() {
    this.transitionTo(GameConfig.GAME_PHASES.ROLL, 'Game started');
  }

  /**
   * Reset the game to initial state
   */
  reset() {
    this.currentPhase = GameConfig.GAME_PHASES.INTRO;
    this.currentPlayerIndex = 0;
    this.gameResult = null;
    this.message = '';
    this.diceRolls = [];
    this.movesRemaining = 0;
    this.battleInProgress = false;
    this.selectedEntity = null;
    
    console.log('Game state reset');
  }
}