import React, { useContext, useState, useEffect } from 'react';
import { Button, Modal, Radio, RadioChangeEvent, message, notification } from 'antd';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { ModeContext } from '@/utils/contexts';
import http from '@/utils/axios';
import eventBus from '@/utils/eventBus';
import { SHA256 } from 'crypto-js';

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
    // vote_model
    function createHash(value: string): string {
        const hash = SHA256(value);
        return hash.toString().slice(0, 8);
      }
    const model_ids: { [key: string]: any } = {};
    models?.forEach((model) => {
        const hashid = createHash(JSON.stringify(model.generate_kwargs))
        model_ids[model.nickname + hashid] = model.model_id;
    });
    const [value, setValue] = useState('default');
    // 合并字典
    interface Dict {
        [key: string]: string;
      }
      
      function mergeDicts(dict1: Dict, dict2: Dict): Dict {
        const mergedDict: Dict = {};
      
        for (const key1 in dict1) {
          const value1 = dict1[key1];
      
          if (dict2.hasOwnProperty(value1)) {
            const value2 = dict2[value1];
            mergedDict[key1] = value2;
          }
        }
      
        return mergedDict;
      }
    
    // 监听是否禁用标注，主要用于debug成员
    useEffect(() => {
        const statusListener = (status: boolean) => {
            setBanVote(status)
        }
        const dialogueListener = (dialogue_ids: Dict) => {
            const merge_ids = mergeDicts(model_ids, dialogue_ids)
            setDialogueIds(merge_ids)
        }
        eventBus.on('banVote', statusListener)
        eventBus.on('sendVoteDict', dialogueListener)
        return () => {
            eventBus.removeListener('banVote', statusListener);
            eventBus.removeListener('sendVoteDict', dialogueListener);
        };
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
            content: msg,
        });
    };
    //完成标注，打开输入框的限制
    const handleOk = () => {
        // 单标注完成，打开输入框
        if (mode === 'single') {
            voteDialogue();
            eventBus.emit('banInputEvent', false);
            // 开启标注
            eventBus.emit('annotateSession', true, sessionId);
        } else {
            vote();
            setBanVote(true);
            eventBus.emit('annotateSession', false, sessionId);
            eventBus.emit('dialogueFinish', sessionId);
        }
        // 弹窗提示标注成功
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // 单选情况下
    const onChange = (e: RadioChangeEvent) => {
        setValue(e.target.value);
    };
    const allDis = () => {
        if (isEqual) {
            if (!isDis) {
                error('不能同时都不选或都选择');
            }
        } else {
            setIsDis(!isDis);
        }
    };
    const allEqual = () => {
        if (isDis) {
            if (!isEqual) {
                error('不能同时都不选或都选择！');
            }
        } else {
            setIsEqual(!isEqual);
        }
    };

    const getVoteResult = (value: string, model_ids: { [key: string]: any }) => {
        const valueToFind = value; // 要查找的 value
        const foundElement = Object.entries(model_ids).find(([key, value]) => value === valueToFind);
        if (foundElement) {
            const [key, value] = foundElement;
            return [key];
        } else {
            return []; // 或者返回适当的默认值，表示未找到元素
        }
    };

    // 投票结果
    let vote_result: string[] = [];
    if (isDis) {
        vote_result = [];
    } else if (isEqual) {
        vote_result = Object.keys(model_ids);
    } else {
        vote_result = getVoteResult(value, model_ids);
    }

    // 投票功能
    const vote = () => {
        const username = localStorage.getItem('username');
        const dialogue_id = null;
        const turn_id = sessionId;
        console.log("vote session vote_model: ", JSON.stringify(vote_result))
        const data = {
            username: username,
            vote_result: JSON.stringify(vote_result),
            vote_model: model_ids,
            dialogue_id: dialogue_id,
            turn_id: turn_id,
        };
        console.log('投票的信息', data)
        http.post<any, any>('/vote?', { data: data })
            .then(() => {
                openNotificationWithIcon('success', '标注成功！')
            })
            .catch(() => {
                openNotificationWithIcon('error', '标注失败！')
            });
    };

    // 会话标注完成：
    const voteDialogue = () => {
        const username = localStorage.getItem('username');
        const turn_id = null;
        const data = {
            username: username,
            vote_result: JSON.stringify(vote_result),
            vote_model: model_ids,
            dialogue_id: dialogueIds,
            turn_id: turn_id,
        };
        console.log('投票的信息', data)
        http.post<any, any>('/vote?', { data: data })
            .then(() => {
                openNotificationWithIcon('success', '标注成功！')
            })
            .catch(() => {
                openNotificationWithIcon('error', '标注失败！')
            });
    };

    // 通知提醒框
    const [api, notificationHolder] = notification.useNotification()
    type NotificationType = 'success' | 'error';
    const openNotificationWithIcon = (type: NotificationType, message: string) => {
        api[type] ({
            message: message,
            description: ''
        })
    }

    return (
        <>
            {notificationHolder}
            {contextHolder}
            <Button type="primary" onClick={showModal} disabled={banVote}>
                标注
            </Button>
            <Modal
                title={title}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="完成标注"
                cancelText="取消"
            >
                请选择任意符合预期的模型
                <br />
                <Radio.Group onChange={onChange} value={value} disabled={isDis || isEqual}>
                    {Object.keys(model_ids).map((key) => {
                        const id = model_ids[key];
                        return <Radio value={id}>{key}</Radio>;
                    })}
                </Radio.Group>
                <br />
                或者
                <Button onClick={allEqual} type={isEqual ? 'primary':'default'}>都符合</Button>
                或者
                <Button onClick={allDis} type={isDis? 'primary': 'default'}>都不符合</Button>
            </Modal>
        </>
    );
};

export default Annotate;
