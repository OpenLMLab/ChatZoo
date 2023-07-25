<template>
    <div class="box-card" v-loading="loading" >
        <div class="chat-header clearfix" style="display: flex; flex-direction: column; position:relative;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; justify-content: center; flex: 1;">
                    <h4 style="margin: 0;">{{ model }}</h4>
                </div>
                <div>
                    <el-button type="danger" icon="el-icon-delete" size="mini" @click.prevent="deleteChatBox" circle></el-button>
                </div>
            </div>
        </div>
        <div id="chatContainer" class="chat-container" v-if="!isiframe">
            <div class="chat-body" v-for="(message, index) in dialogue" :key="index">
                <div :class="[message.role === 'BOT' ? 'left' : 'right']" ref="preview">
                    <VueMarkdown :source="message.content" v-highlight></VueMarkdown>
                </div>
                
            </div>
        </div>
        <div v-if="isiframe" style="height: 100%;">
            <iframe style="height: 100%;" :src="url" width="100%"></iframe>
        </div>
        <el-dialog 
            title="参数设置" 
            :modal=false
            :visible.sync="dialogFormVisible"
            width="480px"
        >
            <el-form 
            :model="params" 
            ref="form" 
            label-position="left"
            label-width="10px"
            size="medium"
            >
                <el-form-item 
                    v-for="(value, key) in params" 
                    :key="key"
                    :label="key"
                    label-width="auto"
                >
                    <el-input v-if="key!='prompt'" size="medium" v-model="params[key]" :placeholder="key" clearable>
                    </el-input>
                    <el-input v-if="key=='prompt'" size="medium" v-model="params[key]" :placeholder="key" clearable type="textarea" :rows="2" autosize>
                    </el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="setParams">保存设置</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>
        <el-button type="text" @click="dialogFormVisible=true">设置</el-button>  
        
    </div>
</template>
  
<script>
import axios from 'axios';
import VueMarkdown from 'vue-markdown';
import Vue from 'vue';
import hljs from 'highlight.js'
hljs.initHighlightingOnLoad();
Vue.use(VueMarkdown, {
  // 启用代码块渲染
  highlight: true,
});


// 如果开启了typescript 需要额外安装 npm install @types/highlight.js
// 通过 import * as hljs from 'highlight.js' 引入
Vue.directive('highlight', {
  inserted: function (el) {
    const blocks = el.querySelectorAll('code');
    blocks.forEach(block => {
      hljs.highlightBlock(block);
      block.addEventListener('click', () => {
        const codeText = block.innerText;
        navigator.clipboard.writeText(codeText).then(() => {
          console.log('代码已复制到剪贴板');
        }, () => {
            console.error('代码复制失败');
        });
      });
    });
  },
});


