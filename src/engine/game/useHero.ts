import { useState } from 'react';


export type HeroPosition = { x: number, y: number }
export type HeroAction = 'idle' | 'jump' | 'run' | 'fall'

export default function useHero(initialPosition: HeroPosition) {
    const [ position, moveTo ] = useState<HeroPosition>(initialPosition);
    const [ action, setAction ] = useState<HeroAction>('idle');
    const [ pickedUpCell, setPickedUpCell ] = useState<string | undefined>();

    const pickUp = (cell: string) => {
        if (pickedUpCell) {
            return;
        }

        setPickedUpCell(cell);
    }

    const drop = (): string | undefined => {
        if (!pickedUpCell) {
            return;
        }

        setPickedUpCell(undefined);
        return pickedUpCell;
    }

    return {
        position,
        moveTo,
        pickedUpCell,
        pickUp,
        drop,
        action,
        setAction
    };
}
