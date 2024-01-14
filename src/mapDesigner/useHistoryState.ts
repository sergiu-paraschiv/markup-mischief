import { useReducer, useCallback } from 'react';


interface State<T> {
    past: T[]
    present: T
    future: T[]
}

function useHistoryStateReducer<T>(state: State<T>, action:
    { type: 'UNDO' }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'SET', newPresent: T }
    | { type: 'CLEAR', initialPresent: T }
): State<T> {
    const { past, present, future } = state;

    if (action.type === 'UNDO') {
        return {
            past: past.slice(0, past.length - 1),
            present: past[past.length - 1],
            future: [present, ...future],
        };
    }
    else if (action.type === 'REDO') {
        return {
            past: [...past, present],
            present: future[0],
            future: future.slice(1),
        };
    }
    else if (action.type === 'SET') {
        const { newPresent } = action;

        if (action.newPresent === present) {
            return state;
        }

        return {
            past: [...past, present],
            present: newPresent,
            future: [],
        };
    }
    else if (action.type === 'CLEAR') {
        return {
            past: [],
            future: [],
            present: action.initialPresent
        };
    }
    else {
        throw new Error('Unsupported action type');
    }
}

export default function useHistoryState<T>(initialPresent: T) {
    const [state, dispatch] = useReducer(useHistoryStateReducer<T>, {
        past: [],
        future: [],
        present: initialPresent
    });

    const canUndo = state.past.length !== 0;
    const canRedo = state.future.length !== 0;

    const undo = useCallback(() => {
        if (canUndo) {
            dispatch({ type: 'UNDO' });
        }
    }, [canUndo]);

    const redo = useCallback(() => {
        if (canRedo) {
            dispatch({ type: 'REDO' });
        }
    }, [canRedo]);

    const set = useCallback(
        (newPresent: T) => dispatch({ type: 'SET', newPresent }),
        []
    );

    const clear = useCallback(
        (newPresent: T) => dispatch({ type: 'CLEAR', initialPresent: newPresent }),
        []
    );

    return { state: state.present, set, undo, redo, clear, canUndo, canRedo };
}