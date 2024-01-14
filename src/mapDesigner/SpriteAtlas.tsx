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

export default function SpriteAtlas({ selectionSize, selectedSprite, onSelect }: {
    selectionSize: number
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
                        onSelect(undefined);
                    }
                }}
            />

            {selectedSprite ? (
                <SpriteSectionPicker
                    selectionSize={selectionSize}
                    selectedSprite={selectedSprite}
                    onSelect={onSelect}
                />
            ) : null}
        </div>
    );
}

function SpriteSectionPicker({ selectionSize, selectedSprite, onSelect }: {
    selectionSize: number
    selectedSprite: Sprite
    onSelect: (sprite: Sprite) => void
}) {
    const [ showPicker, setShowPicker ] = React.useState(false);

    return (
        <div>
            <SpriteViewer
                selectionSize={selectionSize}
                asThumbnail={true}
                onSelect={() => setShowPicker(true)}
                selectedSprite={selectedSprite}
                style={{
                    scale: '2',
                    transformOrigin: 'left top'
                }}
            />

            <Modal
                title={selectedSprite.path}
                open={showPicker}
                onCancel={() => setShowPicker(false)}
                width="80%"
                footer={null}
            >
                <SpriteViewer
                    selectionSize={selectionSize}
                    onSelect={sprite => {
                        onSelect(sprite);
                        setShowPicker(false);
                    }}
                    selectedSprite={selectedSprite}
                    style={{
                        scale: '2',
                        transformOrigin: 'left top'
                    }}
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

function SpriteViewer({ selectionSize, selectedSprite, onSelect, asThumbnail, style }: {
    selectionSize: number
    asThumbnail?: boolean
    selectedSprite: Sprite
    onSelect: (sprite: Sprite) => void
    style?: React.CSSProperties
}) {
    const src = `./${selectedSprite.path}`;
    const atlasSize = useImageSize(src);
    let viewSize = {
        width: Math.ceil(atlasSize.width / selectionSize),
        height: Math.ceil(atlasSize.height / selectionSize)
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
                width: viewSize.width * selectionSize + 'px',
                height: viewSize.height * selectionSize + 'px',
                backgroundImage: `url('${src}')`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: !asThumbnail ? '0 0' : `${selectedSprite.x * selectionSize}px ${selectedSprite.y * selectionSize}px`,
                ...style
            }}
        >
            {tiles.map((row, rowIndex) => (
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
                                onClick={() => onSelect({
                                    path: cell.path,
                                    x: -cell.x,
                                    y: -cell.y
                                })}
                                style={{
                                    position: 'absolute',
                                    width: selectionSize + 'px',
                                    height: selectionSize + 'px',
                                    top: rowIndex * selectionSize + 'px',
                                    left: cellIndex * selectionSize + 'px',
                                    outline: -rowIndex === selectedSprite.y && -cellIndex === selectedSprite.x ? '3px solid red' : '1px solid black',
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