import PUYUC, {IChatItem} from 'chat-webkit'
import { useContext, useState, useEffect } from 'react';
import { IdContext } from '@/utils/idcontexts';
import style from "./manager.module.less";
import { ModelContext } from '@/utils/modelcontext';
import { sseMesage } from 'chat-webkit/dist/types/components/chat-box/chatInterface';
import eventBus from '@/utils/eventBus';
import {sessionMesage} from '@/utils/sessionInterface'

interface ChatItem extends IChatItem {
  isAnnotated: boolean
}
/**
 * 至少保持开启一个会话。
 */
function Manager() {
    const idContext = useContext(IdContext);
    const models = useContext(ModelContext)?.models;
    const numOfModel = models?.length
    const initSession: sessionMesage = {};
    const initId = Date.now().toString()
    const [curChatId, setCurChatId] = useState<string>('')
    const [chatList, setChatList] = useState<ChatItem[]>([{
        id: initId,
        name: '初始化会话',
        isAnnotated: false
    }])
    for (let i = 0; i < numOfModel!; i++) {
      // const sseMessage: sseMesage[] = [];
      // initSession.push(sseMessage);
      if(models)
          initSession[models[i].model_id] = []
    }
    /**TODO：防止溢出 */
    localStorage.setItem(initId, JSON.stringify(initSession))

    const addChat = () => {
        const newItem = {
            id: Date.now().toString(),
            name: '新会话'+ Date.now().toString(),
            isAnnotated: false
        }
        const newList = chatList.slice()  // 复制数组
        newList.unshift(newItem)   // 向数组开头添加元素
        setChatList(newList)
         /**新增后会立即选中当前的sessionid */
         setCurChatId(newItem.id)
         eventBus.emit('sendStatus', true)
         idContext?.setId(newItem.id)
        /**初始化缓存 */
        const numOfModel = models?.length
        const initSession: sessionMesage = {};
        for (let i = 0; i < numOfModel!; i++) {
          if(models)
            initSession[models[i].model_id] = []
        }
        console.log("addchat", newItem.id)
        localStorage.setItem(newItem.id, JSON.stringify(initSession))
    }

    const deleteChat = (id: string) => {
      const newList = chatList.slice()
      const index = chatList.findIndex(x => x.id === id)
      if (chatList.length >= 1) {
          newList.splice(index, 1)
          setChatList(newList)
          if(index != 0) {
            selectChat(chatList[index - 1].id)
          } else {
            selectChat(chatList[chatList.length - 2].id)
          } 
      }
  }

    const annotateChat = (id: string) => {
      const index = chatList.findIndex(x => x.id === id)
      console.log('正在标注', index)
      chatList[index]['isAnnotated'] = true
      eventBus.emit('sendStatus', chatList[index]['isAnnotated'])
    }

    const selectChat = (id:string) => {
        setCurChatId(id)
        idContext?.setId(id)
        const index = chatList.findIndex(x => x.id === id)
        eventBus.emit('sendStatus', chatList[index]['isAnnotated'])
    }

    useEffect(() => {
      const annotateListener = (sessionId: string) => {
        console.log('想要标注的session', sessionId)
        annotateChat(sessionId)
      }
      eventBus.on('dialogueFinish', annotateListener)
      return () => {
        eventBus.removeListener('dialogueFinish', annotateListener)
      }
  }, []);

    return (
        <div className={style.chatmanagement}>
            <PUYUC.ChatManagement  
                list={chatList} 
                selectedChatId={curChatId}
                addCallback={addChat} 
                deleteCallback={deleteChat} 
                selectCallback={selectChat} 
            />
        </div>
    );
}

export default Manager;
