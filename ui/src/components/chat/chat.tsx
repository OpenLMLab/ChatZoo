import Banner from '@/components/banner/banner';
import ModelConfig from '@/components/model/model';
import { ModeContext } from '@/utils/contexts';
import eventBus from '@/utils/eventBus';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { sessionMesage } from '@/utils/sessionInterface';
import { Input, Select, message } from 'antd';
import PUYUC from 'chat-webkit';
import { sseMesage } from 'chat-webkit/dist/types/components/chat-box/chatInterface';
import { useContext, useEffect, useRef, useState } from 'react';
import styles from './chat.module.less';
import { chatBoxStyle, requestSessageContainerStyle, responseMessageContainerStyle } from './puyuc.chatbox.style';
import http from '@/utils/axios';

/**
 * 1. 获取全局sessionId
 * 2. 读取缓存
 * 3. 进行对话
 * 4. 离开界面时存入缓存
 */
const Chat: React.FC = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const idContext = useContext(IdContext);
    const sessionId = idContext?.id;
    const ref_sessionId = useRef(sessionId)
    const ref_ssefinishCallCount = useRef(0)
    const mode = useContext(ModeContext)?.mode
    const models = useContext(ModelContext)?.models;
    const setModels = useContext(ModelContext)?.setModels
    //  是否暂停模型
    let cachedSessionList = localStorage.getItem(sessionId!);
    const sys_mode = localStorage.getItem("sys_mode")
    if (sys_mode == "evaluation") {
        cachedSessionList = localStorage.getItem("cacheSession")
        var [sessionList, setSessionList] = useState<sessionMesage>(JSON.parse(cachedSessionList!))
    } else {
        var sessionList: sessionMesage = {}
        sessionList = JSON.parse(cachedSessionList!)
    }

    const error = (msg: string) => {
        messageApi.open({
            type: 'error',
            content: msg,
        });
    };

    if (models != null) {
        models.forEach((model) => {
            if (!(model.model_id in sessionList)) {
                // 如果不存在就要初始化一个
                sessionList[model.model_id] = [];
            }
        });
        // setSessionList(new_sessionList)
    }
    const refs = [useRef<any>(), useRef<any>(), useRef<any>(), useRef<any>()];

    //处理数据，以便于保存
    const saveSessionList = (session_ids: string) => {
        let new_session_list: sessionMesage = {};
        // @ts-ignore
        const model_ids = JSON.parse(localStorage.getItem(session_ids + "model_sequeue"))
        refs.map((ref, index) => {
            if (index < model_ids?.length!) {
                new_session_list[model_ids[index]] = ref.current.getSessionList();
            }
        });
        // refs.map((ref, index) => {
        //     if (index < models?.length!) {
        //         new_session_list[models![index].model_id] = ref.current.getSessionList();
        //     }
        // });
        console.log("sessionList", new_session_list)
        Object.keys(new_session_list).forEach(function (key) {
            let session = new_session_list[key];
            if (session.length - 1 >= 0) {
                const last_dict = session[session.length - 1];
                const new_dict: sseMesage = {
                    id: last_dict['id'],
                    status: last_dict['status'],
                    message: last_dict['message'],
                    question: last_dict['question'],
                };
                session[session.length - 1] = new_dict;
            }
            new_session_list[key] = session;
        });
        const sessionList = new_session_list;
        if (model_ids != null)
            model_ids.forEach((model_id: string) => {
                if (!(model_id in sessionList)) {
                    // 如果不存在就要初始化一个
                    sessionList[model_id] = [];
                }
            });
        // setSessionList(sessionList)
        localStorage.setItem(session_ids, JSON.stringify(new_session_list));
    };

    const startSse = (question: string, new_models: ModelConfig[]) => {
        // 判断当前对话是否开始过的事件，用于bottom的标注按钮是否能开启的检测事件
        eventBus.emit("detectChatBegin", true)
        // 开始会话前先保存
        refs.map((ref, index) => {
            if (index < new_models?.length && new_models[index].start) {
                console.log(question);
                ref.current.startSse(question);
            }
        });
    };

    // 监控对话事件，在 bottom 组件调用该事件来向对话组件发送消息
    useEffect(() => {
        const listener = (question: string, modelsr: ModelConfig[]) => {
            // 插入会话
            // 对话开始前， 禁用会话列表, 禁用切换模式, 禁用输入框输入
            eventBus.emit('banSessionList', true); // 禁用会话切换
            eventBus.emit('banModeEvent', true); // 禁用模式
            eventBus.emit('banInputEvent', true); // 禁用输入
            eventBus.emit('banVote', true); // 禁用vote
            eventBus.emit('banStop', true);
            // 开始对话
            if (question === null || question === undefined || question.trim().length === 0) {
                error('不能发送空消息！');
            } else {
                startSse(question, modelsr);
            }
        };
        eventBus.on('sendMessage', listener);
        return () => {
            // 在组件卸载时取消订阅
            eventBus.removeListener('sendMessage', listener);
        };
    }, []);

    const [ifWrap, setIfWrap] = useState(false);
    const [doWrap, updateDoWrap] = useState(styles.noWrap);
    const handleSwitchLayout = () => {
        saveSessionList(sessionId!)
        setIfWrap(!ifWrap)
        updateDoWrap(doWrap == styles.noWrap ? styles.wrap : styles.noWrap);
    };

    useEffect(() => {
        // @ts-ignore 忽略该行的类型检查或警告
        if (models?.length <= 2) {
            updateDoWrap(styles.noWrap)
        }
    }, [models])

    // 修改配置参数,会调用该函数来修改modelconfig
    useEffect(() => {
        const modifyModels = (newModelConfig: ModelConfig, index: number) => {
            saveSessionList(sessionId!)
            const newModels = models?.slice();
            if (newModels !== undefined) {
                newModels[index] = newModelConfig
            }
            // @ts-ignore
            setModels(newModels)
        }
        eventBus.on("modifyModels", modifyModels)
        return () => {
            eventBus.off("modifyModels", modifyModels)
        }
    })

    // 监控会话id变化,如果发现变化就要判断能否保存历史数据。
    useEffect(() => {
        if (ref_sessionId.current != sessionId) {
            refs.map((ref, index) => {
                if (index < models?.length!) {
                    console.log('session_ids改变收到对话', ref.current.getSessionList());
                }
            });
            if (refs[0].current && refs[0].current.getSessionList()) saveSessionList(ref_sessionId.current!);
            ref_sessionId.current = sessionId;
        }
    }, [sessionId]);

    // 模式变化监控到，然后保存数据 需要这个的原因是因为切换模式时候，还没来得及触发 sessionid变化的事件来保存就刷新掉了组件的内容
    useEffect(() => {
        const eventChange = () => {
            console.log('下载会话', refs[0].current.getSessionList())
            if (refs[0].current && refs[0].current.getSessionList()) saveSessionList(sessionId!);
        };
        eventBus.on('modeChangeEvent', eventChange);
        return () => {
            eventBus.off('modeChangeEvent', eventChange);
        };
    });

    useEffect(() => {
        const saveSession = () => {
            saveSessionList(sessionId!);
        };
        eventBus.on('saveSession', saveSession);
        return () => {
            eventBus.removeListener('saveSession', saveSession);
        };
    });

    // 发送voteDict出去
    const sendVoteDict = (models: ModelConfig[]) => {
        // 获取最新的 Dict
        let new_session_list: sessionMesage = {};
        console.log("sendVote", models)
        refs.map((ref, index) => {
            if (index < models?.length!) {
                new_session_list[models![index].model_id] = ref.current.getSessionList();
            }
        });
        // 这里使用model_id : dialogue_id
        let dialogue_ids: { [key: number]: string } = {}
        Object.keys(new_session_list).forEach(function (key) {
            const session = new_session_list[key]
            if (session.length >= 1) {
                const last_dict = session[session.length - 1];
                // @ts-ignore
                dialogue_ids[key] = last_dict['id']
            }
        })
        eventBus.emit('sendVoteDict', dialogue_ids)
    }

    let model_status = [-2, -2, -2, -2]
    const sseFinishCallable = () => {
        ref_ssefinishCallCount.current = ref_ssefinishCallCount.current + 1;
        const models = model_ref.current
        console.log('获取状态', refs[ref_ssefinishCallCount.current - 1].current.getStatus())
        const validNum = models?.filter((model) => model.start === true)?.length ?? 0;
        if (ref_ssefinishCallCount.current == validNum || (refs[ref_ssefinishCallCount.current].current === undefined || refs[ref_ssefinishCallCount.current].current === null)) {
            sendVoteDict(models!);
            // 如果是单回复标注那么要禁用输入框
            if (mode === 'dialogue' || mode === 'model') {
                eventBus.emit('banInputEvent', false);
            } else {
                // 开启标注模式
                eventBus.emit('annotateSession', false, sessionId);
            }
            eventBus.emit('banSessionList', false); // 禁用会话切换
            eventBus.emit('banModeEvent', false); // 开启模式
            eventBus.emit('banVote', false); // 开启标注
            eventBus.emit('banStop', false);
            ref_ssefinishCallCount.current = 0;
            eventBus.emit('beginVoteSession', true, sessionId) // 当前对话完，需要将manager的标注设置为true
            // 第一次问题对话后将左侧列表改为问题未标题
            // if(refs[0] && refs[0].current.getSessionList().length == 0){
            //     console.log(question, "changeChatName")
            //     eventBus.emit('editChat', question, sessionId)
            // }
        }
    };

    useEffect(() => {
        model_ref.current = models
        console.log("model_ref", model_ref)
    }, [models])

    useEffect(() => {
        // 用于标注数据展示的监听函数
        const pageChange = (pageNum: number, pageSize: number) => {
            console.log("[Debug] pageChange ", "eval_page_change", pageNum)
            let newSessionList: sessionMesage = {}
            models?.forEach((model: ModelConfig) => {
                http.post<string, any>(model.url +
                    "/chat/get_ds_instance?" +
                    "ds_name=" + localStorage.getItem("selectDs") +
                    "&query_idx=" + (pageNum - 1)
                ).then(res => {
                    const data = res.data.data
                    newSessionList[model.model_id] = []
                    if (data["exist"])
                        newSessionList[model.model_id].push({
                            id: "1",
                            status: 0,
                            message: data["response"],
                            question: data["prompt"],
                        })
                    if (Object.keys(models).length === Object.keys(newSessionList).length) {
                        localStorage.setItem("cacheSession", JSON.stringify(newSessionList))
                        setSessionList(newSessionList)
                    }
                })
            })
            // models?.forEach((model: ModelConfig) => {
            //     const data = {
            //         ds_name: localStorage.getItem("selectDs"),
            //         start_idx: (pageNum - 1) * pageSize,
            //         end_idx: pageNum * pageSize
            //     }
            //     http.post<any, any>(model.url + "/chat/get_ds_chip?", { data: data }).then((res) => {
            //         const model_id = res.data.data["model_id"]
            //         const rst_list = res.data.data["data"]
            //         const history_data: sseMesage[] = []
            //         rst_list.forEach((rst: any, idx: string) => {
            //             history_data.push({
            //                 id: idx,
            //                 status: 0,
            //                 message: rst["response"],
            //                 question: rst["prompt"],
            //             })
            //         })
            //         sessionList[model_id] = history_data
            //         if (Object.keys(sessionList).length == Object.keys(models).length) {

            //         }
            //     })
            // })
        }
        // 用于manager切换数据集时候更改展示的内容
        const managerDsChange = (new_session_list: sessionMesage) => {
            setSessionList(new_session_list)
        }

        eventBus.on("eval_page_change", pageChange)
        eventBus.on("managerDsChange", managerDsChange)
        return () => {
            eventBus.off("eval_page_change", pageChange)
            eventBus.off("managerDsChange", managerDsChange)
        }
    })

    // 动态计算宽度
    let width = 0
    let height = 0
    // 横屏模式
    const model_ref = useRef(models)
    // console.log('是否换行', doWrap, styles.wrap, models, model_ref)
    if (doWrap === styles.wrap) {
        if (models?.length === 1) {
            width = 100
            height = 80
        } else if (models?.length === 2) {
            width = 100
            height = 40
        } else {
            width = 35
            height = 40
        }
    } else {
        if (models?.length == 1) {
            width = 77
        } else {
            width = 100 / models?.length!
        }
        height = 80
    }
    console.log("sessionList Log", sessionList)

    // 获取当前对话的模式，以便于展示页面上交谈的模型
    const modeName = localStorage.getItem('permission')

    return (
        <>
            {contextHolder}
            <div className={`${styles.chatwrap} ${doWrap}`}>
                {models?.map((model: any, index: number) => (
                    <div className={styles.chatContainer}>
                        <div className={styles.banner}>
                            <Banner
                                model={model}
                                index={index}
                                models={models}
                                handleSwitchLayout={handleSwitchLayout}
                            />
                        </div>
                        <div className={styles.main} key={index + ''} >
                            <div className={`${styles.chatBoxWrap} ${!model.start ? styles.pause : ''}`}>
                                <PUYUC.ChatBox
                                    sseStopCallback={(url) => {
                                        console.log("ssestop", models)
                                        sseFinishCallable();
                                    }}
                                    propsSessionList={sessionList[model.model_id]}
                                    url={
                                        model.url +
                                        '/chat/generate?turn_id=' +
                                        sessionId +
                                        '&username=' +
                                        localStorage.getItem('username') +
                                        '&role=' +
                                        localStorage.getItem('permission')
                                    }
                                    ref={refs[index]}
                                    token={encodeURIComponent(JSON.stringify({ "generate_config": model.generate_kwargs, "stream": model.stream, "prompts": model.prompts }))}
                                    requestMessageContainerStyle={requestSessageContainerStyle}
                                    responseMessageContainerStyle={responseMessageContainerStyle}
                                    style={chatBoxStyle}
                                    userAvatar={<>{localStorage.getItem('username')}</>}
                                    modelAvatar={<>{modeName == 'debug' ? model.nickname : 'Model_' + String.fromCharCode(index + 65)}</>}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default Chat;
