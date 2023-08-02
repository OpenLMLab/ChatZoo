import React from 'react'
import { Button, Input, ConfigProvider } from 'antd';
import { SendOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import style from './bottom.module.less';


const Bottom: React.FC = () => (
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
                <Button type="text" icon={<PlusOutlined />} style={{color: 'rgba(255, 255, 255, 0.85)'}} ghost ></Button>
            </div>
            <div className={style.icon}>
            <Button type="text" icon={<DownloadOutlined />} style={{color: 'rgba(255, 255, 255, 0.85)'}} ghost ></Button>
            </div>
        </div>
    </ConfigProvider>
);


export default Bottom;