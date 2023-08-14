import Add from '@/components/add/add';
import Bottom from '@/components/bottom/bottom';
import Chat from '@/components/chat/chat';
import ColorPicker from '@/components/color-picker/color-picker';
import Manager from '@/components/manager/manager';
import Mode from '@/components/mode/mode';
import ModelConfig from '@/components/model/model';
import { ModeContext, ModeContextProps } from '@/utils/contexts';
import { FreezeContext, FreezeContextProps } from '@/utils/freezecontext';
import { IdContext, IdContextProps } from '@/utils/idcontexts';
import { ModelContext, ModelContextProps } from '@/utils/modelcontext';
import { QuestionContext, QuestionContextProps } from '@/utils/question';
import { Col, Row } from 'antd';
import { useState } from 'react';
import './home.module.less';
import style from './home.module.less';
import http from '@/utils/axios';

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

    const initModels: ModelConfig[] = []


    const [models, setModels] = useState<ModelConfig[]>([
      new ModelConfig(
        "fnlp/moss-moon-003-sft",
        "moss_01",
        "fnlp/moss-moon-003-sft",
        { max_length: 2048 },
        '0',
        {
          meta_prompt: "",
          user_prompt: "Human: {}\n",
          bot_prompt: "\nAssistant: {}\n",
        },
        "http://10.140.1.169:8082",
        true,
        '0',
        true
      ),
    ]);
    // const model_list = JSON.parse(localStorage.getItem("init_models")!)
    // if(model_list === undefined || model_list ===null){
      
    // }else{
    //   setModels(model_list)
    // }

    const modelsValues: ModelContextProps = {
        models,
        setModels,
    };

  return (
    <ModelContext.Provider value={modelsValues} >
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
                      <div className={style.add}>
                        {models.length === 0 ? <Add></Add> : <Chat />}
                      </div>
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
