import PUYUC, {IChatItem} from '@puyu/components'
import { useContext, useState, useEffect } from 'react';
import { IdContext } from '@/utils/idcontexts';
import style from "./manager.module.less";
import { ModeContext } from '@/utils/contexts';

/**
 * 至少保持开启一个会话。
 */
function Manager() {
    const idContext = useContext(IdContext);
    const mode = useContext(ModeContext)?.mode;
    const [curChatId, setCurChatId] = useState<string>('')
    const [chatList, setChatList] = useState<IChatItem[]>([{
        id: 'default',
        name: '请注意这是一个模拟会话，所做的处理均不会被记录入数据库~',
    }])
    localStorage.setItem('sessionList' + 'default', JSON.stringify(
    [[
        {
          id: 140385,
          status: 0,
          message: '你好！我是书生·浦语，很高兴能够帮助你。你有什么需要帮助的事情吗？',
          question: 'ni hao ',
        },
        {
          id: 140386,
          status: 0,
          message: '你好！我是书生·浦语，很高兴能够帮助你。你有什么需要帮助的事情吗？',
          question: 'ni hao ',
        },
    ],
    [
        {
          id: 140385,
          status: 0,
          message: '你好！我是书生·浦语，很高兴能够帮助你。你有什么需要帮助的事情吗？',
          question: 'ni hao ',
        },
        {
          id: 140386,
          status: 0,
          message: '你好！我是书生·浦语，很高兴能够帮助你。你有什么需要帮助的事情吗？',
          question: 'ni hao ',
        },
    ]]
      ))

    const addChat = () => {
        const newItem = {
            id: Date.now().toString(),
            name: '新会话'+Date.now().toString()
        }
        const newList = chatList.slice()  // 复制数组
        newList.unshift(newItem)   // 向数组开头添加元素
        setChatList(newList)
        /**新增后会立即选中当前的sessionid */
        setCurChatId(newItem.id)
        idContext?.setId(newItem.id)
        console.log("addchat",idContext, newItem.id)
        /**初始化缓存 */
        const initSession =     [[
            {
              id: 140385,
              status: 0,
              message: '你好！我是书生·浦语，很高兴能够帮助你。你有什么需要帮助的事情吗？',
              question: 'ni hao ',
            },
            {
              id: 140386,
              status: 0,
              message: '你好！我是书生·浦语，很高兴能够帮助你。你有什么需要帮助的事情吗？',
              question: 'ni hao ',
            },
        ],
        [
            {
              id: 140385,
              status: 0,
              message: '你好！我是书生·浦语，很高兴能够帮助你。你有什么需要帮助的事情吗？',
              question: 'ni hao ',
            },
            {
              id: 140386,
              status: 0,
              message: '你好！我是书生·浦语，很高兴能够帮助你。你有什么需要帮助的事情吗？',
              question: 'ni hao ',
            },
        ]]
        localStorage.setItem('sessionList' + newItem.id, JSON.stringify(initSession))
    }

    const deleteChat = (id: string) => {
        const newList = chatList.slice()
        const index = chatList.findIndex(x => x.id === id)
        if (index >= 1) {
            newList.splice(index, 1)
            setChatList(newList)
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
