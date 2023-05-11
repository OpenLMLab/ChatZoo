<template>
  <el-container>
      <el-header style="height: 10%; margin-top: 0; display: flex;">
          <h1 style="font-size: 2rem; font-weight: bold; color: #333; align-items: center; display: flex; flex:1; justify-content: center;">Chat Zoo</h1>
      </el-header>
      <el-main style="height: 80%; width: 100%;">
        <div style="width: 100%;" @touchmove.prevent>
          <carousel :key="models.length" ref="carouselRef" style="display: flex; flex: 1;" :per-page="itemPerPage" :autoplay="false" :navigation-enabled="true" :loop="true" no-touch>
            <slide v-for="(model, index) in models" :key="index">
              <div class="slide-content">
                <ChatBox ref="chat" :name="model.name" :id="model.id" :conversations="model.dialogue"  :url="model.url" :isiframe="model.isiframe" @delete="deleteBox(model)" @chat-response="handleChatResponse" />
              </div>
            </slide>
          </carousel>
        </div>
      </el-main>
      <el-footer style="height: 10%;">
          <div class="chat-input">
              <button class="clear-button" @click="clearDialogue"><i class="iconfont">&#xe946;</i></button>
              <textarea class="input-box" type="text" placeholder="一起来聊聊天吧~" @keyup.enter="sendMessage" v-model="newMessage"></textarea>
              <button class="send-button" @click="sendMessage" ><i class="iconfont">&#xe604;</i></button>
              <button class="send-button" @click="downloadIt"><i class="iconfont">&#xe623;</i></button> 
              <button class="send-button" @click="drawer=true"><i class="iconfont">&#xe614;</i></button> 
              <el-drawer :modal="false" title="" :visible.sync="drawer" :with-header="false" direction="rtl" ><NewBox @new-box-data="handleNewBoxData" /></el-drawer>               
          </div>

      </el-footer>
  </el-container>
</template>

