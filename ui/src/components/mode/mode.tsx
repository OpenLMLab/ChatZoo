import { ModeContext } from '@/utils/contexts';
import type { RadioChangeEvent } from 'antd';
import { Radio } from 'antd';
import { useContext, useState, useEffect } from 'react';
import style from './mode.module.less';
// import { FreezeContext } from '@/utils/freezecontext';
import eventBus from '@/utils/eventBus';
import { ModelContext } from '@/utils/modelcontext';
import ModelConfig from '../model/model';
import http from '@/utils/axios';


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
    // 获取当前模式
    const sysMode = localStorage.getItem("sys_mode")

    const modeContext = useContext(ModeContext);
    const [value, setValue] = useState('dialogue');
    const models = useContext(ModelContext)?.models;

    const onChange = (e: RadioChangeEvent) => {
        // 通知保存数据
        if (sysMode === "evaluation") {
            // evaluation 模式下，不需要真正换模式，通知home组件切换页面即可
            console.log("mode component values is ", e.target.value)
            if (e.target.value === 'dialogue') {
                eventBus.emit("evalPageSwitch", true)
                eventBus.emit("evalBottomSwitch", true)
            }
            else {
                let newData: any[] = []
                models?.forEach((model: ModelConfig, idx: number) => {
                    http.get<string, any>(model.url + "/chat/get_overall_score?ds_name=" +
                        localStorage.getItem("selectDs")).then((res) => {
                            let ds_data = res.data.data
                            ds_data['model'] = model.nickname
                            console.log("evaloverall setData --> ", ds_data)
                            newData.push(ds_data)
                            if (newData.length == Object.keys(models).length) {
                                localStorage.setItem("overallScore", JSON.stringify(newData))
                                eventBus.emit("evalPageSwitch", false)
                            }
                        })
                })
                eventBus.emit("evalBottomSwitch", false)
            }
        } else {
            eventBus.emit('modeChangeEvent', e.target.value);
            modeContext?.setMode(e.target.value);
        }
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

    if (sysMode === 'evaluation') {
        currOption = [
            { label: '数据展示', value: 'dialogue' },
            { label: 'OVERALL SCORE', value: 'single' }
        ]
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
