import React, { useMemo } from 'react';
import spriteAtlasData from '../sprite-atlas.json';
import useAnimation from '../engine/useAnimation';
import { Sprite, getNodePaths } from '../engine/spriteUtils';
import useCanvas from './useCanvas';


export default function Canvas({
    canvas,
    hiddenLayers,
    activeLayer,
    showGrid,
    showSpriteOutlines,
    tileSize,
    displayTileSize,
    onTileClick
}: {
    canvas: ReturnType<typeof useCanvas>
    hiddenLayers: string[]
    activeLayer?: string
    showGrid: boolean
    showSpriteOutlines: boolean
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
                if (hiddenLayers.indexOf(layer.key) !== -1) {
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
                        {layer.rows.map((row, rowIndex) => (
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
                                                outline: showGrid ? '1px solid black' : 'none'
                                            }}
                                        >
                                            <CellGraphics
                                                tileSize={tileSize} 
                                                displayTileSize={displayTileSize}
                                                cell={cell}
                                                showOutline={showSpriteOutlines && layer.key === activeLayer}
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

function CellGraphics({ tileSize, displayTileSize, cell, showOutline }: {
    tileSize: number
    displayTileSize: number
    cell: Sprite
    showOutline: boolean
}) {
    const paths = useMemo(() => getNodePaths(cell.path, spriteAtlasData.children), [cell.path]);
    const path = useAnimation(paths);

    return (
        <div
            style={{
                width: (tileSize * cell.w) + 'px',
                height: (tileSize * cell.h) + 'px',
                marginTop: cell.offset ? cell.offset.v : 0 + 'px',
                marginLeft: cell.offset ? cell.offset.h : 0 + 'px',
                scale: (displayTileSize / tileSize).toString(),
                transformOrigin: 'top left',
                backgroundImage: path ? `url('${window.MarkupMischief.spritesRelativePath}${path}')` : undefined,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `${cell.x * tileSize}px ${cell.y * tileSize}px`,
                outline: path && showOutline ? '1px solid red' : 'none'
            }}
        ></div>
    );
}