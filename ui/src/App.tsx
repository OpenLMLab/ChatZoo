import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import style from './App.module.less';
import './App.module.less';
import qs from 'qs';
import http from '@/utils/axios';
import { useState } from 'react';
import eventBus from './utils/eventBus';
import ModelConfig from './components/model/model';

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
        }, 2000);
    };

    const error = (msg: string) => {
        messageApi.open({
            type: 'error',
            content: msg
        });
    };
    const navigate = useNavigate();
    const onFinish = (values: any) => {
        const name = values['username'];
        const data = {
            username: name,
        };
        // 登录
        http.post<string,any>('/login/?'+qs.stringify(data)).then((res) => {
          console.log('登陆后的信息', res.data)
          if(res.data.code === 403) {
            error(res.data.msg)
            return;
          }
          localStorage.clear();
          localStorage.setItem('permission', res.data.data.role);
          localStorage.setItem('username', res.data.data.username);
          if(res.data.data.role == 'debug'){
            eventBus.emit("banVote", true)
          }
          http.get<string, any>("/get_model_list").then(res=>{
            console.log(res.data.data)
            let new_model: ModelConfig[] = []
            const url_len = res.data.data.length
            console.log(res.data.data.length, "111111111")
            res.data.data.forEach((url: string) => {
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
                    new_model.push(model)
                    // 加载完所有参数才能跳转页面
                    console.log(url_len, new_model.length)
                    if(url_len == new_model.length){
                        navigate('/home', {state: new_model});   
                    }
                         
                });
            })

            // eventBus.emit("initModels", res.data.data)
            console.log("获取标注数据")
            })
                
        }).catch((err) => {
            console.log('错误信息', err)
            error("登录失败！")
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
