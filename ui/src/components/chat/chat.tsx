import React,{  useRef } from 'react';

import styles from './chat.module.less';

import PUYUC from '@puyu/components';

export default function Chat({models})  {
  const ref = useRef<any>();
  const ref1 = useRef<any>();

  const sessionList = [
    {
      id: 140385,
      status: 0,
      message: '你好！我是chatzoo，很高兴能够帮助你。你有什么需要帮助的事情吗？',
      question: 'ni hao ',
    },
    {
      id: 140386,
      status: 0,
      message: '你好！我是chatzoo1，很高兴能够帮助你。你有什么需要帮助的事情吗？',
      question: 'ni hao ',
    },
  ];

  const startSse = () => {
    ref.current.startSse('你好');
    ref1.current.startSse('你好1');

  };

  const stopSse = () => {
    ref.current.stopSse();
    ref1.current.stopSse();
  }

  const reGenerate = () => {
    ref.current.reGenerate();
    ref1.current.reGenerate();
  };

  const getSseStatus = () => {
    console.log(ref.current.getStatus());
    console.log(ref1.current.getStatus());
  };

  return (
    <>
      {models.map((model:any, index:number) => (
        <div key={index} className={styles.chatContainer}>
          <div className={styles.banner}>
            {model.nickname}
          </div>
          <div className={styles.main}>
            <PUYUC.ChatBox
              // eventName=''
              propsSessionList={sessionList}
              url={`/chat/generate?session_id=${index}&user_id=1`}
              ref={ref}
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

// export default Chat;