import style from './App.module.less';
import './App.module.less';
import { Button, Form, Input, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import qs from 'qs';
import http from '@/utils/axios';
import eventBus from './utils/eventBus';
import ModelConfig from './components/model/model';

function App() {

    // 全局提示
    const [messageApi, contextHolder] = message.useMessage();
    // 加载按钮
    const [loadings, setLoadings] = useState<boolean[]>([]);
    // 路由跳转
    const navigate = useNavigate();

    const error = (msg: string) => {
        messageApi.open({
            type: 'error',
            content: msg,
        });
    };

    // 进入加载中
    const enterLoading = (index: number) => {
        setLoadings((prevLoadings) => {
            const newLoadings = [...prevLoadings];
            newLoadings[index] = true;
            return newLoadings;
        });

        setTimeout(() => {
            setLoadings((prevLoadings) => {
                const newLoadings = [...prevLoadings];
                newLoadings[index] = false;
                return newLoadings;
            });
        }, 2000);
    };

    // 提交
    const onFinish = (values: any) => {
        const name = values['username'];
        const data = {
            username: name,
        };
        // 登录
        http.post<string, any>('/login/?' + qs.stringify(data))
            .then((res) => {
                if (res.data.code != 200) {
                    error(res.data.msg);
                    return;
                }
                localStorage.clear();
                localStorage.setItem('permission', res.data.data.role);
                localStorage.setItem('username', res.data.data.username);
                if (res.data.data.role == 'debug') {
                    eventBus.emit('banVote', true);
                }
                http.get<string, any>('/get_model_list').then((res) => {
                    let new_model: ModelConfig[] = [];
                    const url_len = res.data.data.length;
                    res.data.data.forEach((url: string) => {
                        http.get<string, any>(url + '/chat/model_info').then((res) => {
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
                            new_model.push(model);
                            // 加载完所有参数才能跳转页面
                            if (url_len == new_model.length) {
                                navigate('/home', { state: new_model });
                            }
                        });
                    });
                });
            })
            .catch((err) => {
                error('登录失败！');
            });
    };

    // 提交失败
    const onFinishFailed = () => {
        error('登录失败！')
    };

    return (
        <>
            {contextHolder}
            <div className={style.container}>
                <div className={style.form}>
                    <div className={style.title}>登录</div>
                    <div className={style.subform}>
                        <Form
                            name="basic"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                            layout="vertical"
                        >
                            <Form.Item
                                label="用户名"
                                name="username"
                                rules={[{ required: true, message: '用户名不能为空' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item wrapperCol={{ offset: 9, span: 16 }}>
                                <>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loadings[0]}
                                        onClick={() => enterLoading(0)}
                                    >
                                        提交
                                    </Button>
                                </>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;
