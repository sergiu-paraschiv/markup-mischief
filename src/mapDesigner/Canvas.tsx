import React, { useMemo } from 'react';
import spriteAtlasData from '../sprite-atlas.json';
import useAnimation from '../engine/useAnimation';
import { Sprite, getNodePaths } from '../engine/spriteUtils';
import useCanvas from './useCanvas';


export default function Canvas({ canvas, hiddenLayers, tileSize, displayTileSize, onTileClick }: {
    canvas: ReturnType<typeof useCanvas>
    hiddenLayers: number[]
    tileSize: number
    displayTileSize: number
    onTileClick: (tile: { x: number, y: number }) => void
}) {
    const { layers } = canvas;

    return (
        <div
            style={{
                position: 'relative'
            }}
        >
            {layers.map((layer, layerIndex) => {
                if (hiddenLayers.indexOf(layerIndex) !== -1) {
                    return null;
                }

                return (
                    <div
                        key={layerIndex}
                        style={{
                            position: 'absolute',
                            top: '0',
                            left: '0'
                        }}
                    >
                        {layer.map((row, rowIndex) => (
                            <div
                                key={rowIndex}
                                style={{
                                    position: 'relative'
                                }}
                            >
                                {row.map((cell, cellIndex) => {
                                    return (
                                        <div
                                            key={cellIndex}
                                            onClick={() => {
                                                onTileClick({ x: cellIndex, y: rowIndex });
                                            }}
                                            style={{
                                                position: 'absolute',
                                                width: displayTileSize + 'px',
                                                height: displayTileSize + 'px',
                                                top: rowIndex * displayTileSize + 'px',
                                                left: cellIndex * displayTileSize + 'px',
                                                outline: '1px solid black'
                                            }}
                                        >
                                            <CellGraphics
                                                tileSize={tileSize} 
                                                displayTileSize={displayTileSize}
                                                cell={cell}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

function CellGraphics({ tileSize, displayTileSize, cell }: {
    tileSize: number
    displayTileSize: number
    cell: Sprite
}) {
    const paths = useMemo(() => getNodePaths(cell.path, spriteAtlasData.children), [cell.path]);
    const path = useAnimation(paths);

    return (
        <div
            style={{
                width: (tileSize * cell.w) + 'px',
                height: ( tileSize * cell.h) + 'px',
                scale: (displayTileSize / tileSize).toString(),
                transformOrigin: 'top left',
                backgroundImage: path ? `url('./${path}')` : undefined,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `${cell.x * tileSize}px ${cell.y * tileSize}px`
            }}
        ></div>
    );
}