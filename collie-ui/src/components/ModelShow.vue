<template>
    <el-container>
        <el-header style="height: 10%;">
            <h1 style="font-size: 2rem; font-weight: bold; color: #333; text-align: center;">Collie    评测界面</h1>
        </el-header>
        <el-main style="height: 80%; display: flex; flex-direction: row;">
          <div style="display: flex; flex: 1;">
            <carousel :key="models.length" ref="carouselRef" style="display: flex; flex: 1;" :per-page="2" :autoplay="false" :navigation-enabled="false" :loop="true">
              <slide v-for="(model, index) in models" :key="index">
                <div class="slide-content">
                  <ChatBox :name="model.name" :conversations="model.dialogue" @delete="deleteBox(model)"/>
                </div>
              </slide>
              <slide v-if="showNewBox">
                <div class="slide-content">
                  <NewBox @new-box-data="handleNewBoxData" />
                </div>
              </slide>
            </carousel>
          </div>
        </el-main>
        <el-footer style="height: 10%;">
            <div class="chat-input">
                <button class="clear-button" @click="clearDialogue"><i class="iconfont">&#xe946;</i></button>
                <input type="text" placeholder="一起来聊聊天吧~" @keyup.enter="sendMessage" v-model="newMessage">
                <button class="send-button" @click="sendMessage" ><i class="iconfont">&#xe604;</i></button>
                <button class="send-button" @click="downloadIt"><i class="iconfont">&#xe623;</i></button>
            </div>
        </el-footer>
    </el-container>
</template>

<script>
import ChatBox from './ChatBox.vue'
import NewBox from './NewBox.vue'
import { Carousel, Slide } from 'vue-carousel'

export default {
  name: 'ModelShow',
  components: {
    Carousel,
    Slide,
    ChatBox,
    NewBox
  },
  methods: {
    sendMessage() {
        if(this.newMessage) {
            // 遍历每个dialogue数组
            for(let i = 0; i < this.models.length; i++) {
              this.models[i].dialogue.push({'HUMAN': this.newMessage});
            }
            this.newMessage = '';
            console.log(this.models)
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
      this.models.push(newModel)
      console.log(this.models)
    },
    deleteBox(model) {
      // 删除models数组中的元素
      const index = this.models.indexOf(model); 
      console.log(index)
      this.models.splice(index, 1);
      console.log(this.models)
    }
  },
  data() {
    return {
        showNewBox: false,
        models:[
          {
            "name": "MOSS", 
            "dialogue": [
                          {"BOT":"你好，我是BOT"},
                          {"HUMAN":"你好，我是HUMAN"},
                          {"BOT":"很高兴认识你"},
                          {"HUMAN":"我也是。"},
                          {"BOT":"你好，我是BOT"},
                          {"HUMAN":"你好，我是HUMAN"},
                          {"BOT":"很高兴认识你"},
                          {"HUMAN":"我也是。"},
                          {"BOT":"你好，我是BOT"},
                          {"HUMAN":"你好，我是HUMAN"},
                          {"BOT":"很高兴认识你"},
                          {"HUMAN":"我也是。"},
                          {"BOT":"你好，我是BOT"},
                          {"HUMAN":"你好，我是HUMAN"},
                          {"BOT":"很高兴认识你"},
                          {"HUMAN":"我也是。"}
                        ]
          },
          {
            "name": "Alpaca1",
            "dialogue":  
            [
              {"BOT": "你好，我是Alpaca，请以这样的格式与我对话：\n[INSTRUCT]Who are you?\n[INPUT]None\n或者\n[INSTRUCT]Please arrange the words below in alphabetical order.\n[INPUT]apple, banana, grape"}
            ]
          },
          {"name": "Alpaca2",
          "dialogue": 
            [
              {"BOT": "你好，我是Alpaca，请以这样的格式与我对话：\n[INSTRUCT]Who are you?\n[INPUT]None\n或者\n[INSTRUCT]Please arrange the words below in alphabetical order.\n[INPUT]apple, banana, grape"}
            ]
          }
        ],
        newMessage: '',

    }
  },
  mounted() {
    this.$nextTick(() => {
      // 在 mounted 生命周期钩子中检查最后一个轮播项
      console.log(this.$refs.carouselRef);
      const lastSlideIndex = this.models.length - 1;
      const lastSlide = this.$refs.carouselRef.getSlide(lastSlideIndex);
      if (lastSlide) {
        this.showNewBox = true;
      }
    });
  },

}
</script>
  
<style>
.el-container {
    padding: 0; margin: 0; height: 100vh; 
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
}

.el-main {
    background-color: #FFFFFF;
    color: #FFF;
    text-align: center;
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
}

.VueCarousel-wrapper{
  height: 100%;
}

/* 让每个 slide 元素宽度为父容器的宽度 */
.VueCarousel-inner .VueCarousel-slide {
  width: 100%;
}

/* 让每个 slide 等距离分布 */
.VueCarousel-inner {
  display: flex;
  justify-content: space-between;
  height: 90% !important;
}

/* 让每个 slide 的内容水平居中 */
.slide-content {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 10px;
  height: 100%;
}
</style>