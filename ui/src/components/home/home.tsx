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
import { Col, Row, Tag } from 'antd';
import { useEffect, useState } from 'react';
import './home.module.less';
import style from './home.module.less';
import { useLocation } from 'react-router-dom';
import EvalBottom from '../evalbottom/evalbottom';

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
    const sys_mode = localStorage.getItem("sys_mode")
    // 关键词的开关列表
    // const [kw_list, setKW] = useState<string []>([]);
    // const all_kws = JSON.parse(localStorage.getItem("kws")!)
    // const selectKW = (keywords: string[], count: number)=> {
    //     const numKeywords = Math.min(count, keywords.length);
    //     const shuffledKeywords = keywords.sort(() => 0.5 - Math.random());
    //     return shuffledKeywords.slice(0, numKeywords);
    //   }
    // const showKW = selectKW(all_kws, 5)
    // if(kw_list.length == 0){
    //     setKW(showKW)
    //     localStorage.setItem("kw"+ id, JSON.stringify(showKW))
    // }


    // 切换会话时候需要切换关键词
    // useEffect(()=>{
    //     const changeKW = (chatId: string)=>{
    //         const new_kw = JSON.parse(localStorage.getItem("kw"+chatId)!)
    //         setKW(new_kw)
    //     }
    //     const createKW = (chatId: string) => {
    //         const new_kw = selectKW(all_kws, 5)
    //         setKW(new_kw)
    //         localStorage.setItem("kw"+ chatId, JSON.stringify(new_kw))
    //     }
    //     const deleteKW = (oldChatId: string, newChatId: string) => {
    //         localStorage.removeItem("kw"+ oldChatId)
    //         changeKW(newChatId)
    //     }
    //     eventBus.on("changeKW", changeKW)
    //     eventBus.on("createKW", createKW)
    //     eventBus.on("deleteKW", deleteKW)
    //     return () => {
    //     eventBus.off("changeKW", changeKW)
    //     eventBus.off("createKW", createKW)
    //     eventBus.off("deleteKW", deleteKW)
    //     }
    // })

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
                                    {/* <div className={style.tag}>
                                        {
                                            kw_list.map((kw, idx) => {
                                                let tag_color = "blue"
                                                if(idx==0) tag_color = "blue"
                                                else if(idx==1) tag_color ="red"
                                                else if(idx==2) tag_color = "green"
                                                else if(idx==3) tag_color = "yellow"
                                                else if(idx==4) tag_color = "volcano"
                                                return <Tag color={tag_color}>{kw}</Tag>
                                            })
                                        }
                                        {/* <Tag color="blue">杜甫</Tag>
                                        <Tag color="red">李白</Tag>
                                        <Tag color="green">唐朝历史</Tag>
                                        <Tag color="green">唐明皇</Tag>
                                        <Tag color="green">中秋佳节</Tag>
                                    </div> */}
                                    <div className={style.mode}>
                                        <Mode></Mode>
                                    </div>
                                </div>
                                <div className={style.content}>
                                    <div className={style.add}>{models.length === 0 ? <Add></Add> : <Chat />}</div>
                                </div>

                                <div className={style.footer}>
                                    {sys_mode === 'evaluation' ? <EvalBottom></EvalBottom> : <Bottom></Bottom>}
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
