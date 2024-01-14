import React from 'react';
import useCanvas from './useCanvas';


export default function Canvas({ canvas, tileSize, onTileClick }: {
    canvas: ReturnType<typeof useCanvas>
    tileSize: number
    onTileClick: (tile: { x: number, y: number }) => void
}) {
    const { layers } = canvas;

    return (
        <div
            style={{
                position: 'relative',
                scale: '2',
                transformOrigin: 'left top'
            }}
        >
            {layers.map((layer, layerIndex) => (
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
                                            width: tileSize + 'px',
                                            height: tileSize + 'px',
                                            top: rowIndex * tileSize + 'px',
                                            left: cellIndex * tileSize + 'px',
                                            outline: '1px solid black'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: tileSize + 'px',
                                                height: tileSize + 'px',
                                                backgroundImage: cell.path ? `url('./${cell.path}')` : undefined,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: `${cell.x * tileSize}px ${cell.y * tileSize}px`
                                            }}
                                        ></div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
