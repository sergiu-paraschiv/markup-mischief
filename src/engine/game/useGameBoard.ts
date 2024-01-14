import { useMemo } from 'react';
import useHero, { HeroPosition, HeroAction } from './useHero';

export const FLOOR_CELL_CHAR = '_';
export const GAP_CELL_CHAR = ' ';
export const EMBELISHMENT_CHARS = ['o', 'b', 'i', 'c'] as const;
export type EmbelishmentChar = typeof EMBELISHMENT_CHARS[number]
const EMBELISHMENT_TYPES = ['window', 'barrel', 'candle', 'chain'] as const;
export type EmbelishmentType = typeof EMBELISHMENT_TYPES[number]
export const EMBELISHMENTS: {
    [key in EmbelishmentChar]: EmbelishmentType
} = {
    'o': 'window',
    'b': 'barrel',
    'i': 'candle',
    'c': 'chain'
};

interface Row {
    cells: string[]
}

export interface Layout {
    rows: Row[]
    width: number
    height: number
}

export interface HeroMovement {
    x: -1 | 0 | 1
    y: -1 | 0 | 1
}

function layoutFromString(input: string): Layout {
    const layout: Layout = {
        rows: [],
        width: 0,
        height: 0
    };

    const rows = input.trim().split('\n');
    layout.height = rows.length;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const rowChars = rows[rowIndex];
        let cellChars = rowChars.trim().slice(2, -2);

        const cells = cellChars.split(/(?=(?:..)*$)/);
        layout.width = cells.length;

        layout.rows.push({
            cells
        });
    }

    return layout;
}

export default function useGameBoard(
    boardLayout: string,
    heroStart: HeroPosition
) {
    const layout = useMemo(() => layoutFromString(boardLayout), [ boardLayout ]);
    const hero = useHero(heroStart);

    const getCellAt = (position: HeroPosition) => {
        return layout.rows[position.y].cells[position.x];
    }

    // const setCellAt = (position: HeroPosition, cell: MovableCell | FloorCell) => {
    //     layout.rows[position.y].cells[position.x] = cell;
    // }

    const moveHero = (movement: HeroMovement) => {
        const validMovement: HeroMovement = { ...movement };
        const cellAtHero = getCellAt(hero.position);
        let heroAction: HeroAction = 'idle';

        if (hero.position.x + validMovement.x < 0) {
            validMovement.x = 0;
        }
        else if (hero.position.x + validMovement.x > layout.width - 1) {
            validMovement.x = 0;
        }

        if (cellAtHero === '  ') {
            validMovement.y = 0;
        }
        else if (hero.position.y + validMovement.y < 0) {
            validMovement.y = 0;
        }
        else if (hero.position.y + validMovement.y > layout.height - 1) {
            validMovement.y = 0;
        }

        if (validMovement.y === -1) {
            heroAction = 'jump';
        }
        else if (validMovement.y === 1) {
            heroAction = 'fall';
        }
        else if (validMovement.x !== 0) {
            heroAction = 'run';
        }

        const newHeroPosition: HeroPosition = {
            x: hero.position.x + validMovement.x,
            y: hero.position.y + validMovement.y
        };

        const cellHeroMovesTo = getCellAt(newHeroPosition);
        if (
            cellHeroMovesTo.endsWith(' ')
            && validMovement.y <= 0
            && newHeroPosition.y + 1 <= layout.height
        ) {
            newHeroPosition.y += 1;
            heroAction = 'fall';
        }

        hero.moveTo(newHeroPosition);
        hero.setAction(heroAction);
    }

    // const pickUpOrDrop = () => {
    //     if (hero.pickedUpCell) {
    //         const cellAtHero = getCellAt(hero.position);
    //         if (cellAtHero !== FLOOR_CELL) {
    //             return;
    //         }
            
    //         const droppedCell = hero.drop() as MovableCell;

    //         if (droppedCell) {
    //             if (BLOCK_CELL_TYPES.indexOf(droppedCell) === -1) {
    //                 return;
    //             }

    //             setCellAt(hero.position, droppedCell);
    //         }
    //     }
    //     else {
    //         const cellToPickUp = getCellAt(hero.position) as MovableCell;
    //         if (BLOCK_CELL_TYPES.indexOf(cellToPickUp) === -1) {
    //             return;
    //         }
    //         hero.pickUp(cellToPickUp);
    //         setCellAt(hero.position, FLOOR_CELL);
    //     }
    // };

    return {
        layout,
        hero,
        moveHero,
        // pickUpOrDrop
    };
}