<script>
import { Link } from 'element-ui';
import ChatBox from './ChatBox.vue'
import NewBox from './NewBox.vue'
import { Carousel, Slide } from 'vue-carousel'


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
  saveModels() {
    localStorage.setItem('models', JSON.stringify(this.models));
  },
  beforeUnload() {
    this.saveModels()
  },
  handleChatResponse(data, id) {
    const model = this.models.find((model) => model.id === id);
    model.dialogue.push(data)
    this.getNum += 1;
    if(this.getNum == this.models.length) {
      this.canSend = true;
    }
  },
  sendMessage() {
      // 判断信息是否为空
      if(this.newMessage) {Link
        // 判断是否能发送信息
        if(this.canSend) {
          this.getNum = 0
          // 遍历每个dialogue数组
          for(let i = 0; i < this.models.length; i++) {
            // if(this.models[i].status === 'success') {
              this.models[i].dialogue.push({"role":"HUMAN", "content":this.newMessage});
              this.canSend = false;
            // }
            this.$refs.chat[i].chat()  
          }
          this.newMessage = '';
        } else {
          this.$message.error('请等模型回答完毕再输入！')
        }
      } else {
        this.$message.error('消息不能为空！')
      }
  },
  clearDialogue() {
    this.models.forEach((model) => {
      model.dialogue = [];
    });
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
    // newModel.status = data.status
    newModel.url = data.url
    newModel.id = data.id
    newModel.isiframe = data.isiframe
    this.models.push(newModel)
  },
  deleteBox(model) {
    // 删除models数组中的元素
    const index = this.models.indexOf(model); 
    this.models.splice(index, 1);
  },
  // testConnect() {
  //   const instance = axios.create({
  //     baseURL: 'http://127.0.0.1:10030/'
  //   })
  //   const data = this.models.map((model) => {
  //     return {
  //       id: model.id,
  //       name: model.name
  //     }
  //   })
  //   console.log(data)
  //   const loading = this.$loading({
  //     lock: true,
  //     text: '模型启动中...',
  //     spinner: 'el-icon-loading',
  //     background: 'rgba(0,0,0,0.7)'
  //   })
  //   instance.post('/init/', data, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   })
  //   .then((response) => {
  //     console.log('返回',response.data);
  //     const lenOfResponse = Object.keys(response.data).length;
  //     console.log('大小',lenOfResponse)
  //     // for (let i = 0; i < lenOfResponse; i++) {
  //     //   const value = response.data[Object.keys(response.data)[i]]
  //     //   if (value === 0) {
  //     //     this.models[i].status = 'success'
  //     //   } else {
  //     //     this.models[i].status = 'info'
  //     //   }
  //     // }
  //     console.log(this.models)
  //   })
  //   .catch((error) => {
  //     console.error(error);
  //   })
  //   .finally(() => {
  //     const failModels = this.models.filter(model => model.status === 'info')
  //     let failStr = ''
  //     for(let i=0; i<failModels.length; i++) {
  //       failStr += failModels[i].name
  //     }
  //     if(failModels.length != 0){
  //         this.$message({
  //         'type': 'error',
  //         'message': '模型'+failStr+'未加载成功',
  //         'duration': 5000
  //       })
  //     }
  //     loading.close();
  //   })
  // }
},
data() {
  return {
      drawer: false,
      showNewBox: false,
      models:[
        // {
        //   'id': "0",
        //   "name": "fnlp/moss-moon-003-base", 
        //   "dialogue": [
        //                 {"role":"BOT", "content": "Hello"},
        //                 {"role":"HUMAN", "content": "Hello，我是人类"},
        //               ],
        //   // "status": "info",
        //   "url": "/generate/0"
        // },
        // {
        //   "id": "1",
        //   "name": "THUDM/chatglm-6b",
        //   // "status": "info",
        //   "dialogue": [
        //                 {"role":"BOT", "content": "Hello"},
        //                 {"role":"HUMAN", "content": "Hello，我是人类"},
        //               ],
        //   "url": "/generate/1"
        // },
        // {
        //   "id": "2",
        //   "name": "YeungNLP/firefly-1b4",
        //   "dialogue": [
        //                 {"role":"BOT", "content": "Hello"},
        //                 {"role":"HUMAN", "content": "Hello，我是人类"},
        //               ],
        //   // "status": "info",
        //   "url": "/generate/2"
        // }
      ],
      newMessage: '',
      canSend: true,
      getNum: 0
  }
},
created() {
  const saveModels = localStorage.getItem('models')
  if(saveModels) {
    this.models = JSON.parse(saveModels)
  }
},
mounted() {
  window.addEventListener('beforeunload', this.beforeUnload);
  this.$nextTick(() => {
    const lastSlideIndex = this.models.length - 1;
    const lastSlide = this.$refs.carouselRef.getSlide(lastSlideIndex);
    if (lastSlide) {
      this.showNewBox = true;
    }
  });
},
beforeDestroy() {
  window.removeEventListener('beforeunload', this.beforeUnload)
},
computed: {
  itemPerPage() {
    const innerHeight = window.innerHeight * 0.8 * 0.9;
    // 理想的每页的个数
    let idelNum = Math.floor(window.innerWidth * 0.8 / (innerHeight / 2));
    // 如果理想的个数 大于总个数
    let lenOfModels = 0
    if(this.models) {
      lenOfModels = this.models.length
    } else {
      lenOfModels = 0
    }
    if (idelNum >= lenOfModels) {
      return lenOfModels;
    } else {
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

.input-box {
border-radius: 20px;
border: 2px solid black;
padding: 10px;
width: 100%;
height: 80%;

}

.el-container {
  padding: 0; margin: 0; height: 100vh; 
  background-image: linear-gradient(-225deg, #FFFEFF 0%, #D7FFFE 100%);
  overflow-y: hidden;
}
.el-header {
  color: #333;
  text-align: center;
  justify-content: center;

}

.el-footer {
  color: #333;
  text-align: center;
  display: flex;
}

.el-main {
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
font-family: "Times New Roman", Times, serif;
}

.chat-input input {
flex: 1;
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
flex: 4;
}

.console {
flex-basis: 20%;
flex-grow: 1;
}

.newbox {
height: 90%;
width: 100%;
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