import { useRef, useContext, useState, useEffect } from 'react';
import styles from './chat.module.less';
import PUYUC from 'chat-webkit';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { Tooltip, Modal, Select, Input } from 'antd';
import ModelConfig from '@/components/model/model';
import { sseMesage } from 'chat-webkit/dist/types/components/chat-box/chatInterface';
import eventBus from '@/utils/eventBus';
import {sessionMesage} from '@/utils/sessionInterface'
import { ModeContext } from '@/utils/contexts';


/**
 * 1. 获取全局sessionId
 * 2. 读取缓存
 * 3. 进行对话
 * 4. 离开界面时存入缓存
 */
const Chat: React.FC = () => {
  const [openModelConfig, setOpenModelConfig] = useState(false) // 开启 model 的 generate_kwargs 的配置参数
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
  const [modalConfig, setModalConfig] = useState<ModelConfig>(mcf); // 开启 model 的 title 名字开关
  const idContext = useContext(IdContext);
  const sessionId = idContext?.id;
   // 用户的角色， 用于决定是否渲染模型管理
  const role = localStorage.getItem('permission')  
  console.log('当前会话', sessionId)
  const models = useContext(ModelContext)?.models;
  const setModels = useContext(ModelContext)
  //  是否暂停模型
  
  const cachedSessionList = localStorage.getItem(sessionId!);
  // let sessionList: sseMesage[][] = [];
  let sessionList: sessionMesage = {}
  if(cachedSessionList != null && cachedSessionList != undefined) {
    sessionList = JSON.parse(cachedSessionList)
  }

  if(models != null)
      models.forEach((model) =>{
        if(!(model.model_id in sessionList)){
            // 如果不存在就要初始化一个
            sessionList[model.model_id] = []
        }
      })
  const refs = [useRef<any>(), useRef<any>(), useRef<any>(), useRef<any>()]
  const modelStatus = ['-1', '-1', '-1', '-1']

  // funtions
  const handleOpenModal = (model_info: ModelConfig) => {
    setOpenModelConfig(true)
    setModalConfig(model_info)
  }

  const startSse = (question: string, new_models: ModelConfig[]) => {
    // 开始会话前先保存
    console.log("startSse", new_models, sessionList)
    refs.map((ref, index) => {
      if(index < new_models?.length && new_models[index].start) {
        console.log(question)
        ref.current.startSse(question)
      }
    })
  };
  // 获取状态
  const getSseStatus = () => {
    refs.map((ref, index) => {
      if(index < models?.length!) {
        console.log('模型', index, '的状态是', ref.current.getStatus())
        modelStatus[index] =  ref.current.getStatus()
      }
    })
    console.log('打印当前状态', modelStatus)
  }

  const downloadSse = (new_models: ModelConfig[], sessionId:string) => {
    let new_session_list: sessionMesage = {}
    refs.map((ref, index) => {
      if(index < new_models?.length!) {
        new_session_list[new_models[index].model_id] = ref.current.getSessionList()
        // new_session_list.push(ref.current.getSessionList())
        console.log('收到对话', ref.current.getSessionList())
      }
    })
    Object.keys(new_session_list).forEach(function(key) {
        let session = new_session_list[key]
        if(session.length - 1 >= 0) {
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
    console.log('最新的session', new_session_list)
    localStorage.setItem(sessionId!, JSON.stringify(new_session_list))
    console.log('已经保存到', sessionId)
  };
  // 关闭某个模型
  const closeModel = (close_Model: ModelConfig, index: number, models: ModelConfig[]) => {
    // 传入要关闭模型的index
    console.log("关闭模型", close_Model, index)
    let new_models: ModelConfig[] = []
    new_models = models?.filter((_,item) => item != index)
    console.log(new_models)
    setModels?.setModels(new_models);
    console.log(models, new_models)
  }
  // 暂停某个模型的对话
  const stopModelSse = (stopModel: ModelConfig, index: number, models: ModelConfig[]) => {
      console.log("暂停模型", stopModel, index)
      const new_models = models.slice()
      new_models[index].start = !new_models[index].start
      console.log(new_models)
      setModels?.setModels(new_models);
  }
  const { TextArea } = Input;
  const {Option} = Select

  useEffect(() => {
    const listener = (question: string, models: ModelConfig[], mode:string, sessionId: string) => {
      // 插入会话
      if(models != null)
          models.forEach((model) =>{
            if(!(model.model_id in sessionList)){
                // 如果不存在就要初始化一个
                sessionList[model.model_id] = []
            }
          })
      // 开始对话
      startSse(question, models)
      // 异步保存缓存
      setTimeout(() => {
        getSseStatus();
        downloadSse(models, sessionId);
        if(mode === 'single') {
          eventBus.emit('input', false) 
        }
      }, 5000); // 延迟时间为 1000 毫秒（1秒）
    };
    eventBus.on('sendMessage', listener);
    return () => {
      // 在组件卸载时取消订阅
      eventBus.removeListener('sendMessage', listener);
    };
  }, []);
  
  return (
    <>
      <Modal
        title={<span className={styles.modelConfigTile}>{modalConfig.nickname}模型配置</span>}
        centered
        cancelText="取消"
        okText="保存"
        open={openModelConfig}
        onOk={() => setOpenModelConfig(false)}
        onCancel={() => setOpenModelConfig(false)}
        className={styles.modelConfig}
      >
        <div className={styles.modelConfigItem }>
          <div className={styles.modelConfigItemInput}>stream</div>
          <Select defaultValue={modalConfig.stream}
              style={{ width: 120 }}
              options={[
                { value: false, label: 'false' },
                { value: true, label: 'true' },
              ]} />
        </div>
             
        <div className={styles.modelConfigItem }>
              <div className={styles.modelConfigItemInput}>meta_prompt</div>
              <TextArea rows={4} placeholder="meta_prompt is" maxLength={6} />
        </div>

        <div className={styles.modelConfigItem }>
          <div className={styles.tooltipTitle}>user_prompt</div>
                <TextArea rows={4} placeholder="user_prompt is" maxLength={6} />
        </div>
              
        
        <div className={styles.modelConfigItem }>
            <div className={styles.tooltipTitle}>bot_prompt</div>
            <TextArea rows={4} placeholder="bot_prompt is" maxLength={6} />
        </div>
              
        
        <div className={styles.modelConfigItem }>

            {Object.entries(modalConfig.generate_kwargs).map(([key, value]) => (
            <div key={key}>
              <div className={styles.tooltipTitle}>{key}</div>
              <Input value={value} />
            </div>
          ))}

        </div>

      </Modal>
      {models?.map((model: any, index: number) => (
        <div className={styles.chatContainer}>
          <div className={styles.banner}>
            <div className={styles.typo}>
              {model.nickname}
            </div>
            <div className={styles.func}>
              <Tooltip title={<span className={styles.tooltipTitle}>暂停模型对话</span>}>
                  <div  onClick={() => stopModelSse(model, index, models)}>
                    {model.start ? (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9.43701 7.95312C9.9893 7.95312 10.437 8.40084 10.437 8.95312V15.0786C10.437 15.6308 9.9893 16.0786 9.43701 16.0786C8.88473 16.0786 8.43701 15.6308 8.43701 15.0786V8.95312C8.43701 8.40084 8.88473 7.95312 9.43701 7.95312Z" fill="white" fill-opacity="0.85" />
                        <path d="M15.5269 8.95312C15.5269 8.40084 15.0791 7.95312 14.5269 7.95312C13.9746 7.95312 13.5269 8.40084 13.5269 8.95312V15.0786C13.5269 15.6308 13.9746 16.0786 14.5269 16.0786C15.0791 16.0786 15.5269 15.6308 15.5269 15.0786V8.95312Z" fill="white" fill-opacity="0.85" />
                        <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" fill="white" fill-opacity="0.85" />
                    </svg>): (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M16.4742 13.183C16.7453 12.9964 16.9072 12.6883 16.9072 12.3592C16.9072 12.0301 16.7453 11.7221 16.4742 11.5355L10.7867 7.62062C10.4807 7.41 10.0832 7.38634 9.75443 7.55918C9.42563 7.73202 9.21973 8.07288 9.21973 8.44434L9.21973 16.2741C9.21973 16.6456 9.42563 16.9864 9.75443 17.1593C10.0832 17.3321 10.4807 17.3085 10.7867 17.0979L16.4742 13.183ZM11.2197 14.3718V10.3467L14.1435 12.3592L11.2197 14.3718Z" fill="white" fill-opacity="0.85"/>
                        <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" fill="white" fill-opacity="0.85"/>
                      </svg>
                    )}
                    
                  </div>
              </Tooltip>
              <Tooltip title={<span className={styles.tooltipTitle}>设置</span>}>
                  {(role == "debug")? (
                    <div onClick={() => handleOpenModal(model)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M8.43489 3.09853C8.61523 2.4493 9.20636 2 9.88017 2H14.1201C14.7939 2 15.385 2.4493 15.5654 3.09853L16.0767 4.93928L17.9266 4.46169C18.579 4.29325 19.2637 4.58053 19.6006 5.16407L21.7206 8.83594C22.0575 9.41948 21.9639 10.1561 21.4918 10.6369L20.1534 12L21.4918 13.3632C21.9639 13.8439 22.0575 14.5805 21.7206 15.1641L19.6006 18.8359C19.2637 19.4195 18.579 19.7068 17.9266 19.5383L16.0767 19.0607L15.5654 20.9015C15.385 21.5507 14.7939 22 14.1201 22H9.88017C9.20635 22 8.61523 21.5507 8.43489 20.9015L7.9236 19.0608L6.07405 19.5383C5.42163 19.7068 4.73696 19.4195 4.40005 18.8359L2.2801 15.1641C1.94319 14.5805 2.03674 13.8439 2.50882 13.3632L3.84725 12L2.50882 10.6369C2.03674 10.1561 1.94319 9.41948 2.2801 8.83594L4.40005 5.16407C4.73696 4.58053 5.42163 4.29325 6.07405 4.46169L7.9236 4.93918L8.43489 3.09853ZM10.2602 4L9.71924 5.94749C9.50038 6.73539 8.69077 7.20282 7.899 6.99841L5.94208 6.49319L4.20217 9.50681L5.6183 10.9491C6.19121 11.5326 6.19121 12.4674 5.6183 13.0509L4.20217 14.4932L5.94208 17.5068L7.89901 17.0016C8.69078 16.7972 9.50038 17.2646 9.71924 18.0525L10.2602 20H13.74L14.281 18.0524C14.4999 17.2645 15.3095 16.7971 16.1013 17.0015L18.0586 17.5068L19.7985 14.4932L18.3824 13.0509C17.8095 12.4674 17.8095 11.5326 18.3824 10.9491L19.7985 9.50681L18.0586 6.49319L16.1013 6.99851C15.3095 7.20292 14.4999 6.73549 14.281 5.94759L13.74 4H10.2602ZM12.0001 10C10.8956 10 10.0001 10.8954 10.0001 12C10.0001 13.1046 10.8956 14 12.0001 14C13.1047 14 14.0001 13.1046 14.0001 12C14.0001 10.8954 13.1047 10 12.0001 10ZM8.00012 12C8.00012 9.79086 9.79099 8 12.0001 8C14.2093 8 16.0001 9.79086 16.0001 12C16.0001 14.2091 14.2093 16 12.0001 16C9.79099 16 8.00012 14.2091 8.00012 12Z" fill="white" fill-opacity="0.85" />
                    </svg>
                  </div>
                  ):
                  <div onClick={() => handleOpenModal(model)} style={{display: 'none'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M8.43489 3.09853C8.61523 2.4493 9.20636 2 9.88017 2H14.1201C14.7939 2 15.385 2.4493 15.5654 3.09853L16.0767 4.93928L17.9266 4.46169C18.579 4.29325 19.2637 4.58053 19.6006 5.16407L21.7206 8.83594C22.0575 9.41948 21.9639 10.1561 21.4918 10.6369L20.1534 12L21.4918 13.3632C21.9639 13.8439 22.0575 14.5805 21.7206 15.1641L19.6006 18.8359C19.2637 19.4195 18.579 19.7068 17.9266 19.5383L16.0767 19.0607L15.5654 20.9015C15.385 21.5507 14.7939 22 14.1201 22H9.88017C9.20635 22 8.61523 21.5507 8.43489 20.9015L7.9236 19.0608L6.07405 19.5383C5.42163 19.7068 4.73696 19.4195 4.40005 18.8359L2.2801 15.1641C1.94319 14.5805 2.03674 13.8439 2.50882 13.3632L3.84725 12L2.50882 10.6369C2.03674 10.1561 1.94319 9.41948 2.2801 8.83594L4.40005 5.16407C4.73696 4.58053 5.42163 4.29325 6.07405 4.46169L7.9236 4.93918L8.43489 3.09853ZM10.2602 4L9.71924 5.94749C9.50038 6.73539 8.69077 7.20282 7.899 6.99841L5.94208 6.49319L4.20217 9.50681L5.6183 10.9491C6.19121 11.5326 6.19121 12.4674 5.6183 13.0509L4.20217 14.4932L5.94208 17.5068L7.89901 17.0016C8.69078 16.7972 9.50038 17.2646 9.71924 18.0525L10.2602 20H13.74L14.281 18.0524C14.4999 17.2645 15.3095 16.7971 16.1013 17.0015L18.0586 17.5068L19.7985 14.4932L18.3824 13.0509C17.8095 12.4674 17.8095 11.5326 18.3824 10.9491L19.7985 9.50681L18.0586 6.49319L16.1013 6.99851C15.3095 7.20292 14.4999 6.73549 14.281 5.94759L13.74 4H10.2602ZM12.0001 10C10.8956 10 10.0001 10.8954 10.0001 12C10.0001 13.1046 10.8956 14 12.0001 14C13.1047 14 14.0001 13.1046 14.0001 12C14.0001 10.8954 13.1047 10 12.0001 10ZM8.00012 12C8.00012 9.79086 9.79099 8 12.0001 8C14.2093 8 16.0001 9.79086 16.0001 12C16.0001 14.2091 14.2093 16 12.0001 16C9.79099 16 8.00012 14.2091 8.00012 12Z" fill="white" fill-opacity="0.85" />
                    </svg>
                  </div> }
              </Tooltip>
              
              <Tooltip title={<span className={styles.tooltipTitle}>关闭</span>}>
                  {(role == "debug") ?(
                    <div onClick={() => closeModel(model, index, models)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M19.4523 5.89065C19.8421 5.49943 19.841 4.86626 19.4497 4.47644C19.0585 4.08662 18.4253 4.08775 18.0355 4.47898L11.9851 10.5511L5.91311 4.50085C5.52189 4.11103 4.88872 4.11217 4.4989 4.50339C4.10908 4.89462 4.11021 5.52778 4.50144 5.9176L10.5735 11.9679L4.45398 18.1093C4.06416 18.5006 4.06529 19.1337 4.45652 19.5236C4.84774 19.9134 5.48091 19.9122 5.87073 19.521L11.9902 13.3795L18.1318 19.4991C18.523 19.889 19.1562 19.8878 19.546 19.4966C19.9358 19.1054 19.9347 18.4722 19.5435 18.0824L13.4019 11.9628L19.4523 5.89065Z" fill="white" fill-opacity="0.85" />
                    </svg>
                  </div>
                  ):(
                    <div style={{display: 'none'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M19.4523 5.89065C19.8421 5.49943 19.841 4.86626 19.4497 4.47644C19.0585 4.08662 18.4253 4.08775 18.0355 4.47898L11.9851 10.5511L5.91311 4.50085C5.52189 4.11103 4.88872 4.11217 4.4989 4.50339C4.10908 4.89462 4.11021 5.52778 4.50144 5.9176L10.5735 11.9679L4.45398 18.1093C4.06416 18.5006 4.06529 19.1337 4.45652 19.5236C4.84774 19.9134 5.48091 19.9122 5.87073 19.521L11.9902 13.3795L18.1318 19.4991C18.523 19.889 19.1562 19.8878 19.546 19.4966C19.9358 19.1054 19.9347 18.4722 19.5435 18.0824L13.4019 11.9628L19.4523 5.89065Z" fill="white" fill-opacity="0.85" />
                    </svg>
                  </div>
                  )
                  
                  }
                  
              </Tooltip>
              
            </div>
          </div>
          <div className={styles.main} key={index+""}>
            <PUYUC.ChatBox
              propsSessionList={sessionList[model.model_id]}
              url={model.url+"/chat/generate?turn_id="+sessionId+"&username="+localStorage.getItem('username')+"&role="+localStorage.getItem('permission')}
              ref={refs[index]}
              token={JSON.stringify(model.generate_kwargs)}
            />
          </div>
        </div>
      ))}
    </>
  );
};

export default Chat;
