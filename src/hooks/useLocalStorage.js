import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored !== null) {
                return JSON.parse(stored);
            }
            return typeof initialValue === "function" ? initialValue() : initialValue;
        } catch {
            return typeof initialValue === "function" ? initialValue() : initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Storage full or unavailable — silently fail
        }
    }, [key, value]);

    return [value, setValue];
}
