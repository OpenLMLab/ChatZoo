import React, { createContext, useState } from 'react';

// Create a new context
export interface ModeContextProps {
    mode: string | null;
    setMode: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ModeContext = createContext<ModeContextProps | null>(null);

// Create a provider component
export const ModeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Define the state variable
    const [mode, setMode] = useState<string | null>(null);

    // Provide the context values
    const contextValues: ModeContextProps = {
        mode,
        setMode,
    };

    // Return the context provider with the provided values
    return <ModeContext.Provider value={contextValues}>{children}</ModeContext.Provider>;
};
