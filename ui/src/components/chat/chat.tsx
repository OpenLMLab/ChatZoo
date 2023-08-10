import React,{  useContext, useRef, useEffect, useState } from 'react';
import {message} from 'antd';
import styles from './chat.module.less';
import PUYUC from '@puyu/components';
import { FreezeContext } from '@/utils/freezecontext';
import ModelConfig from "@/components/model/model";
import { IdContext } from '@/utils/idcontexts';

/**
 * 除去Model原有的属性外需要SessionID
 */
interface CustomModelConfig extends ModelConfig {
  sessionId: string | null
}

interface ChatListProps {
  models: CustomModelConfig[];
  // question: string | null | undefined;
}

enum allStatus {
  loading = 3, // 发起请求5s 内，无消息
  pending = 4, // 发起请求5s 后，无消息 
  active = 1, // 接收到event stream，流式输出中
  error = -1, // 接收出错
  finished = 0, //接收完成
  toolong = -20003, // 会话超长
  modelClose = -20008, // 模型关闭
  backendTimeout = -20015, // 会话中，后端超时
}

interface sseMesage {
  id: number; // 聊天id
  status: allStatus; // 对话状态  0：对话停止状态 2:对话进行中
  message: string; // 对话回复信息
  question: string; // 对话问题A
}

const Chat: React.FC<ChatListProps> = ({models}) => {
  const sessionId = useContext(IdContext)?.id;
  // const [messageApi, contextHolder] = message.useMessage();
  // const freeze = useContext(FreezeContext);
  const cachedSessionList = localStorage.getItem('sessionList' + sessionId);
  let sessionList = [[]];
  if(cachedSessionList != null) {
    sessionList = JSON.parse(cachedSessionList)
    console.log('读取缓存', sessionList)
  }
  // if(cachedSessionList != null) {
  //   const cacheList = cachedSessionList;
    // 如果当前是一个新的会话
    // 则创建模型个数的数组 这里暂定为2次
    // if(cacheList.length === 0) {
    //   for(let i=0; i<2; i++) {
    //     cacheList.push([]);
    //   }
    //   localStorage.setItem('sessionList'+sessionId, cacheList)
    // }
    // setSessionList(cacheList);
  // } else {
  //   for(let i=0; i<2; i++) {
  //     sessionList.push([]);
  //   }
  //   localStorage.setItem('sessionList'+'1', JSON.stringify(sessionList))
  //   console.log('会话', sessionList)
  // }
  // console.log(sessionList)
  // if(cachedSessionList != null) {
  //   const cureList =  JSON.parse(cachedSessionList);
  //   if(cureList.length() == 0) {
  //     const tmpList = new Array;
  //     for(let i=0; i<2; i++) {
  //       tmpList.push([]);
  //     }
  //     setSessionList(tmpList);
  //   }
  //   console.log('最终', sessionList)
  //   // setSessionList(JSON.parse(cachedSessionList));
  // } else {
  //   for(let i=0; i<2; i++) {
  //     sessionList.push([]);
  //   }
  // }
  // for(let i=0; i<2; i++) {
  //     sessionList.push([]);
  //   }
  // console.log("会话", sessionList)
  /**
   * 根据sessionId自行获取sessionList
   * 如果sessionList为空，则可以自由切换，否则锁定选项。
   */
  // if(sessionList.length == 0) {
  //   /**锁定单选框*/
  //   freeze?.setFreeze('yes');
  // } else {
  //   freeze?.setFreeze('no');
  // }
  const refs = new Array;
  for(let i=0; i<2; i++) {
    refs.push(useRef<any>())
  }

  console.log('refs', refs)
  // // const error = () => {
  // //   messageApi.open({
  // //     type: 'error',
  // //     content: '不能发送空消息！',
  // //   });
  // // };

  const startSse = () => {
    refs.map((ref: any) => ref.current.startSse('hello'));
  };

  const stopSse = () => {
    refs.map((ref: any, index:number) => sessionList[index] = ref.current.getSessionList());
    localStorage.setItem('sessionList' + sessionId, JSON.stringify(sessionList))
    console.log('更新缓存')
  }

  // useEffect(() => {
  //   // 从缓存中读取sessionList
  //   const cachedSessionList = localStorage.getItem('sessionList'+sessionId);
  //   if (cachedSessionList) {
  //     setSessionList(JSON.parse(cachedSessionList));
  //   }
  // }, [sessionId]);

  // useEffect(() => {
  //   localStorage.setItem('sessionList'+sessionId, JSON.stringify(sessionList));
  // }, [sessionList]);


  return (
    <>
      {/* {contextHolder} */}
      <div className={styles.chatContainer}>
        {
          models.map((model: CustomModelConfig, index: number) => (
            <>
            <>{model.sessionId}</>
              <PUYUC.ChatBox
              propsSessionList={sessionList[0]}
              url={'http://10.140.0.151:8081/chat/generate?turn_id='+sessionId+'&username=gtl&role=annotate'}
              ref={refs[0]}
          /> 
              <PUYUC.ChatBox
              propsSessionList={sessionList[1]}
              url={'http://10.140.0.151:8081/chat/generate?turn_id='+sessionId+'&username=gtl&role=annotate'}
              ref={refs[1]}
          /> 
          </>
          ))
        }
      </div>
      <button onClick={startSse}>开始会话</button>
      <button onClick={stopSse}>停止会话</button>
      {/* <button onClick={reGenerate}>重试</button>
      <button onClick={getSseStatus}>获取状态</button> */}
    </>
  );
};

export default Chat;