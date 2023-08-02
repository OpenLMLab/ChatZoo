import React from 'react';
import type { RadioChangeEvent } from 'antd';
import { Radio } from 'antd';
import style from "./mode.module.less"

const onChange = (e: RadioChangeEvent) => {
  console.log(`radio checked:${e.target.value}`);
};

const Mode: React.FC = () => (
    <Radio.Group 
        onChange={onChange} 
        defaultValue="a"
        buttonStyle='solid'
    >
    <Radio.Button value="a">模型管理</Radio.Button>
    <Radio.Button value="b">会话标注</Radio.Button>
    <Radio.Button value="c">单回复标注</Radio.Button>
    </Radio.Group>
);

export default Mode;