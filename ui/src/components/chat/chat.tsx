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
  const setModels = useContext(ModelContext)
  //  是否暂停模型
  const cachedSessionList = localStorage.getItem(sessionId!);
  let sessionList: sessionMesage = {}
  sessionList = JSON.parse(cachedSessionList!)
  // 判断是否有一条消息
  const keys = Object.keys(sessionList)
  if (keys.length != 0) {
    if (sessionList[keys[0]][0]) {
      const firstMsg = sessionList[keys[0]][0]['question']
      eventBus.emit('editChat', firstMsg, sessionId)
    }
  }

    const error = (msg: string) => {
        messageApi.open({
            type: 'error',
            content: msg,
        });
    };

    if (models != null)
        models.forEach((model) => {
            if (!(model.model_id in sessionList)) {
                // 如果不存在就要初始化一个
                sessionList[model.model_id] = [];
            }
        });
    const refs = [useRef<any>(), useRef<any>(), useRef<any>(), useRef<any>()];

    //处理数据，以便于保存
    const saveSessionList = (session_ids: string) => {
        let new_session_list: sessionMesage = {};
        refs.map((ref, index) => {
            if (index < models?.length!) {
                new_session_list[models![index].model_id] = ref.current.getSessionList();
            }
        });
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
        sessionList = new_session_list;
        if (models != null)
            models.forEach((model) => {
                if (!(model.model_id in sessionList)) {
                    // 如果不存在就要初始化一个
                    sessionList[model.model_id] = [];
                }
            });
        localStorage.setItem(session_ids, JSON.stringify(new_session_list));
    };

    const startSse = (question: string, new_models: ModelConfig[]) => {
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
        const listener = (question: string, modelsr: ModelConfig[], mode: string, sessionIds: string) => {
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
            console.log('下载会话',refs[0].current.getSessionList() )
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
    const sendVoteDict = () => {
      // 获取最新的 Dict
      let new_session_list: sessionMesage = {};
      refs.map((ref, index) => {
        if(index < models?.length!) {
          new_session_list[models![index].model_id] = ref.current.getSessionList();
        }
      });
      // 这里使用model_id : dialogue_id
      let dialogue_ids: { [key: number]: string } = {}
      Object.keys(new_session_list).forEach(function (key) {
        const session = new_session_list[key]
        if(session.length >= 1) {
          const last_dict = session[session.length - 1];
          dialogue_ids[ key ] = last_dict['id']
        }
      })
      eventBus.emit('sendVoteDict', dialogue_ids)
    }

    const sseFinishCallable = () => {
        ref_ssefinishCallCount.current = ref_ssefinishCallCount.current + 1;
        console.log('当前的模型是', models)
        const validNum = models?.filter((model) => model.start === true)?.length ?? 0;
        console.log('合法的数量', validNum)
        if (ref_ssefinishCallCount.current == validNum) {
            sendVoteDict();
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
        }
    };

    // 动态计算宽度
    let width = 0
    let height = 0
    // 横屏模式
    console.log('是否换行', doWrap, styles.wrap)
    if(doWrap === styles.wrap) {
      if(models?.length === 1) {
        width = 100
        height = 80
      } else if(models?.length === 2) {
        width = 100
        height = 40
      } else {
        width = 40
        height = 40
      }
    } else {
      width = 150 / models?.length!
      height = 80
    }

    return (
        <>
            {contextHolder}
            <div className={`${styles.chatwrap} ${doWrap}`}>
                {models?.map((model: any, index: number) => (
                    <div className={styles.chatContainer} style={{width: width.toString() + 'vh', height: height.toString() + 'vh'}}>
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
                                    token={JSON.stringify(model.generate_kwargs)}
                                    requestMessageContainerStyle={requestSessageContainerStyle}
                                    responseMessageContainerStyle={responseMessageContainerStyle}
                                    style={chatBoxStyle}
                                    userAvatar = {<>{localStorage.getItem('username')}</>}
                                    modelAvatar = {<>{model.nickname}</>}
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
