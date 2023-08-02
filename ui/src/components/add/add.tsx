import React, { useState } from 'react';
import { Button, Form, Modal, Radio } from 'antd';
import {PlusSquareOutlined} from '@ant-design/icons';
import type { RadioChangeEvent } from 'antd';
import style from "./add.module.less"
import Input from 'rc-input';

interface Values {
    name: string;
    path: string
}

interface newFormProps {
    open: boolean;
    onCreate: (values: Values) => void;
    onCancel: () => void;
}

const NewForm: React.FC<newFormProps> = ({
    open,
    onCreate,
    onCancel
}) => {
    const [form] = Form.useForm();
    const [value, setValue] = useState('default');

    const onChange = (e: RadioChangeEvent) => {
      setValue(e.target.value);
    };

    return (
        <Modal
            open={open}
            title="添加模型"
            okText="添加"
            cancelText="取消"
            onCancel={onCancel}
            onOk={() => {
                form
                .validateFields()
                .then((values) => {
                    form.resetFields();
                    onCreate(values);
                })
                .catch((info) => {
                    console.log('验证失败', info)
                })
            }}
            width={450}
        >
        <Radio.Group onChange={onChange} value={value}>
            <Radio.Button value="local">local</Radio.Button>
            <Radio.Button value="foreign">foreign</Radio.Button>
            <Radio.Button value="default">default</Radio.Button>
        </Radio.Group>
        {value === 'default' ? (
            <Form form={form} layout='vertical'>
            <Form.Item
                name="option"
            >
                <Radio.Group>
                <Radio value={'moss'}>MOSS</Radio>
                <Radio value={'internlm'}>InternLM</Radio>
                <Radio value={'chatglm'}>ChatGLM</Radio>
                </Radio.Group>
            </Form.Item>
            </Form>
        ) : (
            <Form form={form} layout='vertical'>
            <Form.Item
                name="name"
                label="模型名称"
                rules={[{required: true, message: '请输入模型名称'}]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="path"
                label="模型URL"
                rules={[{required: true, message: '请输入模型URL'}]}
            >
                <Input />
            </Form.Item>
            </Form>
        )}
        </Modal>
    );

};


const Add: React.FC = () => {
    const [open, setOpen] = useState(false);

    const onCreate = (values: any) => {
        console.log('创建', values)
        setOpen(false);
    }

    return (
        <div>
            <Button type='dashed' className={style.button} onClick={()=>{setOpen(true)}} ghost>
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
    );
}

export default Add;
