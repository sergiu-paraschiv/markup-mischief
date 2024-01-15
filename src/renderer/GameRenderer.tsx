import React from 'react';
import useGameEngine from '../engine/useGameEngine';
import { Layout } from '../engine/game/useGameBoard';
import { HeroAction, HeroPosition } from '../engine/game/useHero';
import ResponsiveContainer from '../utils/ResponsiveContainer';
import TileMap from './TileMap';
import Animation from './Animation';


export default function GameRenderer({ game }: {
    game: ReturnType<typeof useGameEngine>
}) {
    return (
        <ResponsiveContainer
            style={{
                width: '100%',
                height: '100%'
            }}
        >
            {(width, height) => (
                <GameBoard
                    width={width}
                    height={height}
                    layout={game.board.layout}
                    hero={game.board.hero}
                />
            )}
        </ResponsiveContainer>
    );
}

function GameBoard({ width, height, layout, hero }: {
    width: number
    height: number
    layout: Layout
    hero: {
        position: HeroPosition
        action: HeroAction
        pickedUpCell?: string
    }
}) {
    return (
        <div className="GameBoard">
            <TileMap
                width={width}
                height={height}
                cellBaseSize={64}
                layout={layout}
                entities={[
                    { key: 'hero', ...hero.position, element: (
                        <HeroAnimation action={hero.action} />
                    ), animateTransitions: 'all .1s ease-in-out' }
                ]}
            />
        </div>
    );
}

function HeroAnimation({ action }: {
    action: HeroAction
}) {
    if (action === 'run') {
        return (
            <Animation className="Hero" path="sprites/hero/crab/02-Run/Run $F" frames={6} />
        );
    }
    else if (action === 'jump') {
        return (
            <Animation className="Hero" path="sprites/hero/crab/03-Jump/Jump $F" frames={2} />
        );
    }
    else if (action === 'fall') {
        return (
            <Animation className="Hero" path="sprites/hero/crab/04-Fall/Fall $F" frames={1} />
        );
    }

    return (
        <Animation className="Hero" path="sprites/hero/crab/01-Idle/Idle $F" frames={9} />
    );
}
