import React, {useContext, useState} from "react";
import {Button, Modal, Checkbox, message } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { IdContext } from "@/utils/idcontexts";
import { ModelContext } from "@/utils/modelcontext";

/*参数与bottom一致*/

const Annotate: React.FC = () => {
    const sessionId = useContext(IdContext)?.id;
    const [messageApi, contextHolder] = message.useMessage();
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
    return (
        <>
            {contextHolder}
            <Button type='primary' onClick={showModal}>标注</Button>
            <Modal title="会话标注"
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