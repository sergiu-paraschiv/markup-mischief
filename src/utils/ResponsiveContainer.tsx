import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';


export default function ResponsiveContainer({ children, style }: {
    children: (width: number, height: number) => React.ReactNode
    style: React.CSSProperties
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [ width, setWidth ] = useState(0);
    const [ height, setHeight ] = useState(0);

    const handleWindowResize = () => {
        setWidth(ref.current?.clientWidth || 0);
        setHeight(ref.current?.clientHeight || 0);
    }

    useLayoutEffect(() => {
        handleWindowResize();

        setTimeout(() => {
            handleWindowResize();
        }, 100);
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);

    return (
        <div ref={ref} style={style}>
            {children(width, height)}
        </div>
    );
}
