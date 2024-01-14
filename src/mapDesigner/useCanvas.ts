import { Sprite, makeSpriteMap } from '../engine/spriteUtils';
import useHistoryState from './useHistoryState';


function makeLayers(numLayers: number, width: number, height: number): Sprite[][][] {
    const layers: Sprite[][][] = [];
    for (let i = 0; i < numLayers; i += 1) {
        layers[i] = makeSpriteMap(undefined, width, height)
    }

    return layers;
}

export default function useCanvas() {
    const history = useHistoryState<{
        numLayers: number
        width: number
        height: number
        layers: Sprite[][][]
    }>({
        numLayers: 2,
        width: 15,
        height: 7,
        layers: makeLayers(2, 15, 7)
    });

    const paintTile = (activeLayer: number, { x, y }: { x: number, y: number }, sprite: Sprite) => {
        const newLayers = [
            ...history.state.layers.map((layer, layerIndex) => {
                if (layerIndex === activeLayer) {
                    return [
                        ...layer.map((row, rowIndex) => {
                            if (rowIndex === y) {
                                return row.map((cell, cellIndex) => {
                                    if (cellIndex === x) {
                                        return sprite;
                                    }
            
                                    return cell;
                                })
                            }
            
                            return row;
                        })
                    ];
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
                    if (history.state.layers.length > z && history.state.layers[z].length > j && history.state.layers[z][j].length > i) {
                        newLayers[z][j][i] = history.state.layers[z][j][i];
                    }
                }
            }
        }

        return newLayers;
    }

    const setNumLayers = (numLayers: number) => {
        history.set({
            ...history.state,
            numLayers,
            layers: resize(numLayers, history.state.width, history.state.height)
        });
    }

    const setWidth = (width: number) => {
        history.set({
            ...history.state,
            width,
            layers: resize(history.state.numLayers, width, history.state.height)
        });
    }

    const setHeight = (height: number) => {
        history.set({
            ...history.state,
            height,
            layers: resize(history.state.numLayers, history.state.width, height)
        });
    }

    return {
        ...history.state,
        setNumLayers,
        setWidth,
        setHeight,
        paintTile,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo
    };
}