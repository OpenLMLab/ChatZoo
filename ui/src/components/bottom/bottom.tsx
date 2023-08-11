import Annotate from '@/components/annotate/annotate';
import NewForm from '@/components/newmodel/newmodel';
import { ModeContext } from '@/utils/contexts';
import { DownloadOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input, Popover } from 'antd';
import React, { useContext, useState } from 'react';
import { QuestionContext } from '@/utils/question';
import style from './bottom.module.less';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { EventEmitter } from 'stream';
import eventBus from '@/utils/eventBus'
import { isContext } from 'vm';

/**
 * 处理输入
 */
function handleInput(value:string) {
    console.log('输入的值', value)
} 

const Bottom: React.FC = () => {
    const models = useContext(ModelContext)?.models;
    const names: string[] = []
    models?.map(model => names.push(model.nickname))    
    const [inputValue, setInputValue] = useState('');
    const sessionId = useContext(IdContext)?.id
    const handleChange = (event: any) => {
        const { value } = event.target;
        setInputValue(value);
      };
    const handleEnter = () => {
        handleInput(inputValue);
        eventBus.emit('sendMessage', inputValue, models)
        setInputValue('');
    };
    const [open, setOpen] = useState(false);
    const [modal, setModal] = useState(false);
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };
    const handleOpenModal = (newOpen: any) => {
        setModal(newOpen)
    }
    const downloadSessionListByName = (nickname: string) => {
        // 下载会话数据， 通过传入的 nickname 来判断下载哪几个模型的数据
        let data = 
        localStorage.getItem(sessionId+"")
    }
    const m = useContext(ModeContext)?.mode;
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
                    />
                    <div className={style.icon}>
                        <Button type="text" icon={<SendOutlined />} style={{color: 'rgba(255, 255, 255, 0.85)'}} ghost ></Button>
                    </div>
                </div>
                <div className={style.icon}>
                {m === 'model' ? (
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
                        // title={<span>"请选择要下载的会话记录"<span/>}
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
