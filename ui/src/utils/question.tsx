import React, { createContext, useState } from 'react';

// Create a new context
export interface QuestionContextProps {
    question: string | null;
    setQuestion: React.Dispatch<React.SetStateAction<string | null>>;
}

export const QuestionContext = createContext<QuestionContextProps | null>(null);

// Create a provider component
export const QuestionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Define the state variable
    const [question, setQuestion] = useState<string | null>(null);

    // Provide the context values
    const questionValues: QuestionContextProps = {
        question,
        setQuestion,
    };

    // Return the context provider with the provided values
    return <QuestionContext.Provider value={questionValues}>{children}</QuestionContext.Provider>;
};
