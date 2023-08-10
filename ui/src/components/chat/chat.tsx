import { useRef, useContext } from 'react';

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
      {models.map((model: any, index: number) => (
        <div key={index} className={styles.chatContainer}>
          <div className={styles.banner}>
            <div className={styles.typo}>
              {model.nickname}
            </div>
            <div className={styles.func}>
              {/* 图标应该怎么引入？应该不是直接复制 svg 吧？
              有一些图标 antd icons 里没有，所以这里先写 svg */}
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9.43701 7.95312C9.9893 7.95312 10.437 8.40084 10.437 8.95312V15.0786C10.437 15.6308 9.9893 16.0786 9.43701 16.0786C8.88473 16.0786 8.43701 15.6308 8.43701 15.0786V8.95312C8.43701 8.40084 8.88473 7.95312 9.43701 7.95312Z" fill="white" fill-opacity="0.85" />
                  <path d="M15.5269 8.95312C15.5269 8.40084 15.0791 7.95312 14.5269 7.95312C13.9746 7.95312 13.5269 8.40084 13.5269 8.95312V15.0786C13.5269 15.6308 13.9746 16.0786 14.5269 16.0786C15.0791 16.0786 15.5269 15.6308 15.5269 15.0786V8.95312Z" fill="white" fill-opacity="0.85" />
                  <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" fill="white" fill-opacity="0.85" />
                </svg>
              </div>
              <div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8.43489 3.09853C8.61523 2.4493 9.20636 2 9.88017 2H14.1201C14.7939 2 15.385 2.4493 15.5654 3.09853L16.0767 4.93928L17.9266 4.46169C18.579 4.29325 19.2637 4.58053 19.6006 5.16407L21.7206 8.83594C22.0575 9.41948 21.9639 10.1561 21.4918 10.6369L20.1534 12L21.4918 13.3632C21.9639 13.8439 22.0575 14.5805 21.7206 15.1641L19.6006 18.8359C19.2637 19.4195 18.579 19.7068 17.9266 19.5383L16.0767 19.0607L15.5654 20.9015C15.385 21.5507 14.7939 22 14.1201 22H9.88017C9.20635 22 8.61523 21.5507 8.43489 20.9015L7.9236 19.0608L6.07405 19.5383C5.42163 19.7068 4.73696 19.4195 4.40005 18.8359L2.2801 15.1641C1.94319 14.5805 2.03674 13.8439 2.50882 13.3632L3.84725 12L2.50882 10.6369C2.03674 10.1561 1.94319 9.41948 2.2801 8.83594L4.40005 5.16407C4.73696 4.58053 5.42163 4.29325 6.07405 4.46169L7.9236 4.93918L8.43489 3.09853ZM10.2602 4L9.71924 5.94749C9.50038 6.73539 8.69077 7.20282 7.899 6.99841L5.94208 6.49319L4.20217 9.50681L5.6183 10.9491C6.19121 11.5326 6.19121 12.4674 5.6183 13.0509L4.20217 14.4932L5.94208 17.5068L7.89901 17.0016C8.69078 16.7972 9.50038 17.2646 9.71924 18.0525L10.2602 20H13.74L14.281 18.0524C14.4999 17.2645 15.3095 16.7971 16.1013 17.0015L18.0586 17.5068L19.7985 14.4932L18.3824 13.0509C17.8095 12.4674 17.8095 11.5326 18.3824 10.9491L19.7985 9.50681L18.0586 6.49319L16.1013 6.99851C15.3095 7.20292 14.4999 6.73549 14.281 5.94759L13.74 4H10.2602ZM12.0001 10C10.8956 10 10.0001 10.8954 10.0001 12C10.0001 13.1046 10.8956 14 12.0001 14C13.1047 14 14.0001 13.1046 14.0001 12C14.0001 10.8954 13.1047 10 12.0001 10ZM8.00012 12C8.00012 9.79086 9.79099 8 12.0001 8C14.2093 8 16.0001 9.79086 16.0001 12C16.0001 14.2091 14.2093 16 12.0001 16C9.79099 16 8.00012 14.2091 8.00012 12Z" fill="white" fill-opacity="0.85" />
              </svg></div>
              <div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19.4523 5.89065C19.8421 5.49943 19.841 4.86626 19.4497 4.47644C19.0585 4.08662 18.4253 4.08775 18.0355 4.47898L11.9851 10.5511L5.91311 4.50085C5.52189 4.11103 4.88872 4.11217 4.4989 4.50339C4.10908 4.89462 4.11021 5.52778 4.50144 5.9176L10.5735 11.9679L4.45398 18.1093C4.06416 18.5006 4.06529 19.1337 4.45652 19.5236C4.84774 19.9134 5.48091 19.9122 5.87073 19.521L11.9902 13.3795L18.1318 19.4991C18.523 19.889 19.1562 19.8878 19.546 19.4966C19.9358 19.1054 19.9347 18.4722 19.5435 18.0824L13.4019 11.9628L19.4523 5.89065Z" fill="white" fill-opacity="0.85" />
              </svg></div>
            </div>
          </div>
          <div className={styles.main}>
            {/* 组件库内组件的内部样式如何修改？是否有文档？ */}
            <PUYUC.ChatBox
              // eventName=''
              // className={styles.chatBox}
              propsSessionList={sessionList[0]}
              url={`/chat/generate?session_id=${index}&user_id=1`}
              ref={refs[0]}
            />
          </div>
        </div>
      ))}
    </>
    //     <>
    //       <div className={styles.chatContainer}>
    //         {models.map(model, index) => (
    //           <div className={styles.banner}>
    //             模型A
    //           </div>
    //           <div className={styles.main}>
    //             <PUYUC.ChatBox
    //                 // eventName=''
    //                 propsSessionList={sessionList}
    //                 url={'/chat/generate?session_id=1234&user_id=1'}
    //                 ref={ref}
    //               />
    //           </div>
    //         )}
    // {/* 
    //         <PUYUC.ChatBox
    //           propsSessionList={sessionList}
    //           url={'/chat/generate?session_id=1234&user_id=2'}
    //           ref={ref1}
    //         />  */}
    //       </div>
    //       {/* <button onClick={startSse}>开始会话</button>
    //       <button onClick={stopSse}>停止会话</button>
    //       <button onClick={reGenerate}>重试</button>
    //       <button onClick={getSseStatus}>获取状态</button> */}
    //     </>
  );
};

export default Chat;
