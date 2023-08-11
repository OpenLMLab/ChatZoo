import Add from "@/components/add/add";
import Bottom from "@/components/bottom/bottom";
import Chat from "@/components/chat/chat";
import Mode from "@/components/mode/mode";
import { ModeContext, ModeContextProps } from "@/utils/contexts";
import { QuestionContext, QuestionContextProps } from "@/utils/question";
import { IdContext, IdContextProps } from "@/utils/idcontexts";
import { FreezeContext, FreezeContextProps } from "@/utils/freezecontext";
import Manager from "@/components/manager/manager";
import { Col, Row } from 'antd';
import { useContext, useState } from 'react';
import './home.module.less';
import style from "./home.module.less";
import ModelConfig from "@/components/model/model";
import { createContext } from "vm";
import { ModelContext, ModelContextProps } from "@/utils/modelcontext";

function Home () {

    const [mode, setMode] = useState<string | null>('dialogue');
    const modeValues: ModeContextProps = {
      mode,
      setMode,
    };
    // sessionId
    const [id, setId] = useState<string | null>('default');
    const idContextValues: IdContextProps = {
      id,
      setId
    }
    // question
    const [question, setQuestion] = useState<string | null>(null);
    const questionValues: QuestionContextProps = {
      question,
      setQuestion
    }
    // freeze
    const [freeze, setFreeze] = useState<string | null>(null);
    const freezeValues: FreezeContextProps = {
      freeze,
      setFreeze
    }

    const [models, setModels] = useState<ModelConfig[]>([
      new ModelConfig(
        "fnlp/moss-moon-003-sft",
        "moss_01",
        "fnlp/moss-moon-003-sft",
        { max_length: 2048 },
        0,
        8081,
        {
          meta_prompt: "",
          user_prompt: "Human: {}\n",
          bot_prompt: "\nAssistant: {}\n",
        }
      ),
      new ModelConfig(
        "fnlp/moss-moon-003-sft",
        "moss_01",
        "fnlp/moss-moon-003-sft",
        { max_length: 2048 },
        0,
        8080,
        {
          meta_prompt: "",
          user_prompt: "Human: {}\n",
          bot_prompt: "\nAssistant: {}\n",
        }
      )
    ]);
    const modelsValues: ModelContextProps = {
      models,
      setModels
    }

    interface BottomProps {
      names: string[];
      sessionId: string;
    }

    const modelNames: BottomProps = {
      names: models.map((model) => model.nickname),
      sessionId: 'default'
    }

    return (
        <ModelContext.Provider value={modelsValues} >
            <div className={style.wrapper}>
                  <IdContext.Provider value={idContextValues}>
                <Row  gutter={24} className={style.row}>
                  <Col span={4} className={style.sider}>
                      <h1 className={style.logo}>ChatZoo</h1>
                      <Manager />
                  </Col>
                  <ModeContext.Provider value={modeValues}>
                    <FreezeContext.Provider value={freezeValues}>
                    <Col span={20} className={style.main}>
                      <div className={style.header}>
                        <div className={style.mode}>
                            <Mode></Mode>
                        </div> 
                      </div>
                      <QuestionContext.Provider value={questionValues}>
                        <div className={style.content}>
                          <div className={style.add}>
                            {models.length === 0 ? <Add></Add> : <Chat/>}
                          </div>
                        </div>
                        <div className={style.footer}>
                          <Bottom names={modelNames.names}/>
                        </div>
                        </QuestionContext.Provider>
                    </Col>
                    </FreezeContext.Provider>
                  </ModeContext.Provider>
                </Row>
                </IdContext.Provider>
            </div>
        </ModelContext.Provider>
      );
}

export default Home;
