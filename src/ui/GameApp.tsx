import React from 'react';
import useGame from '../engine/useGame';
import GameRenderer from '../renderer/GameRenderer';


export default function GameApp() {
    const game = useGame({
        board: `
            ||c ____________________  ||
            ||  ______________o_____  ||
            ||  ______c_____________  ||
            ||  ____________________  ||
            ||  i_i_i_______________  ||
            ||  ______________o_____  ||
            ||  ______c_____________  ||
            ||  ____________________  ||
            ||  ____________________  ||
            ||____b___b_______________||
        `,
        heroStart: { x: 10, y: 5 }
    });

    return (
        <GameRenderer game={game} />
    );
}
