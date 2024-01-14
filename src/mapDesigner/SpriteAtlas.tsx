import React, { useState, useMemo, useEffect } from 'react';
import { Tree, Modal } from 'antd';
import type { TreeDataNode } from 'antd';
import spriteAtlasData from '../sprite-atlas.json';
import { Sprite, makeSpriteMap } from './spriteUtils';

interface SpriteAtlasDataNode {
    path: string
    name: string
    children?: SpriteAtlasDataNode[]
}

function generateData(nodes: SpriteAtlasDataNode[]): TreeDataNode[] {
    return nodes.map(node => {
        return {
            key: node.path,
            title: node.name,
            children: node.children ? generateData(node.children) : undefined
        };
    })
}

const treeData: TreeDataNode[] = generateData(spriteAtlasData.children);

export default function SpriteAtlas({ tileSize, displayTileSize, selectedSprite, onSelect }: {
    tileSize: number
    displayTileSize: number
    selectedSprite?: Sprite
    onSelect: (sprite?: Sprite) => void
}) {
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

    const onExpand = (newExpandedKeys: React.Key[]) => {
        setExpandedKeys(newExpandedKeys);
    };

    return (
        <div>
            <Tree
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                treeData={treeData}
                selectable={true}
                selectedKeys={selectedSprite && selectedSprite.path ? [selectedSprite.path] : []}
                onSelect={newSelectedKeys => {
                    if (newSelectedKeys.length === 0) {
                        onSelect(undefined);
                        return;
                    }
    
                    const newSelectedKey = newSelectedKeys[0] as string;
                    if (newSelectedKey.endsWith('.png')) {
                        onSelect({
                            path: newSelectedKey,
                            x: 0,
                            y: 0
                        });
                    }
                    else {
                        if (expandedKeys.indexOf(newSelectedKey) === -1) {
                            setExpandedKeys([...expandedKeys, newSelectedKey]);
                        }
                        else {
                            setExpandedKeys([...expandedKeys.filter(item => item !== newSelectedKey)]);
                        }
                        onSelect(undefined);
                    }
                }}
            />

            {selectedSprite ? (
                <SpriteSectionPicker
                    tileSize={tileSize}
                    displayTileSize={displayTileSize}
                    selectedSprite={selectedSprite}
                    onSelect={onSelect}
                />
            ) : null}
        </div>
    );
}

function SpriteSectionPicker({ tileSize, displayTileSize, selectedSprite, onSelect }: {
    tileSize: number
    displayTileSize: number
    selectedSprite: Sprite
    onSelect: (sprite: Sprite) => void
}) {
    const [ showPicker, setShowPicker ] = React.useState(false);

    return (
        <div>
            <SpriteViewer
                tileSize={tileSize}
                displayTileSize={displayTileSize}
                asThumbnail={true}
                onSelect={() => setShowPicker(true)}
                selectedSprite={selectedSprite}
            />

            <Modal
                title={selectedSprite.path}
                open={showPicker}
                onCancel={() => setShowPicker(false)}
                width="80%"
                footer={null}
            >
                <SpriteViewer
                    tileSize={tileSize}
                    displayTileSize={displayTileSize}
                    onSelect={sprite => {
                        onSelect(sprite);
                        setShowPicker(false);
                    }}
                    selectedSprite={selectedSprite}
                />
            </Modal>
        </div>
    );
}

function useImageSize(src: string) {
    const [ size, setSize ] = React.useState<{ width: number, height: number}>({ width: 0, height: 0});

    useEffect(() => {
        const img = document.createElement('img');
        img.onload = () => {
            setSize({ width: img.width, height: img.height });
        };

        img.src = src;
    }, [ src ]);

    return size;
}

function SpriteViewer({ tileSize, displayTileSize, selectedSprite, onSelect, asThumbnail, style }: {
    tileSize: number
    displayTileSize: number
    asThumbnail?: boolean
    selectedSprite: Sprite
    onSelect: (sprite: Sprite) => void
    style?: React.CSSProperties
}) {
    const src = `./${selectedSprite.path}`;
    const atlasSize = useImageSize(src);
    let viewSize = {
        width: Math.ceil(atlasSize.width / tileSize),
        height: Math.ceil(atlasSize.height / tileSize)
    };

    if (asThumbnail) {
        viewSize = {
            width: 1,
            height: 1
        };
    }

    const tiles = makeSpriteMap(selectedSprite.path, viewSize.width, viewSize.height);

    return (
        <div
            style={{
                position: 'relative',
                width: viewSize.width * displayTileSize + 'px',
                height: viewSize.height * displayTileSize + 'px',
                ...style
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '50%',
                    height: '50%',
                    scale: (displayTileSize / tileSize).toString(),
                    transformOrigin: 'top left',
                    backgroundImage: `url('${src}')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: !asThumbnail ? '0 0' : `${selectedSprite.x * tileSize}px ${selectedSprite.y * tileSize}px`,
                }}
            ></div>
            {tiles.map((row, rowIndex) => (
                <div
                    key={rowIndex}
                    style={{
                        position: 'relative'
                    }}
                >
                    {row.map((cell, cellIndex) => {
                        const isSelected = -rowIndex === selectedSprite.y && -cellIndex === selectedSprite.x;
                        return (
                            <div
                                key={cellIndex}
                                onClick={() => onSelect({
                                    path: cell.path,
                                    x: -cell.x,
                                    y: -cell.y
                                })}
                                style={{
                                    position: 'absolute',
                                    width: displayTileSize + 'px',
                                    height: displayTileSize + 'px',
                                    top: rowIndex * displayTileSize + 'px',
                                    left: cellIndex * displayTileSize + 'px',
                                    outline: isSelected ? '3px solid red' : '1px solid black',
                                    zIndex: isSelected ? '2': '1',
                                    cursor: 'pointer'
                                }}
                            ></div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
