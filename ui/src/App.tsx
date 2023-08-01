import style from "./App.module.less";
import Hello from "@/components/hello/hello";
import { Button } from 'antd';
import { Layout, Space } from 'antd';

const { Header, Footer, Sider, Content } = Layout;
import { Col, Row } from 'antd';


function App() {
  return (
    <Row  gutter={24}>
      <Col span={4} className={style.sider}>
          <h1 className={style.logo}>ChatZoo</h1>
      </Col>
      <Col span={20} className={style.main}>
        Model
      {/* <Layout>
      <Sider>Sider</Sider>
      <Layout>
        <Content>
          <div className={style.app} id="app">
            <div className={style.content}>
              <Hello />
            </div>
            <Button type="primary">Button</Button>
        </div>
        </Content>
      </Layout>
    </Layout> */}
      </Col>
    </Row>
  );
}

export default App;
