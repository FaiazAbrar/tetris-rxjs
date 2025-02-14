import {
  clearFullRows,
  generateBlock,
  hasBlockReachedBottom,
  hasBlockReachedTop,
  hasObjectCollidedDown,
  holdCurrentBlock,
  moveBlockDown,
  moveBlockLeft,
  moveBlockRight,
  rotateBlockAntiClockwise,
  rotateBlockClockwise,
  setCurrentBlock,
} from "./generics";

import { Block, BlockPosition, GameEvent, State } from "./types";

/**
 * The initial state of the game.hhii
 */
export const initialState: State = {
  gameEnd: false,
  oldBlocks: [],
  score: 0,
  nextBlock: undefined,
  highScore: 0,
};

/**
 * Updates the game state for each tick (game cycle).
 * See the functions it invokes for more details.
 * @param state - The current game state.
 * @returns The new game state after the tick.hkjnn
 */
export const tick = (state: State): State => {
  // This is needed because the game end status is set to true in the tick function after the game has been restarted and we need to reset that to stop rendering gameOver box
  if (state.gameEnd) {
    return resetGameEndStatus(state);
  }

  // Clear full rows and get the new blocks and score
  const { newBlocks, newScore } = clearFullRows(state.oldBlocks, state.score);

  // Check if the game is over (a block has reached the top)
  const gameOver = hasBlockReachedTop(newBlocks);

  // If the game is over, return the updated state with gameEnd set to true
  if (gameOver) {
    return restartGameAfterGameOver(state);
  }

  // Check if the current block has reached the bottom or collided with another block
  const hasLanded = hasBlockLanded(state.currentBlock, newBlocks);

  // If the current block has landed, add it to oldBlocks and generate a new current block
  if (hasLanded) {
    return updateStateAfterLanding(state);
  } else {
    // If the current block hasn't landed, try to move it down. we cannot simply call moveBlockDown as game needs to process other things when block is falling on its own.
    return moveCurrentBlockDown(state, newBlocks, newScore);
  }
};

/** Utility functions to make tick function more readable. **/

/**
 * Resets the game end status.
 * @param state - The current game state.
 * @returns The new game state after the game end status has been reset.
 * This is used to reset the game end status after the game has been restarted.
 **/
const resetGameEndStatus = (state: State): State => {
  return {
    ...state,
    gameEnd: false,
  };
};
/**
 * Checks if the current block has landed.
 * @param currentBlock - The current block.
 * @param oldBlocks - The old blocks.
 * @returns Whether the current block has landed.
 */
const hasBlockLanded = (currentBlock: Block, oldBlocks: BlockPosition[]) =>
  !currentBlock ||
  hasBlockReachedBottom(currentBlock) ||
  hasObjectCollidedDown(currentBlock, oldBlocks);

/**
 * Updates the game state after the current block has landed.
 * @param state - The current game state.
 * @returns The new game state after the current block has landed.
 */
const updateStateAfterLanding = (state: State): State => {
  const { newBlocks, newScore } = clearFullRows(state.oldBlocks, state.score);
  const { newCurrentBlock, newNextBlock } = generateBlock(state.nextBlock);
  return {
    ...state,
    currentBlock: newCurrentBlock,
    nextBlock: newNextBlock,
    oldBlocks: [
      ...newBlocks,
      ...(state.currentBlock ? [state.currentBlock] : []),
    ],
    score: newScore,
  };
};

/**
 * Moves the current block down.
 * @param state - The current game state.
 * @param newBlocks - The new blocks.
 * @param newScore - The new score.
 * @returns The new game state after the current block has moved down.
 */
const moveCurrentBlockDown = (
  state: State,
  newBlocks: BlockPosition[],
  newScore: number
): State => {
  const movedCurrentBlock = moveBlockDown(state.currentBlock, state.oldBlocks);
  return {
    ...state,
    currentBlock: movedCurrentBlock,
    oldBlocks: newBlocks,
    score: newScore,
  };
};

const createGameRestarter =
  (isGameOver: boolean) =>
    (gameState: State): State => {
      return {
        ...initialState,
        highScore: Math.max(gameState.highScore, gameState.score),
        gameEnd: isGameOver,
      };
    };

const restartGameAfterGameOver = createGameRestarter(true);
const restartGameByUserAction = createGameRestarter(false);

/**
 * Creates a game action based on the given action logic.
 * This is essentially a wrapper for passing the current block and old blocks to the action logic.
 * @param action - The action to perform.
 * @returns The new game state after the action.
 */
const createGameAction = (
  action: (currentBlock: Block, oldBlocks: BlockPosition[]) => Block
) => {
  return (s: State): State => {
    const newBlock = action(s.currentBlock, s.oldBlocks);
    return newBlock ? { ...s, currentBlock: newBlock } : s;
  };
};

/**
 * Holds the current block and swaps it with the hold block (if any).
 * @param state - The current game state.
 * @returns The new game state after the hold action.
 */
const holdAction = (state: State): State => {
  // set the current block to the hold block and generate a new hold block
  const { newCurrentBlock, newHoldBlock } = holdCurrentBlock(
    state.currentBlock,
    state.holdBlock
  );
  // set the next block to the current block and generate a new next block
  const { newCurrentBlock: finalCurrentBlock, newNextBlock: newNextBlock } =
    setCurrentBlock(newCurrentBlock, state.nextBlock);
  return {
    ...state,
    currentBlock: finalCurrentBlock,
    nextBlock: newNextBlock,
    holdBlock: newHoldBlock,
  };
};

/**
 * The game actions that can be performed.
 */
export const gameActions: { [key in GameEvent]: (s: State) => State } = {
  Left: createGameAction(moveBlockLeft),
  Right: createGameAction(moveBlockRight),
  Down: createGameAction(moveBlockDown),
  RotateClockwise: createGameAction(rotateBlockClockwise),
  RotateAntiClockwise: createGameAction(rotateBlockAntiClockwise),
  Hold: holdAction,
  Tick: (s: State) => tick(s),
  Restart: (s: State) => restartGameByUserAction(s),
};
