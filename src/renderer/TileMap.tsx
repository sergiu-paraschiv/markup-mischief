import React, { useMemo } from 'react';
import { Layout, GAP_CELL_CHAR, FLOOR_CELL_CHAR, EMBELISHMENT_CHARS, EmbelishmentChar, EMBELISHMENTS, EmbelishmentType } from '../engine/game/useGameBoard';
import Animation from './Animation';


type TimeMapCellType = 'wood-fg-nw' | 'wood-fg-n' | 'wood-fg-ne' | 'wood-fg-w' | 'wood-fg-e' | 'wood-fg-sw' | 'wood-fg-s' | 'wood-fg-se' | 'wood-fg-c'
type ConfigTileMapCell = [ 'border' | 'layout-width', TimeMapCellType ]
type ConfigTileMapRow = [ 'border' | 'layout-height', ConfigTileMapCell[] ]

type TileMapRow = TimeMapCellType[]

const CONFIG_TILE_MAP: ConfigTileMapRow[] = [
    [ 'border',             [['border', 'wood-fg-nw'],      ['layout-width', 'wood-fg-n'],      ['border', 'wood-fg-ne']]   ],
    [ 'layout-height',      [['border', 'wood-fg-w'],       ['layout-width', 'wood-fg-c'],      ['border', 'wood-fg-e']]    ],
    [ 'border',             [['border', 'wood-fg-sw'],      ['layout-width', 'wood-fg-s'],      ['border', 'wood-fg-se']]   ],
];

function makeActualTileMap(configTileMap: ConfigTileMapRow[], layout: Layout): {
    rows: TileMapRow[]
    width: number
    height: number
} {
    const tileMap: TileMapRow[] = [];

    for (const configRow of configTileMap) {

        const addRow = () => {
            const row: TileMapRow = [];

            for (const configCell of configRow[1]) {
                if (configCell[0] === 'border') {
                    row.push(configCell[1]);
                }
                else if (configCell[0] === 'layout-width') {
                    for (let i = 0; i < layout.width; i += 1) {
                        row.push(configCell[1]);
                    }
                }
            }

        
            tileMap.push(row);
        }

        if (configRow[0] === 'border') {
            addRow();
        }
        else if (configRow[0] === 'layout-height') {
            for (let j = 0; j < layout.height - 1; j += 1) {
                addRow();
            }
        }
    }

    return {
        rows: tileMap,
        width: tileMap[0].length,
        height: tileMap.length
    };
}

interface Entity {
    key: string
    x: number
    y: number
    element: React.ReactElement
    animateTransitions?: React.CSSProperties['transition']
}

export default function TileMap({ width, height, cellBaseSize, layout, entities }: {
    width: number
    height: number
    cellBaseSize: number
    layout: Layout
    entities: Entity[]
}) {
    const tileMap = useMemo(() => makeActualTileMap(CONFIG_TILE_MAP, layout), [ layout ]);
    const cellSize = Math.min(Math.floor(width / tileMap.width), Math.floor(height / tileMap.height));
    const scaledWidth = cellSize * tileMap.width;
    const scaledHeight = cellSize * tileMap.height;
    
    return (
        <div
            className="TileMap"
            style={{
                width: scaledWidth + 'px',
                height: scaledHeight + 'px'
            }}
        >
            {tileMap.rows.map((row, rowIndex) => {
                return (
                    <div key={rowIndex} className="TileMapRow">
                        {row.map((cell, cellIndex) => {
                            let hasBoard: false | 'wood-board-w' | 'wood-board-c' | 'wood-board-e' = false;
                            let hasEmbelishment: false | EmbelishmentType = false;

                            if (
                                rowIndex > 0
                                && cellIndex > 0
                                && cellIndex < tileMap.width - 1
                            ) {
                                const layoutCell = layout.rows[rowIndex - 1].cells[cellIndex - 1];

                                if (rowIndex < tileMap.height - 1) {
                                    if (layoutCell.endsWith(FLOOR_CELL_CHAR)) {
                                        const prevLayoutCell = layout.rows[rowIndex - 1].cells[cellIndex - 2];
                                        if (prevLayoutCell.endsWith(GAP_CELL_CHAR)) {
                                            hasBoard = 'wood-board-w';
                                        }
                                        else {
                                            const nextLayoutCell = layout.rows[rowIndex - 1].cells.length > cellIndex ? layout.rows[rowIndex - 1].cells[cellIndex] : '!';
                                            if (nextLayoutCell.endsWith(GAP_CELL_CHAR)) {
                                                hasBoard = 'wood-board-e';
                                            }
                                            else {
                                                hasBoard = 'wood-board-c';
                                            }
                                        }
                                    }
                                }

                                const cellEmbelishmentChar = layoutCell.slice(0, 1);
                                if (EMBELISHMENT_CHARS.indexOf(cellEmbelishmentChar as EmbelishmentChar) !== -1) {
                                    hasEmbelishment = EMBELISHMENTS[cellEmbelishmentChar as EmbelishmentChar];
                                }
                            }
    
                            return (
                                <div
                                    key={cellIndex}
                                    className="TileMapCell"
                                    style={{
                                        width: cellSize + 'px',
                                        height: cellSize + 'px'
                                    }}
                                >
                                    <div
                                        className={`TileMapCellBg ${cell}`}
                                        style={{
                                            scale: (cellSize * 100) / cellBaseSize + '%'
                                        }}
                                    ></div>

                                    {hasEmbelishment ? (
                                        <div
                                            className={`TileMapCellEmbelishment GameEntity ${hasEmbelishment}`}
                                            style={{
                                                scale: (cellSize * 100) / cellBaseSize + '%'
                                            }}
                                        >
                                            <Embelishment type={hasEmbelishment} />
                                        </div>
                                    ) : null}
    
                                    {hasBoard ? (
                                        <div
                                            className={`TileMapCellBg Board ${hasBoard}`}
                                            style={{
                                                scale: (cellSize * 100) / cellBaseSize + '%'
                                            }}
                                        ></div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {entities.map(entity => {
                return (
                    <div
                        key={entity.key}
                        className="GameEntity"
                        style={{
                            width: cellSize + 'px',
                            height: cellSize + 'px',
                            left: cellSize * (entity.x + 1) + 'px',
                            top: cellSize * (entity.y + 0.55) + 'px',
                            transition: entity.animateTransitions || 'none'
                        }}
                    >
                        {entity.element}
                    </div>
                );
            })}
        </div>
    );
}

function Embelishment({ type }: {
    type: EmbelishmentType
}) {
    if (type === 'window') {
        return (
            <>
            <Animation path="./sprites/decorations/Window Light/$F" frames={1} style={{
                top: '-20%',
                right: '35%'
            }} />
                <Animation path="./sprites/decorations/Window/$F" frames={74} />
            </>
        );
    }
    else if (type === 'chain') {
        return (
            <Animation path="./sprites/decorations/chains/Big/$F" frames={8} />
        );
    }
    else if (type === 'candle') {
        return (
            <>
                <Animation path="./sprites/decorations/Candle/$F" frames={6} />
                <Animation path="./sprites/decorations/Candle Light/$F" frames={4} style={{
                    top: '-70%',
                    right: '0%'
                }} />
            </>
        );
    }
    else if (type === 'barrel') {
        return (
            <Animation path="./sprites/decorations/barrel-1" frames={1} style={{
                top: '-25%',
                right: '0%'
            }} />
        );
    }

    return null
}
