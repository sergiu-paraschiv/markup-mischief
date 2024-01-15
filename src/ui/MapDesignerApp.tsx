import React, { useState } from 'react';
import { Layout, Flex, InputNumber, Button, Switch, List, Typography, Row, Col } from 'antd';
import { RedoOutlined, UndoOutlined } from '@ant-design/icons';
const { Content, Sider }  = Layout;
import SpriteAtlas from '../mapDesigner/SpriteAtlas';
import { Sprite } from '../engine/spriteUtils';
import Canvas from '../mapDesigner/Canvas';
import useCanvas from '../mapDesigner/useCanvas';
import useLayers from '../mapDesigner/useLayers';


export default function MapDesignerApp({ tileSize, displayTileSize }: {
    tileSize: number
    displayTileSize: number
}) {
    const [ sprite, setSprite ] = useState<Sprite | undefined>(undefined);
    const [ activeLayer, setActiveLayer ] = useState<number>(0);
    const canvas = useCanvas();
    const { layers, toggleLayer, hiddenLayers } = useLayers(canvas.numLayers);

    return (
        <Flex
            gap="middle"
            wrap="wrap"
            style={{
                height: '100%',
                background: '#f5f5f5'
            }}
        >
            <Layout
                style={{
                    height: '100%',
                    padding: '16px'
                }}
            >
                <Content
                    style={{
                        height: '100%'
                    }}
                >
                    <Canvas
                        canvas={canvas}
                        hiddenLayers={hiddenLayers}
                        tileSize={tileSize}
                        displayTileSize={displayTileSize}
                        onTileClick={tile => {
                            if (sprite) {
                                canvas.paintTile(activeLayer, tile, sprite)
                            }
                        }}
                    />
                </Content>
                
                <Sider
                    width="25%"
                    style={{
                        background: '#f5f5f5'
                    }}
                >
                    <List bordered itemLayout="vertical">
                        <List.Item>
                            <Button.Group>
                                <Button onClick={canvas.undo} disabled={!canvas.canUndo} type="dashed">
                                    <UndoOutlined /> Undo
                                </Button>
                                <Button onClick={canvas.redo} disabled={!canvas.canRedo} type="dashed">
                                    <RedoOutlined /> Redo
                                </Button>
                            </Button.Group>
                        </List.Item>
                        <List.Item>
                            <strong>Canvas size</strong>
                            <>
                                <Row align="middle" gutter={16}>
                                    <Col>
                                    <InputNumber
                                            min={1}
                                            max={100}
                                            value={canvas.width}
                                            onChange={newWidth => newWidth !== null ? canvas.setWidth(newWidth) : undefined}
                                        />
                                    </Col>
                                    <Col>
                                        x
                                    </Col>
                                    <Col>
                                        <InputNumber
                                            min={1}
                                            max={100}
                                            value={canvas.height}
                                            onChange={newHeight => newHeight !== null ? canvas.setHeight(newHeight) : undefined}
                                        />
                                    </Col>
                                    <Col>
                                        cells
                                    </Col>
                                </Row>
                            </>
                        </List.Item>
                    </List>
 
                    <div>
                        LAYERS: <InputNumber
                            min={1}
                            max={100}
                            value={canvas.numLayers}
                            onChange={newNumLayers => newNumLayers !== null ? canvas.setNumLayers(newNumLayers) : undefined}
                        />

                        <div>
                            {layers.map(layer => (
                                <div key={layer.index}>
                                    <Button
                                        onClick={() => setActiveLayer(layer.index)}
                                        type={activeLayer === layer.index ? 'primary' : 'default'}
                                    >
                                        Layer #{layer.index}
                                    </Button>

                                    <Switch
                                        checkedChildren="Visible"
                                        unCheckedChildren="Hidden"
                                        checked={layer.isVisible}
                                        onChange={() => toggleLayer(layer.index)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <SpriteAtlas
                        tileSize={tileSize}
                        displayTileSize={displayTileSize}
                        selectedSprite={sprite}
                        onSelect={setSprite}
                    />

                    {sprite ? (
                        <div>
                            W: <InputNumber
                                min={1}
                                max={6}
                                value={sprite.w}
                                onChange={newW => newW !== null ? setSprite({
                                    ...sprite,
                                    w: newW
                                }) : undefined}
                            />
                            H: <InputNumber
                                min={1}
                                max={6}
                                value={sprite.h}
                                onChange={newH => newH !== null ? setSprite({
                                    ...sprite,
                                    h: newH
                                }) : undefined}
                            />
                        </div>
                    ) : null}

                    <div>
                        <textarea
                            readOnly={true}
                            value={JSON.stringify(canvas)}
                            onPaste={event => {
                                event.preventDefault();

                                navigator.clipboard
                                    .readText()
                                    .then(clipText => {
                                        const newState = JSON.parse(clipText);
                                        canvas.load(newState);
                                    });
                            }}
                        ></textarea>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(canvas));
                            }}
                            type="primary"
                        >Copy</Button>
                    </div>
                </Sider>
            </Layout>
        </Flex>
    );
}
