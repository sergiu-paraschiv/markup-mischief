import React, { useState } from 'react';
import { Layout, Flex, InputNumber, Button } from 'antd';
const { Content, Sider }  = Layout;
import SpriteAtlas from '../mapDesigner/SpriteAtlas';
import { Sprite } from '../mapDesigner/spriteUtils';
import Canvas from '../mapDesigner/Canvas';
import useCanvas from '../mapDesigner/useCanvas';


export default function MapDesignerApp({ tileSize, displayTileSize }: {
    tileSize: number
    displayTileSize: number
}) {
    const [ sprite, setSprite ] = useState<Sprite | undefined>(undefined);
    const [ activeLayer, setActiveLayer ] = useState<number>(0);
    const canvas = useCanvas();

    const layerButtons: number[] = [];
    for (let i = 0; i < canvas.numLayers; i += 1) {
        layerButtons.push(i);
    }

    return (
        <Flex
            gap="middle"
            wrap="wrap"
            style={{
                height: '100%'
            }}
        >
            <Layout style={{
                height: '100%'
            }}>
                <Content
                    style={{
                        height: '100%'
                    }}
                >
                    <Canvas
                        canvas={canvas}
                        tileSize={tileSize}
                        displayTileSize={displayTileSize}
                        onTileClick={tile => {
                            if (sprite) {
                                canvas.paintTile(activeLayer, tile, sprite)
                            }
                        }}
                    />
                </Content>
                
                <Sider width="25%">
                    <div>
                        <Button onClick={canvas.undo} disabled={!canvas.canUndo}>Undo</Button>
                        <Button onClick={canvas.redo} disabled={!canvas.canRedo}>Redo</Button>
                    </div>

                    <div>
                        W: <InputNumber
                            min={1}
                            max={100}
                            value={canvas.width}
                            onChange={newWidth => newWidth !== null ? canvas.setWidth(newWidth) : undefined}
                        />
                        H: <InputNumber
                            min={1}
                            max={100}
                            value={canvas.height}
                            onChange={newHeight => newHeight !== null ? canvas.setHeight(newHeight) : undefined}
                        />
                    </div>
 
                    <div>
                        LAYERS: <InputNumber
                            min={1}
                            max={100}
                            value={canvas.numLayers}
                            onChange={newNumLayers => newNumLayers !== null ? canvas.setNumLayers(newNumLayers) : undefined}
                        />

                        <div>
                            {layerButtons.map(layerButton => (
                                <Button
                                    key={layerButton}
                                    onClick={() => setActiveLayer(layerButton)}
                                >
                                    Layer #{layerButton}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <SpriteAtlas
                        tileSize={tileSize}
                        displayTileSize={displayTileSize}
                        selectedSprite={sprite}
                        onSelect={setSprite}
                    />
                </Sider>
            </Layout>
        </Flex>
    );
}
