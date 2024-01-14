import { useState, useEffect } from 'react';


export default function useAnimation(framePaths: string[]) {
    const [ activeFrame, setActiveFrame ] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFrame(prevValue => {
                if (prevValue >= framePaths.length - 1) {
                    return 0;
                }
                return prevValue + 1;
            });
        }, 1000 / 10);

        return () => {
            clearInterval(interval);
        };
    }, [ framePaths ]);

    if (framePaths.length === 0) {
        return undefined;
    }

    return framePaths[activeFrame];
}
