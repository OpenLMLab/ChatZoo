import React, {useContext, useEffect, useState} from 'react'
import { Button, Input, ConfigProvider, Popover } from 'antd';
import { SendOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import style from './bottom.module.less';
import NewForm from '@/components/newmodel/newmodel';
import { mode } from '@/utils/contexts'
import Annotate from '@/components/annotate/annotate';

const Bottom: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [modal, setModal] = useState(false);
    const hide = () => {
        setOpen(false);
    };
    const hideModal = () => {
        setModal(false);
    };
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };
    const handleOpenModal = (newOpen: any) => {
        setModal(newOpen)
    }
    const m = useContext(mode);
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
                        content={
                            <div>
                                <a>全部</a>
                                <a>一个</a>
                            </div>
                        }
                        title="请选择要下载的会话记录"
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