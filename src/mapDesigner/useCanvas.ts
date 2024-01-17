import { useEffect } from 'react';
import { Sprite, makeSpriteMap, getNode } from '../engine/spriteUtils';
import useHistoryState from './useHistoryState';


type LayersList = {
    key: string;
    name: string;
    rows: Sprite[][];
}[];

function makeLayers(numLayers: number, width: number, height: number): LayersList {
    const layers: LayersList = [];

    for (let i = 0; i < numLayers; i += 1) {
        layers[i] = {
            key: i.toString(),
            name: `Layer #${i + 1}`,
            rows: makeSpriteMap(undefined, width, height)
        };
    }

    return layers;
}

interface State {
    totalLayers: number;
    width: number;
    height: number;
    layers: LayersList;
}

export default function useCanvas() {
    const history = useHistoryState<State>({
        totalLayers: 1,
        width: 15,
        height: 7,
        layers: makeLayers(1, 15, 7)
    });

    const paintTile = (activeLayerKey: string, { x, y }: { x: number, y: number; }, sprite: Sprite) => {
        const newLayers = [
            ...history.state.layers.map(layer => {
                if (layer.key === activeLayerKey) {
                    return {
                        ...layer,
                        rows: [
                            ...layer.rows.map((row, rowIndex) => {
                                if (rowIndex === y) {
                                    return row.map((cell, cellIndex) => {
                                        if (cellIndex === x) {
                                            return sprite;
                                        }

                                        return cell;
                                    });
                                }

                                return row;
                            })
                        ]
                    };
                }

                return layer;
            })
        ];
        history.set({
            ...history.state,
            layers: newLayers
        });
    };

    const eraseTile = (activeLayerKey: string, { x, y }: { x: number, y: number; }) => {
        const newLayers = [
            ...history.state.layers.map(layer => {
                if (layer.key === activeLayerKey) {
                    return {
                        ...layer,
                        rows: [
                            ...layer.rows.map((row, rowIndex) => {
                                if (rowIndex === y) {
                                    return row.map((cell, cellIndex) => {
                                        if (cellIndex === x) {
                                            return {
                                                x: cell.x,
                                                y: cell.y,
                                                w: 1,
                                                h: 1
                                            };
                                        }

                                        return cell;
                                    });
                                }

                                return row;
                            })
                        ]
                    };
                }

                return layer;
            })
        ];
        history.set({
            ...history.state,
            layers: newLayers
        });
    };

    const resize = (numLayers: number, width: number, height: number) => {
        const newLayers = makeLayers(numLayers, width, height);
        for (let z = 0; z < numLayers; z += 1) {
            for (let j = 0; j < height; j += 1) {
                for (let i = 0; i < width; i += 1) {
                    if (history.state.layers.length > z && history.state.layers[z].rows.length > j && history.state.layers[z].rows[j].length > i) {
                        newLayers[z].rows[j][i] = history.state.layers[z].rows[j][i];
                        newLayers[z].name = history.state.layers[z].name;
                    }
                }
            }
        }

        return newLayers;
    };

    const addLayer = () => {
        const layers = resize(history.state.layers.length + 1, history.state.width, history.state.height);
        const totalLayers = history.state.totalLayers + 1;
        layers[layers.length - 1].key = totalLayers.toString();
        layers[layers.length - 1].name = `Layer #${totalLayers}`;

        history.set({
            ...history.state,
            totalLayers,
            layers
        });
    };

    const removeLayer = (layerKey: string) => {
        const layers = [...history.state.layers];
        const layerIndex = layers.findIndex(layer => layer.key === layerKey);
        if (layerIndex === -1) {
            return;
        }

        layers.splice(layerIndex, 1);
        history.set({
            ...history.state,
            layers
        });
    };

    const setWidth = (width: number) => {
        history.set({
            ...history.state,
            width,
            layers: resize(history.state.layers.length, width, history.state.height)
        });
    };

    const setHeight = (height: number) => {
        history.set({
            ...history.state,
            height,
            layers: resize(history.state.layers.length, history.state.width, height)
        });
    };

    const setLayerName = (layerKey: string, name: string) => {
        history.set({
            ...history.state,
            layers: history.state.layers.map(layer => {
                if (layer.key === layerKey) {
                    return {
                        ...layer,
                        name
                    };
                }

                return layer;
            })
        });
    };

    const moveLayerUp = (layerKey: string) => {
        const layers = [...history.state.layers];
        const layerIndex = layers.findIndex(layer => layer.key === layerKey);
        if (layerIndex === -1) {
            return;
        }

        const from = layers.splice(layerIndex, 1)[0];
        layers.splice(layerIndex - 1, 0, from);

        history.set({
            ...history.state,
            layers
        });
    };

    const moveLayerDown = (layerKey: string) => {
        const layers = [...history.state.layers];
        const layerIndex = layers.findIndex(layer => layer.key === layerKey);
        if (layerIndex === -1) {
            return;
        }

        const from = layers.splice(layerIndex, 1)[0];
        layers.splice(layerIndex + 1, 0, from);

        history.set({
            ...history.state,
            layers
        });
    };

    const load = (newState: State) => {
        history.set(newState);
    };

    const SAVED_CANVAS_VERSION = 1;

    useEffect(() => {
        const savedCanvas = window.localStorage.getItem('SAVED_CANVAS');
        if (savedCanvas) {
            const data = JSON.parse(savedCanvas);
            if (data.version === SAVED_CANVAS_VERSION) {
                load(data.state);
            }
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem('SAVED_CANVAS', JSON.stringify({
            version: SAVED_CANVAS_VERSION,
            state: history.state
        }));
    }, [history.state]);

    const get = (activeLayerKey: string, { x, y }: { x: number, y: number; }): Sprite | undefined => {
        for (const layer of history.state.layers) {
            if (layer.key !== activeLayerKey) {
                return;
            }

            return layer.rows[y][x];
        }
    }

    return {
        ...history.state,
        addLayer,
        removeLayer,
        setLayerName,
        moveLayerUp,
        moveLayerDown,
        setWidth,
        setHeight,
        paintTile,
        eraseTile,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        load,
        get
    };
}