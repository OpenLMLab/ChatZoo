import React, { useState, useContext } from 'react';
import { Button, message } from 'antd';
import { PlusSquareOutlined } from '@ant-design/icons';
import style from './add.module.less';
import NewForm from '@/components/newmodel/newmodel';

const Add: React.FC = () => {
    const [open, setOpen] = useState(false);
    const onCreate = (values: any) => {
        console.log('创建', values);
        setOpen(false);
    };

    return (
        <>
            <div>
                <Button
                    type="dashed"
                    className={style.button}
                    onClick={() => {
                        setOpen(true);
                    }}
                    ghost
                >
                    <div className={style.box}>
                        <PlusSquareOutlined className={style.icon} />
                        <span className={style.text}> 添加1个模型</span>
                    </div>
                </Button>
                <NewForm
                    open={open}
                    onCreate={onCreate}
                    onCancel={() => {
                        setOpen(false);
                    }}
                />
            </div>
        </>
    );
};

export default Add;
