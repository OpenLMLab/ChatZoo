import React, { createContext, useState } from 'react';

// Create a new context
export interface FreezeContextProps {
    freeze: string | null;
    setFreeze: React.Dispatch<React.SetStateAction<string | null>>;
}

export const FreezeContext = createContext<FreezeContextProps | null>(null);

// Create a provider component
export const FreezeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Define the state variable
    const [freeze, setFreeze] = useState<string | null>(null);

    // Provide the context values
    const contextValues: FreezeContextProps = {
        freeze,
        setFreeze,
    };

    // Return the context provider with the provided values
    return <FreezeContext.Provider value={contextValues}>{children}</FreezeContext.Provider>;
};
