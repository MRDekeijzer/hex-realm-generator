/**
 * @file useHistory.ts
 * This file contains a custom React hook for managing state with undo/redo capabilities.
 */

import { useState, useCallback, useRef } from 'react';

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

const MAX_HISTORY_LENGTH = 100;

export const useHistory = <T>(initialState: T) => {
  const [state, setState] = useState<History<T>>({
    past: [],
    present: initialState,
    future: [],
  });
  const hasHydratedRef = useRef(false);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  /**
   * Sets a new state, clearing the future (redo) history.
   */
  const set = useCallback((newState: T) => {
    setState((currentState) => {
      const { present } = currentState;
      if (newState === present) {
        return currentState;
      }
      if (!hasHydratedRef.current) {
        hasHydratedRef.current = true;
        return {
          past: [],
          present: newState,
          future: [],
        };
      }

      const maxPastEntries = Math.max(MAX_HISTORY_LENGTH - 1, 0);
      const retainedPast = maxPastEntries > 0 ? currentState.past.slice(-maxPastEntries) : [];
      const trimmedPast = [...retainedPast, present];

      return {
        past: trimmedPast,
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
    setState((currentState) => {
      const { past, present, future } = currentState;
      const newPresent = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      if (newPresent === undefined) return currentState;
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
    setState((currentState) => {
      const { past, present, future } = currentState;
      const newPresent = future[0];
      const newFuture = future.slice(1);
      if (newPresent === undefined) return currentState;
      return {
        past: [...past, present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, [canRedo]);

  return { state: state.present, set, undo, redo, canUndo, canRedo };
};
