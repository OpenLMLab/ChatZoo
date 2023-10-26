import style from './manager.module.less';
import PUYUC, { IChatItem } from 'chat-webkit';
import { useContext, useState, useEffect, useRef } from 'react';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { ModeContext } from '@/utils/contexts';
import { sessionMesage } from '@/utils/sessionInterface';
import eventBus from '@/utils/eventBus';
import ModelConfig from '../model/model';
import http from '@/utils/axios';


// 拓展后的会话Item
interface ChatItem extends IChatItem {
    notAnnotated: boolean;
    mode: string;
    // 当前对话是否需要开始投票
    beginVote: boolean
}

// 会话关闭模型的信息
interface stopSession {
    [key: string]: boolean;
}

/**
 * 至少保持开启一个会话。
 */
function Manager() {
    // 模式上下文
    const modeContext = useContext(ModeContext)?.mode;
    const idContext = useContext(IdContext);
    const models = useContext(ModelContext)?.models;
    const setModels = useContext(ModelContext)?.setModels
    // 会话是否禁用的开关
    const [banSession, setBanSession] = useState(false);
    const [curChatId, setCurChatId] = useState<string>(idContext?.id!)

    const sys_mode = localStorage.getItem("sys_mode")
    // 用于处理 evaluation 的情况
    let allChatList: ChatItem[] = []
    if (sys_mode === "evaluation") {
        console.log("初始化会话, ds_name是", localStorage.getItem("selectDs"))
        const dataset_name = JSON.parse(localStorage.getItem("dataset_name")!)
        // let allChatList: ChatItem[] = []
        dataset_name.forEach((ds_name: string, idx: number) => {
            if (idx > 0) {
                allChatList.push({
                    id: idContext?.id! + idx,
                    name: ds_name,
                    notAnnotated: true,
                    mode: modeContext!,
                    beginVote: false
                })
            } else {
                allChatList.push({
                    id: idContext?.id!,
                    name: ds_name,
                    notAnnotated: true,
                    mode: modeContext!,
                    beginVote: false
                })
                eventBus.emit("getEvalPageNum")
                // localStorage.setItem("selectDs", ds_name)
            }

        })

    } else {
        allChatList = [{
            id: idContext?.id!,
            name: '新会话' + Date.now().toString(),
            notAnnotated: true,
            mode: modeContext!,
            beginVote: false
        }]
    }
    const [chatList, setChatList] = useState<ChatItem[]>(allChatList)

    const prevMyStateRef = useRef(modeContext);
    const numOfModel = models?.length;
    const initSession: sessionMesage = {};
    const initStopSession: stopSession = {}  // 初始化每个对话的暂停模型信息
    for (let i = 0; i < numOfModel!; i++) {
        if (models) {
            initSession[models[i].model_id] = [];
            initStopSession[models[i].model_id] = true;
        }
    }
    /**TODO：防止溢出 */
    if (localStorage.getItem(idContext?.id!) == undefined || localStorage.getItem(idContext?.id!) == null) {
        localStorage.setItem(idContext?.id!, JSON.stringify(initSession));
        localStorage.setItem(idContext?.id! + "stop", JSON.stringify(initStopSession));

        // 保存当前会话的模型顺序信息
        const model_ids: string[] = []
        models?.forEach((model: ModelConfig) => {
            model_ids.push(model.model_id)
        })
        localStorage.setItem(idContext?.id + "model_sequeue", JSON.stringify(model_ids))

        // 将暂停的信息更新到models中
        // const new_models = models?.slice()
        // for (let i = 0; i < numOfModel!; i++) {
        //     if (models){
        //         // @ts-ignore
        //         new_models[i].start = initStopSession[new_models[i].model_id]
        //     }
        // }
        // // @ts-ignore
        // setModels(new_models!)
    }

    // 添加会话
    const addChat = (modecontext: string, chatList: ChatItem[]) => {
        let notAnnotated = true
        const newItem = {
            id: Date.now().toString(),
            name: '新会话' + Date.now().toString(),
            notAnnotated: notAnnotated,
            mode: modecontext,
            beginVote: false
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
        const stopSessionMsg: stopSession = {}
        for (let i = 0; i < numOfModel!; i++) {
            if (models) {
                initSession[models[i].model_id] = [];
                stopSessionMsg[models[i].model_id] = true;
            }
        }
        localStorage.setItem(newItem.id, JSON.stringify(initSession));

        // 关闭annotate组件的标注按钮，因为新建后对话是空的
        eventBus.emit("detectChatBegin", false)

        // 暂停对话的信息
        console.log("新增会话", stopSessionMsg)
        localStorage.setItem(newItem.id + "stop", JSON.stringify(stopSessionMsg));
        // 暂停情况
        const new_models = models?.slice()
        new_models?.sort(() => Math.random() - 0.5)  // 使用随机排序函数对数组进行排序

        for (let i = 0; i < numOfModel!; i++) {
            if (models) {
                // @ts-ignore
                new_models[i].start = stopSessionMsg[new_models[i].model_id]
            }
        }

        // 保存当前会话的模型顺序信息
        const model_ids: string[] = []
        new_models?.forEach((model: ModelConfig) => {
            model_ids.push(model.model_id)
        })
        localStorage.setItem(newItem.id + "model_sequeue", JSON.stringify(model_ids))

        // @ts-ignore
        setModels(new_models!)
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
        const index = chatList.findIndex((x) => x.id === id);
        if (sys_mode === "evaluation") {
            // 处理 evaluation 的情况
            console.log("切换会话，ds_name是", chatList[index].name)
            localStorage.setItem("selectDs", chatList[index].name)
            const newSelectDs = chatList[index].name
            let newSessionList: sessionMesage = {}
            models?.forEach((model: ModelConfig) => {
                http.post<string, any>(model.url +
                    "/chat/get_ds_instance?" +
                    "ds_name=" + newSelectDs +
                    "&query_idx=" + "0"
                ).then(res => {
                    const data = res.data.data
                    newSessionList[model.model_id] = []
                    if (data["exist"])
                        newSessionList[model.model_id].push({
                            id: "1",
                            status: 0,
                            message: data["response"],
                            question: data["prompt"],
                        })
                    if (Object.keys(models).length === Object.keys(newSessionList).length) {
                        localStorage.setItem("cacheSession", JSON.stringify(newSessionList))
                        eventBus.emit("managerDsChange", newSessionList)
                        eventBus.emit("getEvalPageNum")
                        eventBus.emit("setCurrentPage", 1)
                        setCurChatId(id);
                        idContext?.setId(id);
                    }
                })
            })
            return
        }
        setCurChatId(id);
        idContext?.setId(id);
        // 判断是否禁用输入框
        eventBus.emit('banInputEvent', !chatList[index]['notAnnotated']);
        // 会话标注 && 已经标注
        if (modeContext === 'dialogue') {
            eventBus.emit('banVote', !chatList[index]['notAnnotated']);
        }
        // 判断当前对话是否能标注
        eventBus.emit("detectChatBegin", chatList[index]['beginVote'])

        // 加载当前会话的模型顺序然后更改模型的顺序
        const model_sequeue = JSON.parse(localStorage.getItem(id + "model_sequeue")!)
        const new_models: ModelConfig[] = [];
        for (let i = 0; i < numOfModel!; i++) {
            for (let j = 0; j < numOfModel!; j++) {
                // @ts-ignore
                if (models[j].model_id == model_sequeue[i]) {
                    // @ts-ignore
                    new_models.push(models[j])
                    break
                }
            }
        }
        console.log("new_models1", new_models, model_sequeue)
        // 加载暂停模型
        const stopSession = JSON.parse(localStorage.getItem(id + "stop")!)
        // const new_models = models?.slice()
        for (let i = 0; i < numOfModel!; i++) {
            if (models) {
                // @ts-ignore
                new_models[i].start = stopSession[new_models[i].model_id]
            }
        }
        console.log("切换会话", new_models, stopSession)

        // @ts-ignore
        setModels(new_models!)
    };

    // 监听单会话标注是否完成， 完成将sessionList的标注置为可对话
    useEffect(() => {
        const CurSessionAnnatote = (finishBtn: boolean, id: string) => {
            const index = chatList.findIndex((x) => x.id === id);
            chatList[index].notAnnotated = finishBtn;
            setChatList(chatList);
        };
        const CurSessionBeginVote = (finishBtn: boolean, id: string) => {
            const index = chatList.findIndex((x) => x.id === id);
            chatList[index].beginVote = finishBtn;
            setChatList(chatList);
        }
        eventBus.on('annotateSession', CurSessionAnnatote);
        eventBus.on('beginVoteSession', CurSessionBeginVote)
        return () => {
            eventBus.off('annotateSession', CurSessionAnnatote);
            eventBus.off('beginVoteSession', CurSessionBeginVote)
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
    useEffect(() => {
        const editChat = (newName: string, id: string) => {
            const index = chatList.findIndex(x => x.id === id)
            if (index > -1) {
                if (chatList[index].name.indexOf("新会话") >= 0) {
                    chatList[index].name = newName
                    setChatList(chatList)
                }
            }

        }
        eventBus.on('editChat', editChat)
        return () => {
            eventBus.off('editChat', editChat)
        }
    })


    // 监听模式的变化, 一旦变化就切换展示的会话信息
    useEffect(() => {
        if (prevMyStateRef.current != modeContext) {
            const sessionSate = {
                "chatlist": chatList,
                "session_id": idContext?.id
            }
            // 变化了，存储或者更新 会话列表
            console.log('保存会话列表', prevMyStateRef.current!, idContext?.id)
            localStorage.setItem(prevMyStateRef.current!, JSON.stringify(sessionSate))
            console.log('当前的模式', modeContext!)
            // 读取切换的模式的会话列表*
            if (localStorage.getItem(modeContext!) != undefined && localStorage.getItem(modeContext!) !== null) {
                const chatlist_state = JSON.parse(localStorage.getItem(modeContext!)!);
                const new_chatList: ChatItem[] = chatlist_state["chatlist"]
                const session_id = chatlist_state["session_id"]
                // 切换模式时候判断是否开启对话框
                const index = new_chatList.findIndex(x => x.id === session_id)
                idContext?.setId(session_id)
                setChatList(new_chatList)
                setCurChatId(session_id)
                console.log('获取的list', new_chatList, index, session_id)
                eventBus.emit("banInputEvent", !new_chatList[index]['notAnnotated'])
            } else {
                addChat(modeContext!, [])
            }
            prevMyStateRef.current = modeContext
        }
    }, [modeContext]);

    return (
        <div className={style.chatmanagement} style={banSession ? { pointerEvents: 'none', opacity: 0.5 } : {}}>
            <PUYUC.ChatManagement
                list={chatList}
                selectedChatId={curChatId}
                addCallback={() => addChat(modeContext!, chatList)}
                deleteCallback={deleteChat}
                selectCallback={selectChat}
                ellipsis={1}
                addTip={"创建新会话"}
                maxCountAddTip={"会话数量达到上限"}
                maxChatCount={10}
            />
        </div>
    );
}

export default Manager;
