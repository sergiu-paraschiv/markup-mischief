import React, { useState, useMemo, useEffect } from 'react';
import {
    TreeSelect,
    Modal,
    TreeDataNode,
    Card,
    Flex,
    Row,
    Col,
    InputNumber
} from 'antd';
import spriteAtlasData from '../sprite-atlas.json';
import { Sprite, makeSpriteMap, processAtlas, getNodePaths } from '../engine/spriteUtils';
import useAnimation from '../engine/useAnimation';
import ResponsiveContainer from '../utils/ResponsiveContainer';


const treeData = processAtlas(spriteAtlasData.children);

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
        <Flex vertical={true} gap="small">
            <TreeSelect
                onTreeExpand={onExpand}
                treeExpandedKeys={expandedKeys}
                treeData={treeData}
                value={selectedSprite?.path}
                onSelect={path => {
                    if (
                        path.endsWith('.png')
                        || path.endsWith('.gif')
                        || path.startsWith('ANIMATION:')
                    ) {
                        onSelect({
                            path,
                            x: 0,
                            y: 0,
                            w: 1,
                            h: 1
                        });
                    }
                    else {
                        if (expandedKeys.indexOf(path) === -1) {
                            setExpandedKeys([...expandedKeys, path]);
                        }
                        else {
                            setExpandedKeys([...expandedKeys.filter(item => item !== path)]);
                        }
                        onSelect(undefined);
                    }
                }}
                onSearch={search => {
                    let keysToExpand: React.Key[] = [];
                    const mapChildren = (nodes: TreeDataNode[], parentKeys: React.Key[]) => {
                        for (const node of nodes) {
                            if ((node.title?.toString() || '').toLowerCase().indexOf(search.toLowerCase()) > -1) {
                                keysToExpand = [ ...keysToExpand, ...parentKeys];
                            }

                            if (node.children) {
                                mapChildren(node.children, [ ...parentKeys, node.key ]);
                            }
                        }
                    };

                    mapChildren(treeData, []);

                    setExpandedKeys(keysToExpand);
                }}
                treeLine={true}
                treeExpandAction="click"
                showSearch={true}
                placeholder="Sprite"
                style={{
                    width: '100%'
                }}
            />

            {selectedSprite ? (
                <>
                    <Row align="middle" gutter={16}>
                        <Col>
                            <InputNumber
                                min={1}
                                max={6}
                                value={selectedSprite.w}
                                onChange={newW => newW !== null ? onSelect({
                                    ...selectedSprite,
                                    w: newW
                                }) : undefined}
                            />
                        </Col>
                        <Col>
                            x
                        </Col>
                        <Col>
                            <InputNumber
                                min={1}
                                max={6}
                                value={selectedSprite.h}
                                onChange={newH => newH !== null ? onSelect({
                                    ...selectedSprite,
                                    h: newH
                                }) : undefined}
                            />
                        </Col>
                        <Col>
                            cells
                        </Col>
                    </Row>

                    <Card size="small">
                        <SpriteSectionPicker
                            tileSize={tileSize}
                            displayTileSize={displayTileSize}
                            selectedSprite={selectedSprite}
                            onSelect={onSelect}
                        />
                    </Card>
                </>
            ) : null}
        </Flex>
    );
}

function SpriteSectionPicker({ tileSize, displayTileSize, selectedSprite, onSelect }: {
    tileSize: number
    displayTileSize: number
    selectedSprite: Sprite
    onSelect: (sprite: Sprite) => void
}) {
    const [ showPicker, setShowPicker ] = React.useState(false);
    const atlasSize = useImageSize(selectedSprite.path ? `${window.MarkupMischief.spritesRelativePath}${selectedSprite.path.replace('ANIMATION:', '')}` : undefined);

    return (
        <div>
            <SpriteViewer
                tileSize={tileSize}
                displayTileSize={displayTileSize}
                asThumbnail={{
                    w: selectedSprite.w,
                    h: selectedSprite.h
                }}
                onSelect={() => setShowPicker(true)}
                selectedSprite={selectedSprite}
            />

            <Modal
                title={selectedSprite.path}
                open={showPicker}
                onCancel={() => setShowPicker(false)}
                width="80%"
                style={{
                    height: '80%'
                }}
                footer={null}
            >
                <ResponsiveContainer
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                >
                    {(width, height) => {
                        const tiles = {
                            w: atlasSize.width / tileSize,
                            h: atlasSize.height / tileSize
                        };

                        const realDisplayTileSize = Math.min(displayTileSize, Math.min(width / tiles.w, height / tiles.h));

                        return (
                            <SpriteViewer
                                tileSize={tileSize}
                                displayTileSize={realDisplayTileSize}
                                onSelect={sprite => {
                                    onSelect(sprite);
                                    setShowPicker(false);
                                }}
                                selectedSprite={selectedSprite}
                            />
                        );
                    }}
                </ResponsiveContainer>
                
            </Modal>
        </div>
    );
}

function useImageSize(src?: string) {
    const [ size, setSize ] = React.useState<{ width: number, height: number}>({ width: 0, height: 0});

    useEffect(() => {
        if (!src) {
            return;
        }

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
    asThumbnail?: {
        w: number
        h: number
    }
    selectedSprite: Sprite
    onSelect: (sprite: Sprite) => void
    style?: React.CSSProperties
}) {
    const paths = useMemo(() => getNodePaths(selectedSprite.path, spriteAtlasData.children), [selectedSprite.path]);
    const path = useAnimation(paths);
    const atlasSize = useImageSize(path ? `${window.MarkupMischief.spritesRelativePath}${path}` : undefined);
    let viewSize = {
        width: Math.ceil(atlasSize.width / tileSize),
        height: Math.ceil(atlasSize.height / tileSize)
    };

    if (asThumbnail !== undefined) {
        viewSize = {
            width: asThumbnail.w,
            height: asThumbnail.h
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
                    width: viewSize.width * tileSize + 'px',
                    height: viewSize.height * tileSize + 'px',
                    scale: (displayTileSize / tileSize).toString(),
                    transformOrigin: 'top left',
                    backgroundImage: path ? `url('${window.MarkupMischief.spritesRelativePath}${path}')` : undefined,
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
                                    y: -cell.y,
                                    w: 1,
                                    h: 1
                                })}
                                style={{
                                    position: 'absolute',
                                    width: displayTileSize + 'px',
                                    height: displayTileSize + 'px',
                                    top: rowIndex * displayTileSize + 'px',
                                    left: cellIndex * displayTileSize + 'px',
                                    outline: isSelected && !asThumbnail ? '3px solid red' : '1px solid black',
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
