<template>
    <el-container>
        <el-header style="height: 10%; margin-top: 0;">
            <h1 style="font-size: 2rem; font-weight: bold; color: #333; text-align: center;">Collie    评测界面</h1>
        </el-header>
        <el-main style="height: 80%; display: flex; flex-direction: row;">
          <div style="display: flex; flex: 1; width: 100%;" @touchmove.prevent>
            <carousel :key="models.length" ref="carouselRef" style="display: flex; flex: 1;" :per-page="itemPerPage" :autoplay="false" :navigation-enabled="true" :loop="true" no-touch>
              <slide v-for="(model, index) in models" :key="index">
                <div class="slide-content">
                  <ChatBox ref="chat" :name="model.name" :id="model.id" :conversations="model.dialogue" :status="model.status" :url="model.url" @delete="deleteBox(model)" @chat-response="handleChatResponse"/>
                </div>
              </slide>
            </carousel>
          </div>
          <div class="console">
            <div class="newbox">
              <NewBox @new-box-data="handleNewBoxData" />
            </div>

          </div>
        </el-main>
        <el-footer style="height: 10%;">
            <div class="chat-input">
                <button class="clear-button" @click="clearDialogue"><i class="iconfont">&#xe946;</i></button>
                <input type="text" placeholder="一起来聊聊天吧~" @keyup.enter="sendMessage" v-model="newMessage">
                <button class="send-button" @click="sendMessage" ><i class="iconfont">&#xe604;</i></button>
                <button class="send-button" @click="downloadIt"><i class="iconfont">&#xe623;</i></button>                
            </div>
            <div class="testConnect">
              <el-button @click="testConnect" type="success">测试连接</el-button>
            </div>
        </el-footer>
    </el-container>
</template>

<script>
import ChatBox from './ChatBox.vue'
import NewBox from './NewBox.vue'
import { Carousel, Slide } from 'vue-carousel'
import axios from 'axios';

window.onload = function() {
};

export default {
  name: 'ModelShow',
  components: {
    Carousel,
    Slide,
    ChatBox,
    NewBox
  },
  methods: {
    handleChatResponse(data, id) {
      console.log(data)
      const model = this.models.find((model) => model.id === id);
      model.dialogue.push(data)
    },
    sendMessage() {
        if(this.newMessage) {
            // 遍历每个dialogue数组
            for(let i = 0; i < this.models.length; i++) {
              this.models[i].dialogue.push({"role":"HUMAN", "content":this.newMessage});
              this.$refs.chat[i].chat()
            }
            this.newMessage = '';
        }
    },
    clearDialogue() {
      this.dialogue_moss = [];
      location.reload();
    },
    downloadIt() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.models));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "dialogue.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    },
    handleNewBoxData(data) {
      let newModel = {}
      newModel.name = data.name
      newModel.dialogue = data.dialogue
      newModel.status = data.status
      newModel.url = data.url
      newModel.id = data.id
      this.models.push(newModel)
      console.log('新的数据', this.models)
    },
    deleteBox(model) {
      // 删除models数组中的元素
      const index = this.models.indexOf(model); 
      console.log(index)
      this.models.splice(index, 1);
      console.log(this.models)
    },
    testConnect() {
      const instance = axios.create({
        baseURL: 'http://127.0.0.1:10030/'
      })
      const data = this.models.map((model) => {
        return {
          id: model.id,
          name: model.name
        }
      })
      console.log(data)
      const loading = this.$loading({
        lock: true,
        text: '模型启动中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0,0,0,0.7)'
      })
      instance.post('/init/', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        console.log('返回',response.data);
        const lenOfResponse = Object.keys(response.data).length;
        console.log('大小',lenOfResponse)
        for (let i = 0; i < lenOfResponse; i++) {
          const value = response.data[Object.keys(response.data)[i]]
          if (value === 0) {
            this.models[i].status = 'success'
          } else {
            this.models[i].status = 'info'
          }
        }
        console.log(this.models)
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        loading.close();
      })
    }
  },
  data() {
    return {
        showNewBox: false,
        models:[
          {
            'id': "0",
            "name": "fnlp/moss-moon-003-base", 
            "dialogue": [
                          {"role":"BOT", "content": "Hello"},
                          {"role":"HUMAN", "content": "Hello，我是人类"},
                        ],
            "status": "info",
            "url": "/generate/0"
          },
          {
            "id": "1",
            "name": "THUDM/chatglm-6b",
            "status": "info",
            "dialogue": [
                          {"role":"BOT", "content": "Hello"},
                          {"role":"HUMAN", "content": "Hello，我是人类"},
                        ],
            "url": "/generate/1"
          },
          {
            "id": "2",
            "name": "YeungNLP/firefly-1b4",
            "dialogue": [
                          {"role":"BOT", "content": "Hello"},
                          {"role":"HUMAN", "content": "Hello，我是人类"},
                        ],
            "status": "info",
            "url": "/generate/2"
          }
        ],
        newMessage: '',

    }
  },
  mounted() {
    this.$nextTick(() => {
      const lastSlideIndex = this.models.length - 1;
      const lastSlide = this.$refs.carouselRef.getSlide(lastSlideIndex);
      if (lastSlide) {
        this.showNewBox = true;
      }
    });
  },
  computed: {
    itemPerPage() {
      const innerHeight = window.innerHeight * 0.8 * 0.9;
      // 理想的每页的个数
      let idelNum = Math.floor(window.innerWidth / (innerHeight / 2));
      console.log('理想',idelNum)
      // 如果理想的个数 大于总个数
      if (idelNum >= this.models.length) {
        console.log('现在的页数',this.models.length)
        return this.models.length;
      } else {
        console.log('现在的页数',idelNum)
        return idelNum;
      }
    }
  }

}
</script>
  
<style>
.body {
  overflow-y: hidden;
}

.el-container {
    padding: 0; margin: 0; height: 100vh; 
    overflow-y: hidden;
}
.el-header {
    background-color: #FFF;
    color: #333;
    text-align: center;
}

.el-footer {
    background-color: #FFFFFF;
    color: #333;
    text-align: center;
    display: flex;
}

.el-main {
    background-color: #FFFFFF;
    color: #FFF;
    text-align: center;
    overflow: hidden;
    display: flex;
}

body > .el-container {
    margin-bottom: 0px;
    height: 100%;
}

.chat-input {
  display: flex;
  align-items: center;
  justify-content: center; /* 新增：水平居中 */
  border-radius: 20px;
  height: 60%;
  width: 80%; /* 新增：设置宽度为200像素 */
  margin: 0 auto; /* 新增：设置左右外边距为自动，实现水平居中 */
  padding: 10px;
  border: 1px solid black;
}

.chat-input input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 8px;
  margin-right: 10px;
}

.chat-input button {
  border: none;
  background-color: transparent;
  outline: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #999;
}

.chat-input button:hover {
  color: #333;
}

.clear-button {
  margin-right: 5px;
}

.send-button {
  margin-left: auto;
}

.VueCarousel{
  height: 100%;
  width: 100%;
  flex: 5
}

.newbox {
  height: 90%;
}

.VueCarousel-wrapper{
  height: 100%;
}

/* 让每个 slide 等距离分布 */
.VueCarousel-inner {
  display: flex;
  justify-content: space-between;
  height: 90% !important;
}

.VueCarousel-slide .VueCarousel-slide-active {
  width: 100%;
}

/* 让每个 slide 的内容水平居中 */
.slide-content {
  flex: 1;
  display: flex;
  justify-content: center;
  height: 100%;
  width: 100%
}
</style>