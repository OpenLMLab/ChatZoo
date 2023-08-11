import PUYUC, {IChatItem} from 'chat-webkit'
import { useContext, useState, useEffect } from 'react';
import { IdContext } from '@/utils/idcontexts';
import style from "./manager.module.less";
import { ModeContext } from '@/utils/contexts';
import { ModelContext } from '@/utils/modelcontext';
import ModelConfig from '../model/model';
import { sseMesage } from 'chat-webkit/dist/types/components/chat-box/chatInterface';

/**
 * 至少保持开启一个会话。
 */
function Manager() {
    const idContext = useContext(IdContext);
    const [curChatId, setCurChatId] = useState<string>('')
    const [chatList, setChatList] = useState<IChatItem[]>([{
        id: Date.now().toString(),
        name: '请注意这是一个模拟会话，所做的处理均不会被记录入数据库~',
    }])
    const models = useContext(ModelContext)?.models;
    const numOfModel = models?.length
    console.log('模型个数', numOfModel)
    const initSession = [];
    for (let i = 0; i < numOfModel!; i++) {
      const sseMessage: sseMesage[] = [];
      initSession.push(sseMessage);
    }
    /**TODO：防止溢出 */
    localStorage.setItem('sessionList0', JSON.stringify(initSession))

    const addChat = () => {
        const newItem = {
            id: Date.now().toString(),
            name: '新会话'+ Date.now().toString()
        }
        const newList = chatList.slice()  // 复制数组
        newList.unshift(newItem)   // 向数组开头添加元素
        setChatList(newList)
         /**新增后会立即选中当前的sessionid */
         setCurChatId(newItem.id)
         idContext?.setId(newItem.id)
        /**初始化缓存 */
        const numOfModel = models?.length
        const initSession = [];
        for (let i = 0; i < numOfModel!; i++) {
          const sseMessage: sseMesage[] = [];
          initSession.push(sseMessage);
        }
        console.log('初始化sessionList', initSession)
        localStorage.setItem('sessionList' + newItem.id, JSON.stringify(initSession))
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

    const selectChat = (id:string) => {
        setCurChatId(id)
        idContext?.setId(id)
        console.log('选中', id, curChatId)
    }

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
