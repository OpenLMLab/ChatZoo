import { ModeContext } from '@/utils/contexts';
import type { RadioChangeEvent } from 'antd';
import { Radio } from 'antd';
import { useContext, useState } from 'react';
import style from './mode.module.less';

const Mode = () => {
    // 获取权限
    const permission = localStorage.getItem('permission');
    console.log('权限', permission)
    const modeContext = useContext(ModeContext);
    const [ value, setValue] = useState('dialogue');
    const onChange = (e: RadioChangeEvent) => {
        modeContext!.setMode(e.target.value);
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

    return (
        <div className={style.radio}>
            <Radio.Group
                options = {currOption}
                onChange = {onChange}
                value = {value}
                optionType = 'button'
                buttonStyle = 'outline'
            />
        </div>
    )
};

export default Mode;
