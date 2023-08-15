import React, { useContext, useState, useEffect } from 'react';
import { Button, Modal, Radio, RadioChangeEvent, message } from 'antd';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { ModeContext } from '@/utils/contexts';
import http from '@/utils/axios';
import eventBus from '@/utils/eventBus';

/**
 * 标注按钮：是否禁用
 * sendStatus：按钮是否要禁用
 * dialogueFinish：会话是否设置为已经禁用
 */

const Annotate: React.FC = () => {
    const sessionId = useContext(IdContext)?.id;
    const mode = useContext(ModeContext)?.mode;
    const models = useContext(ModelContext)?.models;
    // 对话id
    const [dialogueIds, setDialogueIds] = useState({});
    // 是否选中都不选
    const [isDis, setIsDis] = useState(false);
    // 是否都一样
    const [isEqual, setIsEqual] = useState(false);
    // 关闭标注的开关
    const [banVote, setBanVote] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();   
    // 拼接id
    const model_ids: {[key: string]: any} = {}
    models?.forEach((model) => {
        model_ids[model.nickname] = model.model_id
    });
    const [value, setValue] = useState("default");
    // 监听是否禁用标注，主要用于debug成员
    useEffect(() => {
        const statusListener = (status: boolean) => {
            setBanVote(status)
        }
        const dialogueListener = (dialogue_ids: {[key: string]: string}) => {
            console.log('会话id列表', dialogue_ids)
            setDialogueIds(dialogue_ids)
        }
        eventBus.on('banVote', statusListener)
        eventBus.on('sendVoteDict', dialogueListener)
        return () => {
            eventBus.removeListener('banVote', statusListener)
            eventBus.removeListener('sendVoteDict', dialogueListener)
        }
    }, []);
    const names: string[] = [];
    models?.map((model) => names.push(model.nickname));
    const showModal = () => {
        setIsModalOpen(true);
    };
    // 设置标题
    const title = mode === 'single' ? '单回复标注' : '会话标注';
    const error = (msg: string) => {
        messageApi.open({
            type: 'error',
            content: msg
        });
      };
    //完成标注，打开输入框的限制
    const handleOk = () => {
        // 单标注完成，打开输入框
        if(mode === 'single') {
            voteDialogue();
            eventBus.emit('banInputEvent', false)
            // 开启标注
            eventBus.emit("annotateSession", true, sessionId)
        } else {
            vote();
            setBanVote(true)
            console.log('成功标注')
            eventBus.emit("annotateSession", false, sessionId)
            eventBus.emit('dialogueFinish', sessionId);
        }
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // 单选情况下
    const onChange = (e: RadioChangeEvent) => {
        setValue(e.target.value)
    }
    const allDis = () => {
        if(isEqual) {
            if(!isDis) {
                error('不能同时都不选或都选择')
            }
        } else {
            setIsDis(!isDis);
        }
    };
    const allEqual = () => {
        if(isDis) {
            if(!isEqual) {
                error('不能同时都不选或都选择！')
            }
        } else {
            setIsEqual(!isEqual)
        }
    }

    const getVoteModel = (value: string, model_ids: {[key: string]: any}) => {
        const valueToFind = value; // 要查找的 value
        const foundElement = Object.entries(model_ids).find(([key, value]) => value === valueToFind);
        if (foundElement) {
          const [key, value] = foundElement;
          return key;
        } else {
          return null; // 或者返回适当的默认值，表示未找到元素
        } 
    }

    let vote_result: any = null
    if(isDis) {
        vote_result = null
    } else if(isEqual) {
        vote_result = Object.keys(model_ids)
    } else {
        vote_result = getVoteModel(value, model_ids)
    }

    // 投票功能
    const vote = () => {
        const username = localStorage.getItem('username');
        const dialogue_id = null;
        const turn_id = sessionId;
        const data = {
            username: username,
            vote_result: vote_result,
            vote_model: model_ids,
            dialogue_id: dialogue_id,
            turn_id: turn_id,
        };
        http.post<any, any>('/vote?', { data: data })
            .then((res) => {
                console.log('会话标注成功', res);
            })
            .catch(() => {
                console.log('会话标注失败');
            });
    };

    // 会话标注完成：
    const voteDialogue = () => {
        const username = localStorage.getItem('username');
        const turn_id = null;
        const data = {
            username: username,
            vote_result: vote_result,
            vote_model: model_ids,
            dialogue_id: dialogueIds,
            turn_id: turn_id,
        };
        http.post<any, any>('/vote?', { data: data })
            .then((res) => {
                console.log('会话标注成功', res);
            })
            .catch(() => {
                console.log('会话标注失败');
            });
    };

    return (
        <>
            {contextHolder}
            <Button type='primary' onClick={showModal} disabled={banVote}>标注</Button>
            <Modal title={title}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="完成标注"
                cancelText="取消"
            >
                请选择任意符合预期的模型
                <br />
                <Radio.Group onChange={onChange} value={value} disabled={isDis || isEqual} >
                    {
                        Object.keys(model_ids).map(key => {
                            const id = model_ids[key];
                            return <Radio value={id}>{key}</Radio>;
                        })
                    }
                </Radio.Group>
                <br />
                或者
                <Button onClick={allDis} type={isDis? 'primary': 'default'}>都不选</Button>
                或者
                <Button onClick={allEqual} type={isEqual ? 'primary':'default'}>都一样</Button>
            </Modal>
        </>
    );
};

export default Annotate;
