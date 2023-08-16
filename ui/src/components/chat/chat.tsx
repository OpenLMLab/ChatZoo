import ModelConfig from '@/components/model/model';
import { ModeContext } from '@/utils/contexts';
import eventBus from '@/utils/eventBus';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { sessionMesage } from '@/utils/sessionInterface';
import { Input, Modal, Select, message } from 'antd';
import PUYUC from 'chat-webkit';
import { sseMesage } from 'chat-webkit/dist/types/components/chat-box/chatInterface';
import { useContext, useEffect, useRef, useState } from 'react';
import styles from './chat.module.less';
import Banner from '@/components/banner/banner'


/**
 * 1. 获取全局sessionId
 * 2. 读取缓存
 * 3. 进行对话
 * 4. 离开界面时存入缓存
 */
const Chat: React.FC = () => {
  const [openModelConfig, setOpenModelConfig] = useState(false) // 开启 model 的 generate_kwargs 的配置参数
  const [messageApi, contextHolder] = message.useMessage(); 
  const mcf = new ModelConfig(
    "fnlp/moss-moon-003-sft",
    "moss_01",
    "fnlp/moss-moon-003-sft",
    { max_length: 2048 },
    '0',
    {
      meta_prompt: "",
      user_prompt: "Human: {}\n",
      bot_prompt: "\nAssistant: {}\n",
    },
    "http://10.140.1.76:8083",
    true,
    '0',
    true
  )
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
  console.log("chat.tsx headrt", sessionList, cachedSessionList)
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
      content: msg
    });
  };

  if (models != null)
    models.forEach((model) => {
      if (!(model.model_id in sessionList)) {
        // 如果不存在就要初始化一个
        sessionList[model.model_id] = []
      }
    })
  const refs = [useRef<any>(), useRef<any>(), useRef<any>(), useRef<any>()]
  const modelStatus = ['-1', '-1', '-1', '-1']

