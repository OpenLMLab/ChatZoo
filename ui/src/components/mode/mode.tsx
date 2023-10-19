import { ModeContext } from '@/utils/contexts';
import type { RadioChangeEvent } from 'antd';
import { Radio } from 'antd';
import { useContext, useState, useEffect } from 'react';
import style from './mode.module.less';
// import { FreezeContext } from '@/utils/freezecontext';
import eventBus from '@/utils/eventBus';

const Mode = () => {
    // 禁用mode的开关
    const [banMode, setBanMode] = useState(false);

    // 获取权限
    const permission = localStorage.getItem('permission');
    // let freeze = useContext(FreezeContext);
    // let myfreeze = false;
    // if(freeze?.freeze === 'yes') {
    //     myfreeze = true;
    // }
    const modeContext = useContext(ModeContext);
    const [value, setValue] = useState('dialogue');
    const onChange = (e: RadioChangeEvent) => {
        // 通知保存数据
        eventBus.emit('modeChangeEvent', e.target.value);
        modeContext?.setMode(e.target.value);
        setValue(e.target.value);
    };
    const fullOptions = [
        { label: '模型管理', value: 'model' },
        { label: '会话标注', value: 'dialogue' },
        { label: '单回复标注', value: 'single' },
    ];
    const disOptions = [
        { label: '会话标注', value: 'dialogue' },
        { label: '单回复标注', value: 'single' },
    ];
    let currOption = null;
    if (permission === 'debug') {
        currOption = fullOptions;
    } else {
        currOption = disOptions;
    }

    // 开始/关闭会话后，接受到禁用/开启mode的命令
    useEffect(() => {
        const banModeEvent = (banButton: boolean) => {
            setBanMode(banButton);
        };
        eventBus.on('banModeEvent', banModeEvent);
        return () => {
            eventBus.off('banModeEvent', banModeEvent);
        };
    });

    return (
        <div className={style.mode_display}>
            {/* <div className={style.tag}>
                <Tag color="blue">杜甫</Tag>
                <Tag color="red">李白</Tag>
                <Tag color="green">唐朝历史</Tag>
            </div> */}
            <div className={style.radio}>
                <Radio.Group
                    options={currOption}
                    onChange={onChange}
                    value={value}
                    disabled={banMode}
                    optionType="button"
                    buttonStyle="outline"
                />
            </div>
        </div>
        
    );
};

export default Mode;
