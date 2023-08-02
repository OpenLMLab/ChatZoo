import React from 'react';
import { Button, Space } from 'antd';
import {PlusSquareOutlined} from '@ant-design/icons';
import style from "./add.module.less"

function Add() {
  return (
    <Button type='dashed' className={style.button} ghost>
        <PlusSquareOutlined className={style.icon} />
        <span className={style.text}> 添加1个模型</span>
    </Button>
  );
}

export default Add;