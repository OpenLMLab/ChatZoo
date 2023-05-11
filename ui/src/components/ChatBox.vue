<template>
    <div class="box-card" v-loading="loading" >
        <!-- <el-button @click="drawer=true" type="primary">菜单</el-button> -->
        <!-- <el-drawer :modal="false" title="参数控制" :visible.sync="drawer" direction="ltr" >看看</el-drawer> -->
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
  // 代码块高亮样式
  // stylesheet: '/path/to/highlight.js/styles/github.min.css',
  // 代码块高亮语言
  // preprocess: (code, lang) => { /* ... */ return [code, lang]; },
  // sanitize: false,
  // breaks: false,
  // smartLists: true,
  // silent: false,
  // smartypants: false,
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
        }
    },
    data() {
        return {
            drawer: false,
            model: this.name,
            dialogue: this.conversations,
            // currstatus: this.status,
            loading: false,
            link_loading: false,
            vditor: null,
            counter: 0,
            responseData: null
        };
    },
    watch: {
        // dialogue(newDialogue) {
        //     newDialogue.forEach((message, index) => {
        //         const previewElement = this.$refs.preview[index]
        //         VditorPreview.preview(previewElement, message.content)
        //     });
        // }
        // status(newVal) {
        //     this.currstatus = newVal;  
        // }
        // 'dialogue.*.content'() {
        //     this.renderMarkdown()
        // }
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
        // // 为消息对象生成唯一的 cacheid 属性
        // generateCacheId() {
        // this.counter += 1;
        // return `message_${this.counter}`;
        // },
        // // 渲染 Markdown
        // renderMarkdown() {
        // this.dialogue.forEach((message) => {
        //     const cacheid = message.cacheid || this.generateCacheId();
        //     const preview = this.$refs[`preview_${cacheid}`];
        //     preview.innerHTML = this.vditor.preview(message.content);
        // });
        // },
        deleteChatBox() {
            this.$emit('delete');
        },
        // linkToBox() {
        //     const instance = axios.create({
        //         baseURL: ''
        //     })
        //     const data = [{id: this.id, name:this.name}]
        //     this.link_loading = true
        //     instance.post('/init/', data, {
        //             headers: {
        //             'Content-Type': 'application/json',
        //             },
        //     })
        //     .then((response) => {
        //         const value = response.data[Object.keys(response.data)[0]]
        //         if (value === 0) {
        //             this.$emit('linkResponse', this.id, "success");
        //         } else {
        //             this.$emit('linkResponse', this.id,"info");
        //         }
        //         this.link_loading = false;
        //     })
        //     .catch(() => {
        //         this.link_loading = false;
        //     })
        // },
        chat() {
            // 如果节点状态为info，则直接返回
            // if(this.status === 'info') {
            //     const res = {}
            //     this.$emit('chat-response', res, this.id, 'error');
            // } else {
                const instance = axios.create({
                    baseURL: ''
                })
                const data = {
                    "query": this.dialogue,
                    "params": {}
                }
                this.loading = true
                if(this.isiframe) {
                    const res = {}
                    this.loading = false
                    this.$emit('chat-response', res, this.id);
                    return;
                }
                instance.post(this.url, data, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => {
                    const res = {"role": "BOT", "content": response.data.response}
                    this.$emit('chat-response', res, this.id);
                    this.loading = false;
                })
                .catch((error) => {
                    this.$message.error('模型'+this.model+'未收到信息，请查看连接！')
                    console.error(error);
                    const res = {"role": "BOT", "content": '网络错误'}
                    this.$emit('chat-response', res, this.id);
                    this.loading = false;
                })
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
        
        // 在每个消息的预览元素上调用 mermaidRender 方法
        // this.dialogue.forEach((message) => {
        //     // const previewElement = this.$refs.preview[index];
        //     Vditor.preview(this.$refs.preview, message.content,
        //         {
        //             hljs: {style: "github"}
        //         }
        //     );
        //     // console.log(previewElement)
        // });
        // 创建 Vditor 实例
        // this.vditor = new Vditor(document.createElement('div'), {
        //     mode: 'preview',
        //     cache: {
        //         enable: false
        //     }
        // });
        // 渲染已有消息
        // this.renderMarkdown();

        // console.log('创建', this.vditor)
        // // 渲染已有消息
        // this.renderMarkdown()
        // // 监听 dialogue 数组的变化并渲染每个消息
        // this.$watch('dialogue', (newVal) => {
        //     newVal.forEach((message, index) => {
        //         const previewElement = this.$refs.preview[index];
        //         VditorPreview.preview(previewElement, message.content);
        //     });
        // }, { deep: true });
        // this.dialogue.forEach((message, index) => {
        //     console.log('消息体', message.content)
        //     this.vditors[index] = new Vditor(this.$refs.vditor[index], {
        //         value: message.content,
        //         mode: 'preview',
        //         "toolbarConfig": {
        //             "hide": true
        //         },
        //         height: 'auto',
        //         cache: {
        //             enable: false
        //         }
        //     })
        //     console.log(this.vditors[index])
        // })
    },
    beforeDestroy() {
        delete window.handleJsonResponse;
    },
    computed: {
        // statusClass() {
        //     switch(this.currstatus) {
        //         case 'success':
        //             return '在线';
        //         case 'info':
        //             return '离线';
        //         default:
        //             return '离线';
        //     }
        // }
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
    margin-right: 30px;
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

</style>
