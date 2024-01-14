import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import GameApp from './ui/GameApp';
import MapDesignerApp from './ui/MapDesignerApp';


const root = createRoot(document.getElementById('app')!);
root.render(
    <>
    {/* <StrictMode> */}
        {/* <GameApp /> */}
        <MapDesignerApp tileSize={32} />
    {/* </StrictMode> */}
    </>
);

