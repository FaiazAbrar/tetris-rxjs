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

import { Block, BlockPosition, Event, State } from "./types";

/**
 * The initial state of the game.
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
 * @returns The new game state after the tick.
 */
export const tick = (state: State): State => {
  // Clear full rows and get the new blocks and score
  const { newBlocks, newScore } = clearFullRows(state.oldBlocks, state.score);

  // Check if the game is over (a block has reached the top)
  const gameOver = hasBlockReachedTop(newBlocks);

  // If the game is over, return the updated state with gameEnd set to true
  if (gameOver) {
    return restartGame(state);
  }

  // Check if the current block has reached the bottom or collided with another block
  const hasLanded = hasBlockLanded(state.currentBlock, newBlocks);

  // If the current block has landed, add it to oldBlocks and generate a new current block
  if (hasLanded) {
    return updateStateAfterLanding(state);
  } else {
    // If the current block hasn't landed, try to move it down
    return moveCurrentBlockDown(state, newBlocks, newScore);
  }
};

/** Utility functions to make tick function more readable. **/

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

/**
 * Restarts the game.
 * @param state - The current game state.
 * @returns The new game state after the game has restarted.
 */
const restartGame = (state: State): State => {
  return {
    ...initialState,
    highScore: Math.max(state.highScore, state.score),
    gameEnd: true,
  };
};

/**
 * Creates a game action based on the given action logic.
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
 * The game actions that can be performed.
 */
export const gameActions: { [key in Event]: (s: State) => State } = {
  Left: createGameAction(moveBlockLeft),
  Right: createGameAction(moveBlockRight),
  Down: createGameAction(moveBlockDown),
  RotateClockwise: createGameAction(rotateBlockClockwise),
  RotateAntiClockwise: createGameAction(rotateBlockAntiClockwise),
  Tick: (s: State) => tick(s),
  Hold: (s: State) => {
    const { newCurrentBlock, newHoldBlock } = holdCurrentBlock(
      s.currentBlock,
      s.holdBlock
    );
    const { newCurrentBlock: finalCurrentBlock, newNextBlock } =
      setCurrentBlock(newCurrentBlock, s.nextBlock);
    return {
      ...s,
      currentBlock: finalCurrentBlock,
      nextBlock: newNextBlock,
      holdBlock: newHoldBlock,
    };
  },
};
