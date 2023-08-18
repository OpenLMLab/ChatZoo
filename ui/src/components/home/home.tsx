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
import { Col, Row } from 'antd';
import { useState } from 'react';
import './home.module.less';
import style from './home.module.less';
import { useLocation } from 'react-router-dom';

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
                                <Manager />
                            </Col>
                            <Col span={20} className={style.main}>
                                <div className={style.header}>
                                    <div className={style.mode}>
                                        <Mode></Mode>
                                    </div>
                                </div>
                                <div className={style.content}>
                                    <div className={style.add}>{models.length === 0 ? <Add></Add> : <Chat />}</div>
                                </div>
                                <div className={style.footer}>
                                    <Bottom />
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
