import style from './manager.module.less';
import PUYUC, { IChatItem } from 'chat-webkit';
import { useContext, useState, useEffect, useRef } from 'react';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { ModeContext } from '@/utils/contexts';
import { sessionMesage } from '@/utils/sessionInterface';
import eventBus from '@/utils/eventBus';

// 拓展后的会话Item
interface ChatItem extends IChatItem {
    notAnnotated: boolean;
    mode: string;
}

/**
 * 至少保持开启一个会话。
 */
function Manager() {
    // 模式上下文
    const modeContext = useContext(ModeContext)?.mode;
    const idContext = useContext(IdContext);
    const models = useContext(ModelContext)?.models;
    // 会话是否禁用的开关
    const [banSession, setBanSession] = useState(false);
    const [curChatId, setCurChatId] = useState<string>(idContext?.id!)
    const [chatList, setChatList] = useState<ChatItem[]>([{
        id: idContext?.id!,
        name: '新会话' + Date.now().toString(),
        notAnnotated: true,
        mode: modeContext!
    }])
    const prevMyStateRef = useRef(modeContext);
    const numOfModel = models?.length;
    const initSession: sessionMesage = {};
    for (let i = 0; i < numOfModel!; i++) {
        if (models) initSession[models[i].model_id] = [];
    }
    /**TODO：防止溢出 */
    if (localStorage.getItem(idContext?.id!) == undefined || null) {
        localStorage.setItem(idContext?.id!, JSON.stringify(initSession));
    }

    // 添加会话
    const addChat = (modecontext: string, chatList: ChatItem[]) => {
        let notAnnotated = true
        const newItem = {
            id: Date.now().toString(),
            name: '新会话' + Date.now().toString(),
            notAnnotated: notAnnotated,
            mode: modecontext,
        };
        const newList = chatList.slice(); // 复制数组
        newList.unshift(newItem); // 向数组开头添加元素
        setChatList(newList);
        /**新增后会立即选中当前的sessionid */
        setCurChatId(newItem.id);
        eventBus.emit('banInputEvent', false);
        eventBus.emit('banVote', false);
        idContext?.setId(newItem.id);
        /**初始化缓存 */
        const numOfModel = models?.length;
        const initSession: sessionMesage = {};
        for (let i = 0; i < numOfModel!; i++) {
            if (models) initSession[models[i].model_id] = [];
        }
        localStorage.setItem(newItem.id, JSON.stringify(initSession));
    };

    // 删除会话
    const deleteChat = (id: string) => {
        const newList = JSON.parse(JSON.stringify(chatList));
        const index = chatList.findIndex((x) => x.id === id);
        if (chatList.length >= 1) {
            newList.splice(index, 1);
            setChatList(newList);
            if (id === curChatId)
                if (index != 0) {
                    selectChat(newList[index - 1].id);
                } else {
                    selectChat(newList[0].id);
                }
        }
    };

    // 选择会话
    const selectChat = (id: string) => {
        setCurChatId(id);
        idContext?.setId(id);
        const index = chatList.findIndex((x) => x.id === id);
        // 判断是否禁用输入框
        eventBus.emit('banInputEvent', !chatList[index]['notAnnotated']);
        // 会话标注 && 已经标注
        if (modeContext === 'dialogue') {
            eventBus.emit('banVote', !chatList[index]['notAnnotated']);
        }
    };

    // 监听单会话标注是否完成， 完成将sessionList的标注置为可对话
    useEffect(() => {
        const CurSessionAnnatote = (finishBtn: boolean, id: string) => {
            const index = chatList.findIndex((x) => x.id === id);
            chatList[index].notAnnotated = finishBtn;
            setChatList(chatList);
        };
        eventBus.on('annotateSession', CurSessionAnnatote);
        return () => {
            eventBus.off('annotateSession', CurSessionAnnatote);
        };
    });

    // 监听对话框是否发送消息， 如果发送就要禁用掉会话栏
    useEffect(() => {
        const banSessionList = (banButton: boolean) => {
            setBanSession(banButton);
        };
        eventBus.on('banSessionList', banSessionList);
        return () => {
            eventBus.off('banSessionList', banSessionList);
        };
    });

    // 监听对话框是否完成消息，如果完成就更改当前会话的名称
    useEffect(()=> {
      const editChat = (newName: string, id: string) => {
        const index = chatList.findIndex(x => x.id === id)
        if(index > -1)
            chatList[index].name = newName
      }
      eventBus.on('editChat', editChat)
      return () => {
        eventBus.removeListener('editChat', editChat)
      }
    })


    // 监听模式的变化, 一旦变化就切换展示的会话信息
    useEffect(()=>{
      if(prevMyStateRef.current != modeContext){
        const sessionSate = {
          "chatlist": chatList,
          "session_id": idContext?.id
        }
        // 变化了，存储或者更新 会话列表
        console.log('保存会话列表', prevMyStateRef.current!)
        localStorage.setItem(prevMyStateRef.current!, JSON.stringify(sessionSate))
        console.log('当前的模式', modeContext!)
        // 读取切换的模式的会话列表
        if(localStorage.getItem(modeContext!) != undefined && localStorage.getItem(modeContext!)!== null){
            const chatlist_state = JSON.parse(localStorage.getItem(modeContext!)!);
            const new_chatList: ChatItem[] = chatlist_state["chatlist"]
            const session_id = chatlist_state["session_id"]
            // 切换模式时候判断是否开启对话框
            const index = new_chatList.findIndex(x => x.id === session_id)
            setChatList(new_chatList)
            setCurChatId(session_id)
            idContext?.setId(session_id)
            console.log('获取的list', new_chatList)
            eventBus.emit("banInputEvent", !new_chatList[index]['notAnnotated'])
        }else{
          addChat(modeContext!, [])
        }
        prevMyStateRef.current = modeContext
    }}, [modeContext]);

    return (
        <div className={style.chatmanagement} style={banSession ? { pointerEvents: 'none', opacity: 0.5 } : {}}>
            <PUYUC.ChatManagement
                list={chatList}
                selectedChatId={curChatId}
                addCallback={() => addChat(modeContext!, chatList)}
                deleteCallback={deleteChat}
                selectCallback={selectChat}
            />
        </div>
    );
}

export default Manager;
