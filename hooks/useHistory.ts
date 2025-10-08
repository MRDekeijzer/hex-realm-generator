/**
 * @file useHistory.ts
 * This file contains a custom React hook for managing state with undo/redo capabilities.
 */

import { useState, useCallback } from 'react';

/**
 * The internal state structure for the history hook.
 */
interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * A custom hook to manage state history (undo/redo functionality).
 * @param initialState The initial state value.
 * @returns An object containing the current state, a setter function,
 *          undo/redo functions, and booleans indicating if undo/redo is possible.
 */
export const useHistory = <T,>(initialState: T) => {
  const [state, setState] = useState<History<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  /**
   * Sets a new state, clearing the future (redo) history.
   */
  const set = useCallback((newState: T) => {
    setState(currentState => {
      const { present } = currentState;
      if (newState === present) {
        return currentState;
      }
      return {
        past: [...currentState.past, present],
        present: newState,
        future: [],
      };
    });
  }, []);

  /**
   * Moves the current state to the past, making the previous state the new present.
   */
  const undo = useCallback(() => {
    if (!canUndo) return;
    setState(currentState => {
      const { past, present, future } = currentState;
      const newPresent = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: newPresent,
        future: [present, ...future],
      };
    });
  }, [canUndo]);

  /**
   * Moves the current state to the past and takes the next state from the future.
   */
  const redo = useCallback(() => {
    if (!canRedo) return;
    setState(currentState => {
      const { past, present, future } = currentState;
      const newPresent = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, [canRedo]);

  return { state: state.present, set, undo, redo, canUndo, canRedo };
};
