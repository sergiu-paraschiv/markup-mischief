import React, { useState } from 'react';
import {
    Layout,
    Flex,
    InputNumber,
    Button,
    Switch,
    List,
    Card,
    Row,
    Col,
    Input,
    Tag,
    Segmented
} from 'antd';
import {
    RedoOutlined,
    UndoOutlined,
    PlusOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    DeleteOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    InfoCircleOutlined,
    SelectOutlined,
    FormatPainterOutlined,
    ClearOutlined
} from '@ant-design/icons';
const { Content, Sider } = Layout;
import SpriteAtlas from '../mapDesigner/SpriteAtlas';
import { Sprite } from '../engine/spriteUtils';
import Canvas from '../mapDesigner/Canvas';
import useCanvas from '../mapDesigner/useCanvas';
import useLayers from '../mapDesigner/useLayers';


type Tool = 'select' | 'paint' | 'erase'

export default function MapDesignerApp({ tileSize, displayTileSize }: {
    tileSize: number;
    displayTileSize: number;
}) {
    const [ selectedTool, setSelectedTool ] = useState<Tool>('paint');
    const [ sprite, setSprite ] = useState<Sprite | undefined>(undefined);
    const canvas = useCanvas();
    const { layers, toggleLayer, hiddenLayers, activeLayer, setActiveLayer } = useLayers(canvas.layers);

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
                            if (!activeLayer) {
                                return;
                            }

                            if (selectedTool === 'select') {
                                const selectedSprite = canvas.get(activeLayer, tile);
                                if (selectedSprite) {
                                    setSprite(selectedSprite);
                                }
                            }
                            else if (selectedTool === 'paint' && sprite) {
                                canvas.paintTile(activeLayer, tile, sprite);
                            }
                            else if (selectedTool === 'erase') {
                                canvas.eraseTile(activeLayer, tile);
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
                            <Segmented
                                value={selectedTool}
                                onChange={newTool => setSelectedTool(newTool.toString() as Tool)}
                                options={[
                                    { label: 'Select', value: 'select', icon: <SelectOutlined /> },
                                    { label: 'Paint', value: 'paint', icon: <FormatPainterOutlined /> },
                                    { label: 'Erase', value: 'erase', icon: <ClearOutlined /> }
                                ]}
                            />
                        </List.Item>

                        <List.Item>
                            <strong>Canvas size</strong>
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
                        </List.Item>

                        <List.Item>
                            <Card title="Layers" size="small" extra={(
                                <Button
                                    size="small"
                                    type="default"
                                    onClick={canvas.addLayer}
                                >
                                    <PlusOutlined /> Add
                                </Button>
                            )}>
                                <List size="small">
                                    {layers.map(layer => (
                                        <List.Item
                                            key={layer.index}
                                            style={{
                                                padding: '2px 6px',
                                                backgroundColor: activeLayer === layer.key ? '#fbec11' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setActiveLayer(layer.key)}
                                        >
                                            <Flex
                                                align="center"
                                                justify="space-between"
                                                gap="small"
                                                style={{
                                                    width: '100%'
                                                }}
                                            >
                                                <Switch
                                                    checkedChildren={(<EyeOutlined />)}
                                                    unCheckedChildren={(<EyeInvisibleOutlined />)}
                                                    checked={layer.isVisible}
                                                    onChange={() => toggleLayer(layer.key)}
                                                    size="small"
                                                />

                                                <Input
                                                    value={layer.name}
                                                    onChange={event => canvas.setLayerName(layer.key, event.currentTarget.value)}
                                                    minLength={1}
                                                    size="small"
                                                    style={{
                                                        width: '60%'
                                                    }}
                                                />

                                                <Button.Group>
                                                    <Button
                                                        type="dashed"
                                                        size="small"
                                                        onClick={() => canvas.moveLayerUp(layer.key)}
                                                        disabled={layer.index === 0}
                                                    >
                                                        <ArrowUpOutlined />
                                                    </Button>
                                                    <Button
                                                        type="dashed"
                                                        size="small"
                                                        onClick={() => canvas.moveLayerDown(layer.key)}
                                                        disabled={layer.index === layers.length - 1}
                                                    >
                                                        <ArrowDownOutlined />
                                                    </Button>
                                                    <Button
                                                        type="dashed"
                                                        size="small"
                                                        onClick={() => canvas.removeLayer(layer.key)}
                                                    >
                                                        <DeleteOutlined />
                                                    </Button>
                                                </Button.Group>
                                            </Flex>
                                        </List.Item>
                                    ))}
                                </List>
                            </Card>
                        </List.Item>

                        <List.Item>
                            <Flex vertical={true} gap="small">
                                <SpriteAtlas
                                    tileSize={tileSize}
                                    displayTileSize={displayTileSize}
                                    selectedSprite={sprite}
                                    onSelect={setSprite}
                                />

                                {sprite ? (
                                    <Row align="middle" gutter={16}>
                                        <Col>
                                            <InputNumber
                                                min={1}
                                                max={6}
                                                value={sprite.w}
                                                onChange={newW => newW !== null ? setSprite({
                                                    ...sprite,
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
                                                value={sprite.h}
                                                onChange={newH => newH !== null ? setSprite({
                                                    ...sprite,
                                                    h: newH
                                                }) : undefined}
                                            />
                                        </Col>
                                        <Col>
                                            cells
                                        </Col>
                                    </Row>
                                ) : null}
                            </Flex>
                        </List.Item>

                        <List.Item>
                            <Flex vertical={true} gap="small">
                                <Input.TextArea
                                    readOnly={true}
                                    value={JSON.stringify(canvas)}
                                    onPaste={event => {
                                        event.preventDefault();

                                        const clipText = event.clipboardData.getData('Text');
                                        const newState = JSON.parse(clipText);
                                        canvas.load(newState);
                                    }}
                                    rows={2}
                                />

                                <Tag><InfoCircleOutlined /> Paste data to load</Tag>
                                
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(canvas));
                                    }}
                                    type="default"
                                >
                                    Copy data to clipboard
                                </Button>
                            </Flex>
                        </List.Item>
                    </List>
                </Sider>
            </Layout>
        </Flex>
    );
}