export default {
    name: 'ChatBox',
    components: {
        VueMarkdown
    },
    props: {
        name: {
            type: String,
            required: true
        },
        conversations: {
            type: Array,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        id: {
            type: String,
            required: true
        },
        isiframe: {
            type: Boolean,
            required: true
        },
        parameters: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            drawer: false,
            model: this.name,
            dialogue: this.conversations,
            loading: false,
            link_loading: false,
            vditor: null,
            counter: 0,
            responseData: null,
            params: this.parameters,
            dialogFormVisible: false
        };
    },
    watch: {
    },
    updated: function() {
        this.$nextTick(() => {
            const chatContainer = this.$el.querySelector('.chat-container');
            if(!this.isiframe) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
        });
    },
    methods: {
        setParams() {
            this.dialogFormVisible = false
            console.log(this.parameters)
            // 将某些字符串改为 数值型
            
            // fastchat-t5
            if (Object.prototype.hasOwnProperty.call(this.parameters, "max_new_tokens")){
                this.params['max_new_tokens'] = parseInt(this.parameters['max_new_tokens'])
            }
            if (Object.prototype.hasOwnProperty.call(this.parameters, "context_len")){
                this.params['context_len'] = parseInt(this.parameters['context_len'])
            }
            // chatgpt
            if (Object.prototype.hasOwnProperty.call(this.parameters, "n")){
                this.params['n'] = parseInt(this.parameters['n'])
            }
            if(Object.prototype.hasOwnProperty.call(this.parameters, "max_tokens")){
                this.params['max_tokens'] = parseInt(this.parameters['max_tokens'])
            }
            // baize
            if (Object.prototype.hasOwnProperty.call(this.parameters, "max_length")){
                this.params['max_length'] = parseInt(this.parameters['max_length'])
            }
            if(Object.prototype.hasOwnProperty.call(this.parameters, "num_beams")){
                this.params['num_beams'] = parseInt(this.parameters['num_beams'])
            }

            if(Object.prototype.hasOwnProperty.call(this.parameters, "temperature")){
                this.params['temperature'] = parseFloat(this.parameters['temperature'])
            }
            
            if(Object.prototype.hasOwnProperty.call(this.parameters, "top_p")){
                this.params['top_p'] = parseFloat(this.parameters['top_p'])
            }

            if(Object.prototype.hasOwnProperty.call(this.parameters, "top_k")){
                this.params['top_k'] = parseFloat(this.parameters['top_k'])
            }

            if(Object.prototype.hasOwnProperty.call(this.parameters, "repetition_penalty")){
                this.params['repetition_penalty'] = parseFloat(this.parameters['repetition_penalty'])
            }

            if(Object.prototype.hasOwnProperty.call(this.parameters, "frequency_penalty")){
                this.params['frequency_penalty'] = parseFloat(this.parameters['frequency_penalty'])
            }
            this.$emit('update:parameters', this.params)
        },
        deleteChatBox() {
            this.$emit('delete');
        },
        chat() {
            const instance = axios.create({
                baseURL: ''
            })
            const data = {
                "query": this.dialogue,
                "params": this.params
            }
            this.loading = true
            if(this.isiframe) {
                const res = {}
                this.loading = false
                this.$emit('chat-response', res, this.id);
                return;
            }
            let sseClient = this.$sse.create(this.url+'/stream')
            
            sseClient.on('message', (msg) => {
                const res = {"role": "BOT", "content": msg}
                console.info('Message:', res)
                this.$emit('chat-response', res, this.id, false);
            })
            
            console.log("request", this.url, data)
            instance.post(this.url, data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => {
                const res = {"role": "BOT", "content": response.data.response}
                this.$emit('chat-response', res, this.id, true);
                // this.loading = false;
                console.log(res, this.id)
                sseClient.connect().then(()=>{
                    console.log("connect")
                })
            })
            .catch((error) => {
                this.$message.error('模型'+this.model+'未收到信息，请查看连接！')
                console.error(error);
                const res = {"role": "BOT", "content": '网络错误'}
                this.$emit('chat-response', res, this.id);
                this.loading = false;
            })
            sseClient.disconnect()
            this.loading = false;
        },
        scrollToBottom() {
            const chatContainer = this.$el.querySelector('.chat-container');
            if(!this.isiframe) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
        }
    },
    mounted() {
        if(!this.isiframe) {
            this.scrollToBottom();
        } else {
            const script = document.createElement('script');
            script.src = this.url ;
            document.head.appendChild(script);
            window.handleJsonResponse = (response) => {
                this.$refs['web-page'].innerHTML = response
            }
        }
    },
    beforeDestroy() {
        delete window.handleJsonResponse;
    },
    computed: {
    }
};
</script>


<style>
.btn-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}
.delete-btn:hover {
  background-color: #d32f2f;
}

.chat-header {
    align-items: center;
    background-color: #333;
    color: #fff;
    padding: 10px;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    flex: 1;
    display: flex;
}

.chat-header h4 {
margin: 0;
font-size: 1.8rem;
}

.chat-header span {
font-size: 2.8rem;
opacity: 0.7;
}

.chat-container {
    flex: 15;
    overflow-y: auto;
    height: 100%;
    margin-bottom: 5%;
    display: flex;
    flex-direction: column;
}


.chat-body {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.text {
font-size: 14px;
}

.item {
margin-bottom: 18px;
}

.clearfix:before,
.clearfix:after {
display: table;
content: "";
}
.clearfix:after {
clear: both
}

.box-card {
    width: 80%;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif, "Times New Roman";
    /* margin-right: 30px; */
    height: 100%;
    max-width: 480px;
}

.left, .right {
    border-radius: 5px;
    font-weight: 400;
}

.left {
  text-align: left;
  max-width: 60%;
  height: auto;
  background-color: #e6e6e6;
  color: #000;
  padding: 10px;
  border-radius: 5px;
  margin-left: 20px;
  margin-top: 20px;
  align-self: flex-start;
  word-break: break-all;
}

.right {
  text-align: left;
  max-width: 60%;
  height: auto;
  background-color: #7ed957;
  color: #000;
  padding: 10px;
  border-radius: 5px;
  margin-right: 20px;
  margin-top: 20px;
  align-self: flex-end;
}

.left p, .right p {
  margin: 0;
  line-height: 1.5;
}

.code.hljs {
  white-space: pre-wrap;
}
.el-dialog__wrapper {
    position: relative !important;
    height: 100%;
}
.el-dialog{
    display: flex;
    display: -ms-flex; /* 兼容IE */
    flex-direction: column;
    -ms-flex-direction: column; /* 兼容IE */
    margin:0 !important;
    position:relative;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    max-height:calc(100% - 30px);
    max-width:calc(100% - 30px);
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0,0,0,.3);
    box-sizing: border-box;
}
.el-dialog .el-dialog__body{
    max-height: 100%;
    flex: 1;
    -ms-flex: 1 1 auto; /* 兼容IE */
    overflow-y: auto;
    overflow-x: hidden;
}

.el-form-item {
    margin-bottom: 0;
    padding: 3% 10% 0 10% !important;
}
.el-form-item__label{
    color: rgb(15, 15, 15);
    font-size: 18px;
}
.el-input__inner{
    font-size: 16px;
    padding-left: 2px!important;
}
.el-dialog__title {
    line-height: 30px;
    font-size: 20px;
}
</style>
