import React, {useContext, useState} from 'react';
import type { RadioChangeEvent } from 'antd';
import { Radio } from 'antd';
import { mode } from '@/utils/contexts'
import style from './mode.module.less';  

const Mode = () => {
    // 获取权限
    const permission = localStorage.getItem('permission');
    const [ value, setValue] = useState('dialogue');
    const onChange = (e: RadioChangeEvent) => {
        console.log(`radio checked:${e.target.value}`);
        setValue(e.target.value)
      };
    const fullOptions = [
        {label: '模型管理', value: 'model'},
        {label: '会话标注', value: 'dialogue'},
        {label: '单回复标注', value: 'single'}
    ]
    const disOptions = [
        {label: '会话标注', value: 'dialogue'},
        {label: '单回复标注', value: 'single'}
    ]
    let currOption = null
    if (permission === 'admin' || permission === 'debugger') {
        currOption = fullOptions
    } else {
        currOption = disOptions
    }
    console.log('发出',value)
    return (
        <div className={style.radio}>
            <mode.Provider value={'model'}>
                <Radio.Group
                    options = {currOption}
                    onChange = {onChange}
                    value = {value}
                    optionType = 'button'
                    buttonStyle = 'outline'
                />
            </mode.Provider>
        </div>
    )
};

export default Mode;