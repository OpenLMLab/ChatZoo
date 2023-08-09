import Mode from "@/components/mode/mode"
import Add from "@/components/add/add"
import Bottom from "@/components/bottom/bottom";
import { Col, Row, message } from 'antd';
import style from "./home.module.less";
import './home.module.less';
import { ModeContext, ModeContextProps } from "@/utils/contexts";
import { useState } from 'react';
import Chat from "@/components/chat/chat";

function Home () {
    const [mode, setMode] = useState<string | null>('dialogue');
    const contextValues: ModeContextProps = {
      mode,
      setMode,
    };
    // 模型列表
    const models = [
      {
        "model_name_or_path": "fnlp/moss-moon-003-sft",
        "nickname": "moss_01",
        "tokenizer_path": "fnlp/moss-moon-003-sft",
        "generate_kwargs": {"max_lenght": 2048},
        "device": 0,
        "port": 8080,
        "prompts": { 
             "meta_prompt": "",
             "user_prompt": "Human: {}\n",
             "bot_prompt": "\nAssistant: {}\n"
         },
      }
    ]

    return (
      <>
        <ModeContext.Provider value={contextValues}>
          <div className={style.wrapper}>
            <Row  gutter={24} className={style.row}>
              <Col span={4} className={style.sider}>
                  <h1 className={style.logo}>ChatZoo</h1>
              </Col>
              <Col span={20} className={style.main}>
                <div className={style.header}>
                  <div className={style.mode}>
                    <Mode></Mode>
                  </div> 
                </div>
                <div className={style.content}>
                  <div className={style.add}>
                    {models.length === 0 ? <Add></Add> : <Chat models={models}></Chat>}
                  </div>
                </div>
                <div className={style.footer}>
                  <Bottom></Bottom>
                </div>
              </Col>
            </Row>
          </div>
          {/* <Chat></Chat> */}
        </ModeContext.Provider>
      </>
      );
}

export default Home;