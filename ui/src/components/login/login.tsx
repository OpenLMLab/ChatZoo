import { Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import style from './login.module.less';

function Login () {
    const navigate = useNavigate();

    const onFinish = (values: any) => {
        console.log('Success:', values);
        // Handle login here.
        navigate('/');
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <div className={style.container}>
            <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item label="用户名" name="Username" rules={[{ required: true, message: '用户名不能为空' }]}>
                    <Input />
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit">
                        提交
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Login;
