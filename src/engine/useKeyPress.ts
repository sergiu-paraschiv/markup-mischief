import { useState, useEffect } from 'react';


export default function useKeyPress(watchedKey: string) {
    const [ isPressed, setIsPressed ] = useState(false);
    
    const downHandler = ({ repeat, key }: KeyboardEvent) => {
        if (repeat) {
            return;
        }

        if (key === watchedKey) {
            setIsPressed(true);
        }
    }
    
    const upHandler = ({ key }: KeyboardEvent) => {
        if (key === watchedKey) {
            setIsPressed(false);
        }
    }
    
    useEffect(() => {
        if (window !== undefined) {
            window.addEventListener('keydown', downHandler);
            window.addEventListener('keyup', upHandler);
        }

        return () => {
            if (window !== undefined) {
                window.removeEventListener('keydown', downHandler)
                window.removeEventListener('keyup', upHandler)
            }
        };
    }, []);

    return isPressed;
}
