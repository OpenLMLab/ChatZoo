import { Input } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Form, Modal, Radio, Space, message } from 'antd';
import React, { useContext, useState } from 'react';
import './newmodel.module.less';
import style from './newmodel.module.less';
import { ModelContext } from '@/utils/modelcontext';
import http from '@/utils/axios';
import ModelConfig from '../model/model';

interface Values {
    name: string;
    path: string;
}

interface newFormProps {
    open: boolean;
    onCreate: (values: Values) => void;
    onCancel: () => void;
}

const NewForm: React.FC<newFormProps> = ({ open, onCreate, onCancel }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const success = (value: string) => {
        messageApi.open({
            type: 'success',
            content: value,
        });
    };
    const error = (value: string) => {
        messageApi.open({
            type: 'error',
            content: value,
        });
    };

    const [form] = Form.useForm();
    const [value, setValue] = useState('default');

    const onChange = (e: RadioChangeEvent) => {
        setValue(e.target.value);
    };

    // 创建模型
    const models = useContext(ModelContext)?.models || [];
    const names = models.map((model) => {
        return model.nickname;
    });
    console.log('已经存在的模型名字', names);
    const mct = useContext(ModelContext);
    console.log('外层的模型', models);
    const registerNewModel = (values: any) => {
        if (models?.length === 4) {
            error('最多只能存在4个模型！');
        }
        // 检查URL是否以'http://'开头，如果不是则添加
        let url = values['path'].trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }

        // 检查URL最后是否有'/'，如果有则删除
        if (url.endsWith('/')) {
            url = url.slice(0, -1);
        }

        console.log(values);
        http.get<string, any>(url + '/chat/model_info')
            .then((res) => {
                console.log('返回结果', res.data.data);
                const model = new ModelConfig(
                    res.data.data['model_name_or_path'],
                    res.data.data['nickname'],
                    res.data.data['tokenizer_path'],
                    res.data.data['generate_kwargs'],
                    res.data.data['device'],
                    res.data.data['prompts'],
                    url,
                    res.data.data['stream'],
                    res.data.data['model_id'],
                    true,
                );
                const updateModels = [...models, model];
                mct?.setModels(updateModels);
                success('添加模型成功！');
            })
            .catch(() => {
                error('添加模型失败!');
            });
    };

    return (
        <>
            {contextHolder}
            <Modal
                open={open}
                title="添加模型"
                okText="添加"
                cancelText="取消"
                onCancel={onCancel}
                onOk={() => {
                    form.validateFields()
                        .then((values) => {
                            form.resetFields();
                            onCreate(values);
                            registerNewModel(values);
                        })
                        .catch((info) => {
                            console.log('验证失败', info);
                        });
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
                        <Form form={form} layout="vertical">
                            <Form.Item name="option" rules={[{ required: true, message: '请选择预设模型！' }]}>
                                <Radio.Group>
                                    <Space direction="vertical">
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
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="name"
                                label="模型名称"
                                rules={[
                                    { required: true, message: '请输入模型名称' },
                                    {
                                        validator: (_, value) => {
                                            if (names.includes(value)) {
                                                return Promise.reject('模型名称已存在，请换一个名字');
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <Input placeholder="请输入模型名称" bordered={false} />
                            </Form.Item>
                            <Form.Item
                                name="path"
                                label="模型URL"
                                rules={[{ required: true, message: '请输入模型URL' }]}
                            >
                                <Input placeholder="请输入模型URL" bordered={false} />
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>
        </>
    );
};
export default NewForm;
