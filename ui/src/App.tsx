import style from './App.module.less';
import './App.module.less';
import { Button, Form, Input, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import qs from 'qs';
import http from '@/utils/axios';
import eventBus from './utils/eventBus';
import ModelConfig from './components/model/model';
import { sessionMesage } from './utils/sessionInterface';

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
                let selectDs = ""
                localStorage.clear();
                localStorage.setItem('permission', res.data.data.role);
                localStorage.setItem('username', res.data.data.username);
                localStorage.setItem('sys_mode', res.data.data.sys_mode)
                if (res.data.data.role == 'debug') {
                    eventBus.emit('banVote', true);
                }
                http.get<string, any>("/get_label_prompt").then((res) => {
                    const label_prompts = res.data.data
                    console.log(label_prompts, "自定义的标签或者默认的标注标签")
                    localStorage.setItem("label_prompt", JSON.stringify(label_prompts))
                })

                http.get<string, any>("/get_session_list").then((res) => {
                    const dataset_name = res.data.data
                    console.log(res.data, "获取数据集的名字")
                    if (res.data.code == 200) {
                        console.log(dataset_name, "获取数据集的名字")
                        selectDs = dataset_name[0]
                        localStorage.setItem("selectDs", selectDs)
                        localStorage.setItem("dataset_name", JSON.stringify(dataset_name))
                    }
                })

                // 获取关键词然后存储到localStorage
                // http.get<string, any>("/get_keywords").then((res)=>{
                //     const kw =res.data.data
                //     console.log(kw, "加载自定义的关键词")
                //     localStorage.setItem("kws", JSON.stringify(kw))
                // })

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
                                if (localStorage.getItem("sys_mode") !== "evaluation")
                                    navigate('/home', { state: new_model });
                                else {
                                    let modelsMap = {}
                                    new_model.forEach((res) => {
                                        // @ts-ignore
                                        modelsMap[res.model_id] = res
                                    })
                                    localStorage.setItem("modelsMap", JSON.stringify(modelsMap))
                                    // 初始化Evaluation会话的内容
                                    let sessionList: sessionMesage = {}
                                    const query_len = url_len
                                    new_model.forEach((model_: ModelConfig) => {
                                        http.post<string, any>(model_.url +
                                            "/chat/get_ds_instance?" +
                                            "ds_name=" + selectDs +
                                            "&query_idx=" + "0"
                                        ).then(res => {
                                            const data = res.data.data
                                            sessionList[model_.model_id] = []
                                            if (data["exist"])
                                                sessionList[model_.model_id].push({
                                                    id: "1",
                                                    status: 0,
                                                    message: data["response"],
                                                    question: data["prompt"],
                                                })
                                            if (query_len === Object.keys(sessionList).length) {
                                                localStorage.setItem("cacheSession", JSON.stringify(sessionList))
                                                navigate('/home', { state: new_model });
                                            }
                                        })
                                    })
                                }
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
