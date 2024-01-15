import { useState } from 'react';


interface Layer {
    index: number
    key: string
    name: string
    isVisible: boolean
}

export default function useLayers(spriteLayers: {
    key: string
    name: string
}[]) {

    const [ activeKey, setActiveKey ] = useState<string | undefined>(undefined);
    const [ hiddenKeys, setHiddenKeys ] = useState<string[]>([]);

    const layers: Layer[] = [];
    for (let i = 0; i < spriteLayers.length; i += 1) {
        layers.push({
            index: i,
            key: spriteLayers[i].key,
            name: spriteLayers[i].name,
            isVisible: hiddenKeys.indexOf(spriteLayers[i].key) === -1
        });
    }

    const toggleLayer = (key: string) => {
        const newHiddenLayers = [
            ...hiddenKeys.filter(hiddenLayer => hiddenLayer !== key)
        ];

        if (hiddenKeys.indexOf(key) === -1) {
            newHiddenLayers.push(key);
        }

        setHiddenKeys(newHiddenLayers);
    }

    return {
        layers,
        toggleLayer,
        hiddenLayers: hiddenKeys,
        activeLayer: activeKey,
        setActiveLayer: setActiveKey
    };
}