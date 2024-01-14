import useGameBoard, { HeroMovement } from './game/useGameBoard';
import { HeroPosition } from './game/useHero';


export interface Input {
    moveUp: boolean
    moveDown: boolean
    moveLeft: boolean
    moveRight: boolean
    pickUpOrDrop: boolean
}

export default function useGameEngine(
    boardLayout: string,
    heroStart: HeroPosition
) {
    const board = useGameBoard(boardLayout, heroStart);

    const loop = (input: Input) => {
        const heroMovement: HeroMovement = { x: 0, y: 0 };

        if (input.moveLeft) {
            heroMovement.x -= 1;
        }

        if (input.moveRight) {
            heroMovement.x += 1;
        }

        if (input.moveUp) {
            heroMovement.y -= 1;
        }

        if (input.moveDown) {
            heroMovement.y += 1;
        }

        board.moveHero(heroMovement);
        // if (input.pickUpOrDrop) {
        //     board.pickUpOrDrop();
        // }
    };

    return {
        loop,
        board
    };
}
