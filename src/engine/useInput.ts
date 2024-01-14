import useKeyPress from './useKeyPress';
import { Input } from './useGameEngine';


export default function useInput(): Input {
    const upIsPressed = useKeyPress('ArrowUp');
    const downIsPressed = useKeyPress('ArrowDown');
    const leftIsPressed = useKeyPress('ArrowLeft');
    const rightIsPressed = useKeyPress('ArrowRight');
    const spaceIsPressed = useKeyPress(' ');

    return {
        moveUp: upIsPressed,
        moveDown: downIsPressed,
        moveLeft: leftIsPressed,
        moveRight: rightIsPressed,
        pickUpOrDrop: spaceIsPressed
    };
}
