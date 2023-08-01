import style from "./App.module.less";
import Mode from "./components/mode/mode"
import { Col, Row } from 'antd';


function App() {
  return (
    <Row  gutter={24} className={style.row}>
      <Col span={4} className={style.sider}>
          <h1 className={style.logo}>ChatZoo</h1>
      </Col>
      <Col span={20} className={style.main}>
        <Mode></Mode>
      </Col>
    </Row>
  );
}

export default App;
