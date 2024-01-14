import { useState } from 'react';


interface Layer {
    index: number
    isVisible: boolean
}

export default function useLayers(numLayers: number) {
    const [ hiddenLayers, setHiddenLayers ] = useState<number[]>([]);

    const layers: Layer[] = [];
    for (let i = 0; i < numLayers; i += 1) {
        layers.push({
            index: i,
            isVisible: hiddenLayers.indexOf(i) === -1
        });
    }

    const toggleLayer = (index: number) => {
        if (index < numLayers) {
            const newHiddenLayers = [
                ...hiddenLayers.filter(hiddenLayer => hiddenLayer !== index)
            ];

            if (hiddenLayers.indexOf(index) === -1) {
                newHiddenLayers.push(index);
            }

            setHiddenLayers(newHiddenLayers);
        }
    }

    return {
        layers,
        toggleLayer,
        hiddenLayers
    };
}