//处理数据，以便于保存
  const saveSessionList = (session_ids: string) => {
      let new_session_list: sessionMesage = {}
        refs.map((ref, index) => {
          if (index < models?.length!) {
            new_session_list[models![index].model_id] = ref.current.getSessionList()
            console.log('收到对话', ref.current.getSessionList())
          }
        })
        Object.keys(new_session_list).forEach(function (key) {
          let session = new_session_list[key]
          if (session.length - 1 >= 0) {
            const last_dict = session[session.length - 1]
            const new_dict: sseMesage = {
              "id": last_dict["id"],
              "status": last_dict["status"],
              "message": last_dict["message"],
              "question": last_dict["question"]
            }
            session[session.length - 1] = new_dict
          }
          new_session_list[key] = session
        });
        sessionList = new_session_list
        console.log(sessionList)
        if(models != null)
            models.forEach((model) =>{
              if(!(model.model_id in sessionList)){
                  // 如果不存在就要初始化一个
                  sessionList[model.model_id] = []
              }
            })
      localStorage.setItem(session_ids, JSON.stringify(new_session_list))
  }  
  const startSse = (question: string, new_models: ModelConfig[]) => {
    // 开始会话前先保存
    console.log("startSse", new_models, sessionList)
    refs.map((ref, index) => {
      if (index < new_models?.length && new_models[index].start) {
        console.log(question)
        ref.current.startSse(question)
      }
    })
  };
  // 获取状态
  const getSseStatus = () => {
    refs.map((ref, index) => {
      if (index < models?.length!) {
        modelStatus[index] = ref.current.getStatus()
      }
    })
  }

  // 监控对话事件，在 bottom 组件调用该事件来向对话组件发送消息
  useEffect(() => {
    const listener = (question: string, modelsr: ModelConfig[], mode: string, sessionIds: string) => {
      // 插入会话
      // 对话开始前本地先保存一波数据
      // saveSessionList(sessionIds)
      // 对话开始前， 禁用会话列表, 禁用切换模式, 禁用输入框输入
      eventBus.emit('banSessionList', true)  // 禁用会话切换
      eventBus.emit('banModeEvent', true)  // 禁用模式
      eventBus.emit('banInputEvent', true)  // 禁用输入
      eventBus.emit('banVote', true) // 禁用vote
      eventBus.emit('banStop', true)
      // 开始对话
      startSse(question, modelsr)  
    };
    eventBus.on('sendMessage', listener);
    return () => {
      // 在组件卸载时取消订阅
      eventBus.removeListener('sendMessage', listener);
    };
  }, []);

  // 监控会话id变化,如果发现变化就要判断能否保存历史数据。
  useEffect(()=>{
    if(ref_sessionId.current != sessionId){
        refs.map((ref, index) => {
          if (index < models?.length!) {
            console.log('session_ids改变收到对话', ref.current.getSessionList())
          }
        })
        if(refs[0].current && refs[0].current.getSessionList())
            saveSessionList(ref_sessionId.current!)
        console.log(sessionId, "11111111111")
        ref_sessionId.current = sessionId
    } 
  }, [sessionId])

  // 模式变化监控到，然后保存数据 需要这个的原因是因为切换模式时候，还没来得及触发 sessionid变化的事件来保存就刷新掉了组件的内容
  useEffect(()=>{

    const eventChange = (mode:string)=>{
      if(refs[0].current && refs[0].current.getSessionList())
        saveSessionList(sessionId!)
    }
    eventBus.on("modeChangeEvent", eventChange)
    return () => {
    eventBus.off("modeChangeEvent", eventChange)
    }
  })

  useEffect(()=>{
    const saveSession = () => {
      saveSessionList(sessionId!)
    }
    eventBus.on('saveSession', saveSession)
    return () => {
      eventBus.removeListener('saveSession', saveSession);
    }
  })

  const sseFinishCallable = () => {
    console.log("回调函数哦", ref_ssefinishCallCount.current)
    ref_ssefinishCallCount.current = ref_ssefinishCallCount.current + 1
    const validNum = models?.filter(model => model.start === true)?.length ?? 0;
    if(ref_ssefinishCallCount.current == validNum){
        console.log("结束了哦")
            // saveSessionList(sessionId!)
            getSseStatus();
            // downloadSse(modelsr,mode,sessionIds);
            // 如果是单回复标注那么要禁用输入框
            if(mode === 'dialogue' || mode === 'model') {
              eventBus.emit('banInputEvent', false) 
            }else{
              // 开启标注模式
              eventBus.emit("annotateSession", false, sessionId)
            }
            eventBus.emit('banSessionList', false) // 禁用会话切换
            eventBus.emit('banModeEvent', false) // 开启模式
            eventBus.emit('banVote', false) // 开启标注
            eventBus.emit('banStop', false)
            ref_ssefinishCallCount.current = 0
    }
  }

  const [doWrap, updateDoWrap] = useState(styles.noWrap);

  return (
    <>
      {contextHolder}
      <div className={`${styles.chatwrap} ${doWrap}`}>
        {models?.map((model: any, index: number) => (
          <div className={styles.chatContainer}>
            <div className={styles.banner}>
              <Banner model={model} index={index} models={models}/>
            </div>
            <div className={styles.main} key={index + ""}>
              <PUYUC.ChatBox
                sseStopCallback={(url)=>{sseFinishCallable()}}
                propsSessionList={sessionList[model.model_id]}
                url={model.url + "/chat/generate?turn_id=" + sessionId + "&username=" + localStorage.getItem('username') + "&role=" + localStorage.getItem('permission')}
                ref={refs[index]}
                token={JSON.stringify(model.generate_kwargs)}
                requestMessageContainerStyle={{ backgroundColor: 'rgba(39, 45, 230, 0.1)' }}
              />
            </div>
          </div>
        ))}
      </div>


    </>
  );
};

export default Chat;
