import { useRef, useEffect } from 'react';
import useGameEngine from './useGameEngine';
import useInput from './useInput';


export default function useGame({ board, heroStart }: {
    board: string
    heroStart: {
        x: number
        y: number
    }
}) {
    const input = useInput();
    const gameEngine = useGameEngine(board, heroStart);
    const gameLoopRef = useRef<ReturnType<typeof setInterval>>();

    useEffect(() => {
        clearInterval(gameLoopRef.current);

        gameLoopRef.current = setInterval(() => {
            gameEngine.loop(input);
        }, 50);

        return () => {
            clearInterval(gameLoopRef.current);
        };
    }, [ input ]);

    return gameEngine;
}
