import { Input } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Form, Modal, Radio, Space } from 'antd';
import React, { useState } from 'react';
import './newmodel.module.less';
import style from './newmodel.module.less';

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
        <div className={style.radio}>
            <Radio.Group onChange={onChange} value={value}>
                <Radio.Button value="local">本地模型</Radio.Button>
                <Radio.Button value="foreign">外部网页接入</Radio.Button>
                <Radio.Button value="default">预设模型</Radio.Button>
            </Radio.Group>
        </div>
        {value === 'default' ? (
            <div className={style.form}>
                <Form form={form} layout='vertical'>
                <Form.Item
                    name="option"
                    rules={[{required: true, message:'请选择预设模型！'}]}
                >
                    <Radio.Group>
                        <Space direction='vertical'>
                            <Radio value={'moss'}>MOSS</Radio>
                            <Radio value={'internlm'}>InternLM</Radio>
                            <Radio value={'chatglm'}>ChatGLM</Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>
                </Form>
            </div>
        ) : (
            <div className={style.form}>
                <Form form={form} layout='vertical'>
                <Form.Item
                    name="name"
                    label="模型名称"
                    rules={[{required: true, message: '请输入模型名称'}]}
                >
                    <Input placeholder='请输入模型名称' bordered={false} />
                </Form.Item>
                <Form.Item
                    name="path"
                    label="模型URL"
                    rules={[{required: true, message: '请输入模型URL'}]}
                >
                    <Input placeholder='请输入模型URL' bordered={false} />
                </Form.Item>
                </Form>
            </div>
        )}
        </Modal>
    );

};
export default NewForm;