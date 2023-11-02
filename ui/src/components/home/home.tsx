import Add from '@/components/add/add';
import Bottom from '@/components/bottom/bottom';
import Chat from '@/components/chat/chat';
import ColorPicker from '@/components/color-picker/color-picker';
import Manager from '@/components/manager/manager';
import Mode from '@/components/mode/mode';
import ModelConfig from '@/components/model/model';
import { ModeContext, ModeContextProps } from '@/utils/contexts';
import { IdContext, IdContextProps } from '@/utils/idcontexts';
import { ModelContext, ModelContextProps } from '@/utils/modelcontext';
import { Col, Row, Select, Tag } from 'antd';
import { useEffect, useState } from 'react';
import './home.module.less';
import style from './home.module.less';
import { useLocation } from 'react-router-dom';
import EvalBottom from '../evalbottom/evalbottom';
import EvalOverall from "../evaloverall/evaloverall"
import eventBus from '@/utils/eventBus';
import { DefaultOptionType } from 'antd/es/select';

function Home() {

    const [mode, setMode] = useState<string | null>('dialogue');
    const modeValues: ModeContextProps = {
        mode,
        setMode,
    };

    // sessionId
    const [id, setId] = useState<string | null>(Date.now().toString());
    const idContextValues: IdContextProps = {
        id,
        setId,
    };

    const [models, setModels] = useState<ModelConfig[]>([]);
    // 获取登录页面传来的数据
    const location = useLocation();
    const data = location.state;
    console.log(data);
    if (data && models.length == 0) {
        setModels(data);
    }
    const modelsValues: ModelContextProps = {
        models,
        setModels,
    };

    const [evalBottomSwitch, setEvalBottomSwitch] = useState(true)
    const sysMode = localStorage.getItem("sys_mode")
    const [showEvalPage, setShowEvalPage] = useState(true)
    useEffect(() => {
        const switchEvalPage = (switch_key: boolean) => {
            setShowEvalPage(switch_key)
            console.log("switch eval Page", switch_key)
        }
        const switchEvalBottom = (switch_key: boolean) => {
            setEvalBottomSwitch(switch_key)
            console.log("switch eval bottom", switch_key)
        }
        eventBus.on("evalPageSwitch", switchEvalPage)
        eventBus.on("evalBottomSwitch", switchEvalBottom)
        return () => {
            eventBus.off("evalPageSwitch", switchEvalPage)
            eventBus.off("evalBottomSwitch", switchEvalBottom)
        }
    })
    // 定义 evaluation 时候的搜索框的变量和函数
    const optionFn = (labels: string[]) => {
        let optionLabels: DefaultOptionType[] = []
        labels.forEach((label: string, idx: number) => {
            optionLabels.push({
                value: idx.toString(),
                label: label,
            })
        })
        return optionLabels
    }
    const optionSelectFn = (value: string) => {
        const selectLabel = selectLabels.find(label => value == label.value)
        setSelectValue(selectLabel?.label as string)
        eventBus.emit("onSelectFn", selectLabel?.label)
        console.log(selectLabel)
        setInterval(() => {
            setSelectValue(null)
        }, 2000)
    }
    let initSelectLabels: DefaultOptionType[] = []
    if (sysMode === 'evaluation')
        initSelectLabels = optionFn(JSON.parse(localStorage.getItem("dataset_name")!))
    const [selectLabels, setSelectLabels] = useState<DefaultOptionType[]>(initSelectLabels)
    const [selectValue, setSelectValue] = useState<string | null>(null)

    return (
        <ModelContext.Provider value={modelsValues}>
            <div className={style.wrapper}>
                <IdContext.Provider value={idContextValues}>
                    <ModeContext.Provider value={modeValues}>
                        <Row gutter={24} className={style.row}>
                            <Col span={4} className={style.sider}>
                                <h1 className={style.logo}>ChatZoo</h1>
                                <div className={style.colorpicker}>
                                    <ColorPicker />
                                </div>
                                {sysMode === 'evaluation' &&
                                    <div className={style.selector}>
                                        <Select
                                            showSearch
                                            style={{ width: '100%' }}
                                            placeholder="Search to Select"
                                            optionFilterProp="children"
                                            onSelect={optionSelectFn}
                                            value={selectValue}
                                            filterOption={(input, option) => (option?.label ?? '').toString().includes(input)}
                                            filterSort={(optionA, optionB) =>
                                                (optionA?.label ?? '').toString().toLowerCase().localeCompare((optionB?.label ?? '').toString().toLowerCase())
                                            }
                                            options={selectLabels}
                                        />
                                    </div>}
                                <Manager />
                            </Col>
                            <Col span={20} className={style.main}>
                                <div className={style.header}>
                                    <div className={style.mode}>
                                        <Mode></Mode>
                                    </div>
                                </div>
                                <div className={style.content}>
                                    {sysMode === 'evaluation' ?
                                        (!showEvalPage ? <EvalOverall></EvalOverall> :
                                            <div className={style.add}>{models.length === 0 ? <Add></Add> : <Chat />}</div>) :
                                        <div className={style.add}>{models.length === 0 ? <Add></Add> : <Chat />}</div>
                                    }
                                </div>

                                <div className={style.footer}>
                                    {sysMode === 'evaluation' ? (evalBottomSwitch ? <EvalBottom></EvalBottom> : <div></div>) : <Bottom></Bottom>}
                                </div>
                            </Col>
                        </Row>
                    </ModeContext.Provider>
                </IdContext.Provider>
            </div>
        </ModelContext.Provider>
    );
}

export default Home;
