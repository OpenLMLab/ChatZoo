import React from 'react'
import { Input } from 'antd';
import { SendOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import style from './bottom.module.less';

const Bottom: React.FC = () => (
    <div className={style.wrapper}>
        <Input placeholder="介绍一下你自己吧" className={style.input} addonAfter={<SendOutlined />} />
        <div className={style.icon}><PlusOutlined /></div>
        <div className={style.icon}><DownloadOutlined /></div>
    </div>
);


export default Bottom;