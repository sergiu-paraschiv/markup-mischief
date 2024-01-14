import React, { useEffect } from 'react';


export default function Animation({ className, path, frames, style }: {
    className?: string
    path: string
    frames: number
    style?: React.CSSProperties
}) {
    const [ frame, setFrame ] = React.useState(1);

    useEffect(() => {
        setFrame(1);
    }, [ path, frames ]);

    useEffect(() => {
        let interval = setInterval(() => {
            if (frames === 1) {
                return;
            }

            if (frame < frames) {
                setFrame(frame + 1);
            }
            else {
                setFrame(1);
            }
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, [ frames, frame, path ]);

    let $F = frames === 1 ? '1' : frame.toString();
    if ($F.length === 1) {
        $F = '0' + $F;
    }

    return (
        <div
            className={className}
            style={{
                ...style,
                backgroundImage: `url('./${path.replace('$F', $F)}.png')`
            }}
        ></div>
    );
}
