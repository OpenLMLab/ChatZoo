import { Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import style from './App.module.less';
import './App.module.less'

function App () {
    const navigate = useNavigate();

    const onFinish = (values: any) => {
        const level = values['username']
        // 更换权限设置
        localStorage.setItem('permission', level)
        navigate('/home');
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <div className={style.container}>
          <div className={style.form}>
            <div className={style.title}>
              登录
            </div>
            <div className={style.subform}>
              <Form
                    name="basic"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    layout='vertical'
                >
                    <Form.Item label="用户名" name="username" rules={[{ required: true, message: '用户名不能为空' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 9, span: 16 }}>
                      <>
                        <Button type="primary" htmlType="submit">
                              提交
                          </Button>
                      </>
                    </Form.Item>
                </Form>
            </div>
          </div>
        </div>
    );
};

export default App;
