import React from 'react';
import type { RadioChangeEvent } from 'antd';
import { Radio, ConfigProvider } from 'antd';

const onChange = (e: RadioChangeEvent) => {
  console.log(`radio checked:${e.target.value}`);
};

const Mode: React.FC = () => (
    <ConfigProvider
        theme={{
            components: {
                Radio: {
                    buttonBg: '#000000',
                    buttonCheckedBg: '#4C8F70',
                    buttonColor: '#FFFFFF',
                    buttonSolidCheckedColor: '#FFFFFF',
                    lineWidth: 0
                }
            }
        }}
    >
        <Radio.Group 
            onChange={onChange} 
            defaultValue="a"
            buttonStyle='outline'
        >
        <Radio.Button value="a">模型管理</Radio.Button>
        <Radio.Button value="b">会话标注</Radio.Button>
        <Radio.Button value="c">单回复标注</Radio.Button>
        </Radio.Group>
    </ConfigProvider>
);

export default Mode;