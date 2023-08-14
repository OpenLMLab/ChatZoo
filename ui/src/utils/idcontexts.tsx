import React, { createContext, useState } from 'react';

// Create a new context
export interface IdContextProps {
    id: string | null;
    setId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const IdContext = createContext<IdContextProps | null>(null);

// Create a provider component
export const IdContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Define the state variable
    const [id, setId] = useState<string | null>(null);

    // Provide the context values
    const idContextValues: IdContextProps = {
        id,
        setId,
    };

    // Return the context provider with the provided values
    return <IdContext.Provider value={idContextValues}>{children}</IdContext.Provider>;
};
