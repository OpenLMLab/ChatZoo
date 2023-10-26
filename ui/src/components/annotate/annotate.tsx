import React, { useContext, useState, useEffect } from 'react';
import { Button, Modal, Radio, RadioChangeEvent, message, notification, Space, Row, Col } from 'antd';
import { IdContext } from '@/utils/idcontexts';
import { ModelContext } from '@/utils/modelcontext';
import { ModeContext } from '@/utils/contexts';
import http from '@/utils/axios';
import eventBus from '@/utils/eventBus';
import { SHA256 } from 'crypto-js';
import style from './annotate.module.less';
import ModelConfig from '../model/model';

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
    // 是否开启标注的开关，当对话开始时候才能标注
    const [beginVote, setBeginVote] = useState(false);

    // 是否是特殊的rlhf标注模式
    const sys_mode = localStorage.getItem("sys_mode")
    const [annotateMode, setAnnotateMode] = useState(sys_mode)

    // 模型的名字，标注模式为字母，debug模式为nickname。
    const modeName = localStorage.getItem('permission')!;

    // 获取投票的标签
    let label_info = JSON.parse(localStorage.getItem('label_prompt')!);
    let label_prompts = label_info['data'];
    console.log('label_prompts', label_prompts);
    let label_prompts_smi: string[] = [];
    if (models?.length == 2 && label_info['user_prompt'] && sys_mode == 'rlhf') {
        label_prompts.forEach((label_name: any) => {
            if (modeName.indexOf('debug') < 0) {
                label_prompts_smi.push('Model_B ' + label_name + ' Model_A');
            } else {
                label_prompts_smi.push(models[1].nickname + ' ' + label_name + ' ' + models[0].nickname);
            }
        });
        for (let i = 0; i < label_prompts.length; i++) {
            if (modeName.indexOf('debug') < 0) {
                label_prompts[i] = 'Model_A ' + label_prompts[i] + ' Model_B';
            } else {
                label_prompts[i] = models[0].nickname + ' ' + label_prompts[i] + ' ' + models[1].nickname;
            }
        }
    }
    if (models && models?.length > 2 && label_info['user_prompt'] && sys_mode == 'rlhf') {
        for (let i = 0; i < label_prompts.length; i++) {
            label_prompts[i] = { label: label_prompts[i], selected: false };
        }
    }
    // vote_model
    function createHash(value: string): string {
        const hash = SHA256(value);
        return hash.toString().slice(0, 8);
    }
    const model_ids: { [key: string]: any } = {};
    const model_sequeue: string[] = [];
    models?.forEach((model) => {
        // 加上哈希后缀
        // const hashid = createHash(JSON.stringify(model.generate_kwargs))
        // model_ids[model.nickname + hashid] = model.model_id;
        model_ids[model.nickname] = model.model_id;
        model_sequeue.push(model.nickname);
    });
    const [value, setValue] = useState(['default', 'default', 'default', 'default']);
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
            setBanVote(status);
        };
        const dialogueListener = (dialogue_ids: Dict) => {
            const merge_ids = mergeDicts(model_ids, dialogue_ids);
            setDialogueIds(merge_ids);
        };
        eventBus.on('banVote', statusListener);
        eventBus.on('sendVoteDict', dialogueListener);
        return () => {
            eventBus.removeListener('banVote', statusListener);
            eventBus.removeListener('sendVoteDict', dialogueListener);
        };
    }, []);
    const names: string[] = [];
    models?.map((model) => names.push(model.nickname));
    const showModal = () => {
        // 如果没有标注的话，就不能打开
        if (beginVote) {
            eventBus.emit('beginVoteSession', true, sessionId);
            setIsModalOpen(true);
        } else {
            error('请先开始聊天对话！');
        }
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
            // 不能再投票
            eventBus.emit('beginVoteSession', false, sessionId);
        } else {
            vote();
            setBanVote(true);
            eventBus.emit('annotateSession', false, sessionId);
            eventBus.emit('dialogueFinish', sessionId);
            // 不能再投票
            eventBus.emit('beginVoteSession', false, sessionId);
        }
        // 弹窗提示标注成功
        setIsModalOpen(false);
        // 不能再投票
        setBeginVote(false);
        setValue(['default', 'default', 'default', 'default']);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // 单选情况下
    const onChange = (index: number) => (e: RadioChangeEvent) => {
        console.log('radio: ', e);
        // if(e.target.value == "都符合"){
        //     allEqual()
        // }else if(e.target.value == "都不符合"){
        //     allDis()
        // }
        // else{
        //     setValue(e.target.value);
        // }
        let newValue = value.slice();
        newValue[index] = e.target.value;
        setValue(newValue);
    };

    // 投票前检测是否选中了标签
    const checkSelected = (value: any, models: ModelConfig[]) => {

    }

    // 如果模型的数量小于等于2，那么标注的标签只有一个，故取第一个value的值即可。
    let vote_result: string[] | string = value;
    if (sys_mode != 'rlhf') {
        vote_result = value[0]
    }

    console.log('投票结果', vote_result);
    // 投票功能
    const vote = () => {
        const username = localStorage.getItem('username');
        const dialogue_id = null;
        const turn_id = sessionId;
        console.log('vote session vote_model: ', JSON.stringify(vote_result));
        const data = {
            username: username,
            vote_result: vote_result,
            // vote_result: JSON.stringify(vote_result),
            vote_model: model_ids,
            dialogue_id: dialogue_id,
            turn_id: turn_id,
            model_sequeue: JSON.stringify(model_sequeue),
        };
        console.log('投票的信息', data);

        // 区别 debug 投票还是 arena 模式投票， 根据 permission 来判别
        const permission = localStorage.getItem('permission');
        if (permission == 'debug') {
            http.post<any, any>('/vote?', { data: data })
                .then(() => {
                    openNotificationWithIcon('success', '标注成功！');
                })
                .catch(() => {
                    openNotificationWithIcon('error', '标注失败！');
                });
        } else {
            http.post<any, any>('/vote?', { data: data })
                .then(() => {
                    openNotificationWithIcon('success', '标注成功！');
                })
                .catch(() => {
                    openNotificationWithIcon('error', '标注失败！');
                });
        }
    };

    // 会话标注完成：
    const voteDialogue = () => {
        const username = localStorage.getItem('username');
        const turn_id = null;
        const data = {
            username: username,
            vote_result: vote_result,
            // vote_result: JSON.stringify(vote_result),
            vote_model: model_ids,
            dialogue_id: dialogueIds,
            turn_id: turn_id,
            model_sequeue: JSON.stringify(model_sequeue),
        };
        console.log('投票的信息', data);
        // 区别 debug 投票还是 arena 模式投票， 根据 permission 来判别
        const permission = localStorage.getItem('permission');
        if (permission == 'debug') {
            http.post<any, any>('/vote?', { data: data })
                .then(() => {
                    openNotificationWithIcon('success', '标注成功！');
                    setValue(['default', 'default', 'default', 'default']);
                })
                .catch(() => {
                    openNotificationWithIcon('error', '标注失败！');
                    setValue(['default', 'default', 'default', 'default']);
                });
        } else {
            http.post<any, any>('/vote?', { data: data })
                .then(() => {
                    openNotificationWithIcon('success', '标注成功！');
                    setValue(['default', 'default', 'default', 'default']);
                })
                .catch(() => {
                    openNotificationWithIcon('error', '标注失败！');
                    setValue(['default', 'default', 'default', 'default']);
                });
        }
    };

    // 通知提醒框
    const [api, notificationHolder] = notification.useNotification();
    type NotificationType = 'success' | 'error';
    const openNotificationWithIcon = (type: NotificationType, message: string) => {
        api[type]({
            message: message,
            description: '',
        });
    };

    // 监控 bottom组件的输入框点击事件
    useEffect(() => {
        const openVote = () => {
            showModal();
        };
        eventBus.on('openVoteModal', openVote);
        return () => {
            eventBus.off('openVoteModal', openVote);
        };
    });

    // 判断当前对话是否开始过的事件，用于bottom的标注按钮是否能开启的检测事件
    useEffect(() => {
        const detectEvent = (beginVote: boolean) => {
            setBeginVote(beginVote);
        };
        eventBus.on('detectChatBegin', detectEvent);
        return () => {
            eventBus.off('detectChatBegin', detectEvent);
        };
    });
    console.log(value, model_ids);
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
                width="fit-content"
                bodyStyle={{ minWidth: '500px' }}
            >

                {annotateMode == 'rlhf' && models?.length == 1 && (
                    <div>
                        请选择任意符合预期的标签
                        <br />
                        <Radio.Group onChange={onChange(0)} value={value}>
                            <Space direction="vertical">
                                {label_prompts.map((key: any, idx: any) => {
                                    const id = key;
                                    console.log(key);
                                    return (
                                        <Radio key={id} value={id}>
                                            {key}
                                        </Radio>
                                    );
                                })}
                            </Space>
                        </Radio.Group>
                    </div>
                )}
                {annotateMode == 'rlhf' && models?.length == 2 && (
                    <div>
                        请选择任意符合预期的模型
                        <br />
                        <Row gutter={24}>
                            <Col span={label_prompts_smi.length > 0 ? 12 : 24}>
                                <Radio.Group onChange={onChange(0)} value={value}>
                                    <Space direction="vertical">
                                        {label_prompts.map((key: any, idx: any) => {
                                            const id = key;
                                            console.log(key);
                                            return (
                                                <Radio key={id} value={id}>
                                                    {key}
                                                </Radio>
                                            );
                                        })}
                                    </Space>
                                </Radio.Group>
                            </Col>
                            <Col span={12}>
                                <Radio.Group onChange={onChange(0)} value={value}>
                                    <Space direction="vertical">
                                        {label_prompts_smi.map((key: any, idx: any) => {
                                            const id = key;
                                            console.log(key);
                                            return (
                                                <Radio key={idx} value={id}>
                                                    {key}
                                                </Radio>
                                            );
                                        })}
                                    </Space>
                                </Radio.Group>
                            </Col>
                        </Row>
                    </div>
                )}
                {annotateMode == 'rlhf' && (models?.length == 3 || models?.length == 4) && (
                    <div className={style.annotateWrapper}>
                        {/* <br /> */}
                        <Radio.Group
                            onChange={onChange(0)}
                            value={value[0]}
                            className={style.annotateModel}
                            buttonStyle="solid"
                            optionType="button"
                            size="middle"
                        >
                            <Space direction="vertical">
                                {models.map((key: any) => {
                                    return (
                                        <Radio key={key.nickname} value={key.nickname} className={style.annotateRadio}>
                                            {key.nickname}
                                        </Radio>
                                    );
                                })}
                            </Space>
                        </Radio.Group>
                        <div>
                            <div className={style.annotateText}>is</div>
                        </div>
                        <Radio.Group
                            disabled={value[0] == 'default'}
                            className={style.annotateBorder}
                            buttonStyle="solid"
                            optionType="button"
                            size="middle"
                        >
                            <Space direction="vertical">
                                {label_prompts.map((key: any, idx: any) => {
                                    const id = key['label'];
                                    console.log(key);
                                    return (
                                        <Radio key={id} value={id} className={style.annotateRadio}>
                                            {key['label']}
                                        </Radio>
                                    );
                                })}
                            </Space>
                        </Radio.Group>
                        {/* <br /> */}
                        <div>
                            <div className={style.annotateText}>than</div>
                        </div>
                        {/* <br /> */}
                        <Radio.Group
                            onChange={onChange(1)}
                            value={value[1]}
                            className={style.annotateModel}
                            buttonStyle="solid"
                            optionType="button"
                            size="middle"
                        >
                            <Space direction="vertical">
                                {models.map((key: any) => {
                                    return (
                                        <Radio key={key.nickname} value={key.nickname} className={style.annotateRadio}>
                                            {key.nickname}
                                        </Radio>
                                    );
                                })}
                            </Space>
                            {/* <Radio value={1}>A</Radio>
                            <Radio value={2}>B</Radio>
                            <Radio value={3}>C</Radio>
                            <Radio value={4}>D</Radio> */}
                        </Radio.Group>
                        <div>
                            <div className={style.annotateText}>is</div>
                        </div>
                        <Radio.Group
                            disabled={value[1] == 'default'}
                            className={style.annotateBorder}
                            buttonStyle="solid"
                            optionType="button"
                            size="middle"
                        >
                            <Space direction="vertical">
                                {label_prompts.map((key: any, idx: any) => {
                                    const id = key['label'];
                                    console.log(key);
                                    return (
                                        <Radio key={id} value={id} className={style.annotateRadio}>
                                            {key['label']}
                                        </Radio>
                                    );
                                })}
                            </Space>
                        </Radio.Group>
                        {/* <br/> */}
                        <div>
                            <div className={style.annotateText}>than</div>
                        </div>
                        <Radio.Group
                            onChange={onChange(2)}
                            value={value[2]}
                            className={style.annotateModel}
                            buttonStyle="solid"
                            optionType="button"
                            size="middle"
                        >
                            <Space direction="vertical">
                                {models.map((key: any) => {
                                    return (
                                        <Radio key={key.nickname} value={key.nickname} className={style.annotateRadio}>
                                            {key.nickname}
                                        </Radio>
                                    );
                                })}
                            </Space>
                            {/* <Radio value={1}>A</Radio>
                            <Radio value={2}>B</Radio>
                            <Radio value={3}>C</Radio>
                            <Radio value={4}>D</Radio> */}
                        </Radio.Group>
                    </div>
                )}
                {(annotateMode == 'arena' || annotateMode == 'debug') && (
                    <div>
                        请选择任意符合预期的标签
                        <br />
                        <Radio.Group onChange={onChange(0)} value={value[0]}>
                            <Space direction="vertical">
                                {label_prompts.map((key: any, idx: any) => {
                                    const id = key;
                                    return (
                                        <Radio key={id} value={id}>
                                            {key}
                                        </Radio>
                                    );
                                })}
                            </Space>
                        </Radio.Group>
                    </div>
                )}

            </Modal>
        </>
    );
};

export default Annotate;
