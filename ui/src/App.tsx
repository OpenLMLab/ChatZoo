import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import style from './App.module.less';
import './App.module.less';
import qs from 'qs';
import http from '@/utils/axios';
import { useState } from 'react';

function App() {
    const [messageApi, contextHolder] = message.useMessage();
    // 加载
    const [loadings, setLoadings] = useState<boolean[]>([]);
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
        }, 7000);
    };

    const error = (msg: string) => {
        messageApi.open({
            type: 'error',
            content: msg,
        });
    };
    const navigate = useNavigate();
    const onFinish = (values: any) => {
        const name = values['username'];
        const data = {
            username: name,
        };
        // 登录
        http.post<string, any>('/login/?' + qs.stringify(data))
            .then((res) => {
                console.log('登陆后', res.data.data.role);
                localStorage.setItem('permission', res.data.data.role);
                localStorage.setItem('username', res.data.data.username);
                console.log('login success');
                navigate('/home');
            })
            .catch(() => {
                error('登录失败！');
            });
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
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
