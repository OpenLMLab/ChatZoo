import React, { createContext, useState } from 'react';
import ModelConfig from '@/components/model/model';

// 定义 ModelContextProps 类型
export interface ModelContextProps {
    models: ModelConfig[];
    setModels: React.Dispatch<React.SetStateAction<ModelConfig[]>>;
}

// 创建 ModelContext
export const ModelContext = createContext<ModelContextProps | null>(null);

// 创建 ModelContextProvider
export const ModelContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [models, setModels] = useState<ModelConfig[]>([]); // 初始值为空数组
    const contextValues: ModelContextProps = {
        models,
        setModels,
    };
    return <ModelContext.Provider value={contextValues}>{children}</ModelContext.Provider>;
};
