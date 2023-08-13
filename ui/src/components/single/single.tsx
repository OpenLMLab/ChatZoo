import style from '@/components/single/single.module.less';
import React, { useContext, useState } from 'react';
import { Button, Checkbox } from 'antd';
import { ModelContext } from '@/utils/modelcontext';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';

const Single: React.FC = () => {
    const [btnStatus, setbtnStatus] = useState('default');
    const [ifDisable, setifDisable] = useState(false);
    const [checkedList, setCheckedList] = useState<CheckboxValueType[]>([]);
    const onChange = (list: CheckboxValueType[]) => {
        setCheckedList(list);
    };
    const models = useContext(ModelContext)?.models;
    const plainOptions: any[] = [];
    models?.map((model) => {
        plainOptions.push(model.nickname);
    });
    const clickBtn = () => {
        setbtnStatus('primary');
        setifDisable(true);
    };
    return (
        <>
            <div className={style.label}>请选择任意符合预期的模型</div>
            <div className={style.checkbox}>
                <Checkbox.Group disabled={ifDisable} options={plainOptions} value={checkedList} onChange={onChange} />
            </div>
            或
            <div className={style.btn}>
                <Button type={btnStatus} ghost onClick={clickBtn}>
                    均不符合预期
                </Button>
            </div>
        </>
    );
};

export default Single;
