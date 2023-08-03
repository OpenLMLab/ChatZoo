import { Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import style from './login.module.less';
import { AuthContext, PermissionLevel } from '../../utils/AuthContext';
import { useState } from 'react';

function Login () {
    const navigate = useNavigate();
    // 创建状态变量
    const [permissionLevel, setPermissionLevel] = useState(PermissionLevel.Debugger);

    const onFinish = (values: any) => {
        const level = values['username']
        // 更换权限设置
        if(level === 'admin') {
            setPermissionLevel(PermissionLevel.Admin)
        } else if (level === 'debugger') {
            
            setPermissionLevel(PermissionLevel.Debugger)
        } else {
            setPermissionLevel(PermissionLevel.Annotator)
        }
        navigate('/');
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <AuthContext.Provider value={ {permissionLevel} }>
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
                    <Form.Item label="用户名" name="username" rules={[{ required: true, message: '用户名不能为空' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            提交
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </AuthContext.Provider>
    );
};

export default Login;
