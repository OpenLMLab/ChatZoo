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
import { useEffect, useState } from 'react';
import './home.module.less';
import style from './home.module.less';
import http from '@/utils/axios';
import eventBus from '@/utils/eventBus';
import { utimes } from 'fs';

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
    let urls = localStorage.getItem("initModelUrls")
    // if(urls != undefined || urls != null){
    //     let initModels: ModelConfig[] = []
    //     // urls = JSON.parse(urls)
    //     const urls1 =  ['http://10.140.1.169:8082', 'http://10.140.1.169:8083']
    //     urls1.forEach(url=>{
    //       http.get<string, any>(url + '/chat/model_info')
    //       .then((res) => {
    //           console.log('返回结果', res.data.data);
    //           const model = new ModelConfig(
    //               res.data.data['model_name_or_path'],
    //               res.data.data['nickname'],
    //               res.data.data['tokenizer_path'],
    //               res.data.data['generate_kwargs'],
    //               res.data.data['device'],
    //               res.data.data['prompts'],
    //               url,
    //               res.data.data['stream'],
    //               res.data.data['model_id'],
    //               true,
    //           );
    //           initModels.push(model)
    //           console.log("Home.tsx initModels: ", initModels, url)
    //           setModels(initModels)
    //       })
    //       .catch(() => {
    //           console.log('添加模型失败!');
    //       });
    //   })
    // }
    // const [models, setModels] = useState<ModelConfig[]>([
    //   new ModelConfig(
    //     "fnlp/moss-moon-003-sft",
    //     "moss",
    //     "fnlp/moss-moon-003-sft",
    //     { max_length: 2048 },
    //     '0',
    //     {
    //       meta_prompt: "",
    //       user_prompt: "Human: {}\n",
    //       bot_prompt: "\nAssistant: {}\n",
    //     },
    //     "http://10.140.1.169:8082",
    //     true,
    //     '0',
    //     true
    //   ),
    //   new ModelConfig(
    //     "THUDM/chatglm-6b",
    //     "chatglm2",
    //     "THUDM/chatglm-6b",
    //     { max_length: 2048 },
    //     '1',
    //     {
    //       meta_prompt: "",
    //       user_prompt: "Human: {}\n",
    //       bot_prompt: "\nAssistant: {}\n",
    //     },
    //     "http://10.140.1.169:8083",
    //     true,
    //     '1',
    //     true
    //   ),
    // ]);

    useEffect(()=>{
      const InitModel = (urls: Array<string>) => {
        let initModels: ModelConfig[] = []
        console.log(urls, "home.tsx")
        // urls =  ['http://10.140.1.169:8082', 'http://10.140.1.169:8083']
        urls.forEach(url=>{
            http.get<string, any>(url + '/chat/model_info')
            .then((res) => {
                console.log('返回结果', res.data.data);
                const model = new ModelConfig(
                    res.data.data['model_name_or_path'],
                    res.data.data['nickname'],
                    res.data.data['tokenizer_path'],
                    res.data.data['generate_kwargs'],
                    res.data.data['device'],
                    res.data.data['prompts'],
                    url,
                    res.data.data['stream'],
                    res.data.data['model_id'],
                    true,
                );
                initModels.push(model)
                console.log("Home.tsx initModels: ", initModels, url)
                setModels(initModels)
            })
            .catch(() => {
                console.log('添加模型失败!');
            });
        })
        
      }
      eventBus.on("initModels", InitModel)
      return () => {
      eventBus.off("initModels", InitModel)
      }
    })
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
