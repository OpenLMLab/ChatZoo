import React, {useContext, useState, useEffect} from "react";
import {Button, Modal, Checkbox, message } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { IdContext } from "@/utils/idcontexts";
import { ModelContext } from "@/utils/modelcontext";
import { ModeContext } from "@/utils/contexts";
import http from "@/utils/axios";
import eventBus from '@/utils/eventBus'

/**
 * 标注按钮：是否禁用
 * sendStatus：按钮是否要禁用
 * dialogueFinish：会话是否设置为已经禁用
 */

const Annotate: React.FC = () => {
    const sessionId = useContext(IdContext)?.id;
    const mode = useContext(ModeContext)?.mode;
    const [messageApi, contextHolder] = message.useMessage();
    const [isBtn, setisBtn] = useState(true);
    let ids = {}
    useEffect(() => {
        const statusListener = (status: boolean) => {
            setisBtn(status)
        }
        eventBus.on('sendStatus', statusListener)
        return () => {
            eventBus.removeListener('sendStatus', statusListener)
        }
    }, []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const models = useContext(ModelContext)?.models;
    const names: string[] = [] 
    models?.map(model => names.push(model.nickname));
    // 是否选中都不选
    const [isDis, setIsDis] = useState(false);
    const [isNull, setIsNull] = useState(true);
    const showModal = () => {
        setIsModalOpen(true);
    }
    // 设置标题
    const title = (mode === 'single') ? '单回复标注':'会话标注'
    const error = () => {
        messageApi.open({
          type: 'error',
          content: '请选择选项',
        });
      };
    //完成标注
    const handleOk = () => {
        // 发送
        if(isNull) {
            error();
        } else {
            if(mode === 'single') {
                voteDialogue();
                eventBus.emit('finishAnnotate')
            } else {
                vote();
                eventBus.emit('dialogueFinish', sessionId);
                setisBtn(false);
            }
            setIsModalOpen(false);
        }
    }
    const handleCancel = () => {
        setIsModalOpen(false);
    }
    const onChange = (checkValues: CheckboxValueType[]) => {
        if(checkValues.length != 0) {
            setIsNull(false);
        }
    }
    const options = names.map((model:any, index:number) => ({
        label: model,
        value: index,
    }));
    const optionsWithDisabled = options;
    const allDis = () => {
        setIsDis(!isDis);
        console.log('都不选')
    }
    // 投票功能
    const vote = () => {
        const username = localStorage.getItem('username')
        const dialogue_id = null
        const turn_id = sessionId
        const vote_result = "moss_01"
        const vote_model = {};
        models?.forEach((element) => {
            vote_model[element.nickname] = element.model_id
        });
        const data = {
            'username': username,
            'vote_result': vote_result,
            'vote_model': vote_model,
            'dialogue_id': dialogue_id,
            'turn_id': turn_id
        }
        console.log('打包数据', data)
        http.post<any,any>('/vote?', {data: data}).then((res) => {
            console.log('会话标注成功', res);
          }).catch(() => {
            console.log('会话标注失败')
          });
    }
    const voteDialogue = () => {
        const username = localStorage.getItem('username')
        const dialogue_id = ids
        const turn_id = null
        const vote_result = "moss_01"
        const vote_model = {};
        models?.forEach((element) => {
            vote_model[element.nickname] = element.model_id
        });
        const data = {
            'username': username,
            'vote_result': vote_result,
            'vote_model': vote_model,
            'dialogue_id': dialogue_id,
            'turn_id': turn_id
        }
        http.post<any,any>('/vote?', {data: data}).then((res) => {
            console.log('会话标注成功', res);
          }).catch(() => {
            console.log('会话标注失败')
          });
    }

    return (
        <>
            {contextHolder}
            <Button type='primary' onClick={showModal} disabled={ !isBtn }>标注</Button>
            <Modal title={title}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="完成标注"
                cancelText="取消"
            >
                请选择任意符合预期的模型
                <br/>
                {isDis ? (
                    <Checkbox.Group
                    options={optionsWithDisabled}
                    disabled
                    />
                ):(
                    <Checkbox.Group options={options} onChange={onChange} />
                )}
                <br/>或者
                <Button onClick={allDis}>{isDis ? <>选择模型</> : <>都不选</>}</Button>
            </Modal>
        </>
    )
}

export default Annotate;