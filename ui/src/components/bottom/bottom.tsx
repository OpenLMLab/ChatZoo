import Annotate from '@/components/annotate/annotate';
import NewForm from '@/components/newmodel/newmodel';
import { ModeContext } from '@/utils/contexts';
import { DownloadOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input, Popover } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import style from './bottom.module.less';
import { ModelContext } from '@/utils/modelcontext';
import eventBus from '@/utils/eventBus'
import { IdContext } from '@/utils/idcontexts';

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
function handleInput(value:string) {
    console.log('输入的值', value)
} 

const Bottom: React.FC = () => {
    // 控制输入框禁用
    const [isInput, setisInput] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState(false);
    const mode = useContext(ModeContext)?.mode;
    const models = useContext(ModelContext)?.models;
    const sessionId = useContext(IdContext)?.id;
    const names: string[] = []
    models?.map(model => names.push(model.nickname))

    useEffect(() => {
        const statusListener = (status: boolean) => {
            setStatus(status)
            console.log('设置是否已经标注', status)
        }
        const inputListener = (status: boolean) => {
            setisInput(status)
        }
        const annotateListener = () => {
            setisInput(true)
        }
        eventBus.on('finishAnnotate', annotateListener)
        eventBus.on('input', inputListener)
        eventBus.on('sendStatus', statusListener)
        return () => {
            eventBus.removeListener('input', inputListener)
            eventBus.removeListener('sendStatus', statusListener)
            eventBus.removeListener('finishAnnotate', annotateListener)
        }
    }, []);
    
    // 输入框
    const handleChange = (event: any) => {
        const { value } = event.target;
        setInputValue(value);
      };
    const handleEnter = () => {
        handleInput(inputValue);
        eventBus.emit('sendMessage', inputValue, models, mode, sessionId)
        setInputValue('');
    };

    // 对话框
    const [open, setOpen] = useState(false);
    const [modal, setModal] = useState(false);
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };
    const handleOpenModal = (newOpen: any) => {
        setModal(newOpen)
    }

    return (
            <ConfigProvider
            theme={{
                components: {
                    Input: {
                        colorBgContainer: 'rgba(255, 255, 255, 0.06)',
                        colorTextPlaceholder: 'rgba(255, 255, 255, 0.95)',
                        fontFamily: 'PingFang SC'
                    },
                    Button: {
                        colorBorder: 'rgba(255, 255, 255, 0.85)'
                    }
                }
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
                        disabled={!isInput}
                    />
                    <div className={style.icon}>
                        <Button type="text" icon={<SendOutlined />} style={{color: 'rgba(255, 255, 255, 0.85)'}} ghost ></Button>
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
                        overlayInnerStyle={{fontSize: 14, fontFamily: "PingFang SC", fontWeight: 400}}
                        content={
                            <div>
                                <Button block className={style.popoverTitle}>全部</Button>
                                {names.map((name: string) => (<Button block className={style.popoverTitle}>{name}</Button>))}
                            </div>
                        }
                        title={<span className={style.popoverTitle}>请选择要下载的会话记录</span>}
                        trigger="click"
                        open={open}
                        onOpenChange={handleOpenChange}
                    >
                        <Button type="text" icon={<DownloadOutlined />} style={{color: 'rgba(255, 255, 255, 0.85)'}} ghost ></Button>
                    </Popover>
                </div>
            </div>
        </ConfigProvider>
    );
};


export default Bottom;
