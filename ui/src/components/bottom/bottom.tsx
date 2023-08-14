import Annotate from '@/components/annotate/annotate';
import NewForm from '@/components/newmodel/newmodel';
import { ModeContext } from '@/utils/contexts';
import { DownloadOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input, Popover } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import style from './bottom.module.less';
import { ModelContext } from '@/utils/modelcontext';
import eventBus from '@/utils/eventBus';
import { IdContext } from '@/utils/idcontexts';
import ModelConfig from '../model/model';
import { sessionMesage } from '@/utils/sessionInterface';

/**
 * 底部栏（输入、标注、下载）
 * 1. Enter，发送消息给chat组件。
 * 2. 如果当前是单回复标注：chat组件完成消息的收发，通知底部栏禁用输入框；完成标注后，解禁输入框。
 * 3. 如果当前是会话标注，不受影响。
 * 4. 点击会话标注，开始投票，同时禁用标注按钮。（但是切换会话的时候，需要启用标注按钮）
 */

/**
 * inputListener：输入框禁用 input
 */

/**
 * 处理输入
 */
function handleInput(value: string) {
    console.log('输入的值', value);
}

const Bottom: React.FC = () => {
    // 控制输入框禁用
    const [isInput, setisInput] = useState(false);

    const [inputValue, setInputValue] = useState('');
    const mode = useContext(ModeContext)?.mode;
    const models = useContext(ModelContext)?.models;
    const sessionId = useContext(IdContext)?.id;
    const names: string[] = []
    models?.map(model => names.push(model.nickname))
    console.log("[Debug] bottom.tsx mode: ", mode)
    // 禁用输入框的事件
    useEffect(()=>{
        const banInputEvent = (banButton: boolean) => {
            setisInput(banButton)
        }
        eventBus.on("banInputEvent", banInputEvent)
        return ()=>{
            eventBus.off("banInputEvent", banInputEvent)
        }
    }, [])
    
    // 输入框
    const handleChange = (event: any) => {
        const { value } = event.target;
        setInputValue(value);
    };
    const handleEnter = () => {
        handleInput(inputValue);
        eventBus.emit('sendMessage', inputValue, models, mode, sessionId);
        setInputValue('');
    };

    // 对话框
    const [open, setOpen] = useState(false);
    const [modal, setModal] = useState(false);
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };
    const handleOpenModal = (newOpen: any) => {
        setModal(newOpen);
    };
    // 下载对话记录
    const handleDownloadSingle = (model_info: ModelConfig, sessionid: string) => {
        let history: sessionMesage = {};
        const cache_data = localStorage.getItem(sessionid);
        if (cache_data) history = JSON.parse(cache_data);
        const model_history = JSON.stringify(history[model_info.model_id]);
        const blob = new Blob([model_history], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = model_info.nickname + '.json';
        link.click();
        URL.revokeObjectURL(url);
    };
    const handleDownloadAll = (model_infos: ModelConfig[], sessionid: string) => {
        let history: sessionMesage = {};
        const cache_data = localStorage.getItem(sessionid);
        if (cache_data) history = JSON.parse(cache_data);
        let new_history: sessionMesage = {};
        model_infos.forEach((model_info) => {
            new_history[model_info.nickname] = history[model_info.model_id];
        });
        const model_history = JSON.stringify(new_history);
        const blob = new Blob([model_history], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '全部.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ConfigProvider
            theme={{
                components: {
                    Input: {
                        colorBgContainer: 'rgba(255, 255, 255, 0.06)',
                        colorTextPlaceholder: 'rgba(255, 255, 255, 0.95)',
                        fontFamily: 'PingFang SC',
                    },
                    Button: {
                        colorBorder: 'rgba(255, 255, 255, 0.85)',
                    },
                },
            }}
        >
            <div className={style.wrapper}>
                <div className={style.input}>
                    <Input
                        placeholder="介绍一下你自己吧"
                        bordered={false}
                        value={inputValue}
                        onChange={handleChange}
                        onPressEnter={handleEnter}
                        disabled={isInput}
                    />
                    <div className={style.icon}>
                        <Button
                            type="text"
                            icon={<SendOutlined />}
                            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                            ghost
                        ></Button>
                    </div>
                </div>
                <div className={style.icon}>
                    {mode === 'model' ? (
                        <>
                            <Button
                                type="text"
                                icon={<PlusOutlined />}
                                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                                ghost
                                onClick={() => {
                                    setModal(true);
                                }}
                            />
                            <NewForm
                                open={modal}
                                onCreate={handleOpenModal}
                                onCancel={() => {
                                    setModal(false);
                                }}
                            />
                        </>
                    ) : (
                        <Annotate></Annotate>
                    )}
                </div>
                <div className={style.icon}>
                    <Popover
                        overlayClassName={style.popoverStyle}
                        overlayInnerStyle={{ fontSize: 14, fontFamily: 'PingFang SC', fontWeight: 400 }}
                        content={
                            <div>
                                <Button
                                    block
                                    className={style.popoverTitle}
                                    onClick={() => {
                                        handleDownloadAll(models!, sessionId!);
                                    }}
                                >
                                    全部
                                </Button>
                                {models?.map((name: ModelConfig) => (
                                    <Button
                                        block
                                        className={style.popoverTitle}
                                        onClick={() => {
                                            handleDownloadSingle(name, sessionId!);
                                        }}
                                    >
                                        {name.nickname}
                                    </Button>
                                ))}
                            </div>
                        }
                        title={<span className={style.popoverTitle}>请选择要下载的会话记录</span>}
                        trigger="click"
                        open={open}
                        onOpenChange={handleOpenChange}
                    >
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                            ghost
                        ></Button>
                    </Popover>
                </div>
            </div>
        </ConfigProvider>
    );
};

export default Bottom;
