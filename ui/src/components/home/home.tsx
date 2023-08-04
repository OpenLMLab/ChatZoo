import Mode from "@/components/mode/mode"
import Add from "@/components/add/add"
import Bottom from "@/components/bottom/bottom";
import { Col, Row } from 'antd';
import style from "./home.module.less";
import './home.module.less'

function Home () {
    return (
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
                  <Add></Add>
                </div>
              </div>
              <div className={style.footer}>
                <Bottom></Bottom>
              </div>
            </Col>
          </Row>
        </div>
      );
}

export default Home;