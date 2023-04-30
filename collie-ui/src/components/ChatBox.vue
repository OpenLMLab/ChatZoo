<template>
    <div class="box-card" v-loading="loading">
        <!-- <el-button @click="drawer=true" type="primary">菜单</el-button> -->
        <!-- <el-drawer :modal="false" title="参数控制" :visible.sync="drawer" direction="ltr" >看看</el-drawer> -->
        <div class="chat-header clearfix" style="display: flex; flex-direction: column; position:relative">
            <div style="display: flex; justify-content: flex-end; align-items: center; width: 100%;">
                <div>
                    <el-button type="danger" icon="el-icon-delete" size="mini" @click.prevent="deleteChatBox" circle></el-button>
                </div>
            </div>
            <div style="display: flex;">
                <h4>{{ model }}</h4>
                <!-- <el-tag size="mini" effect="dark" :type="currstatus" style="margin-left: 10px;">{{statusClass}}</el-tag> -->
            </div>
        </div>
        <div id="chatContainer" class="chat-container">
            <div class="chat-body" v-for="(message, index) in dialogue" :key="index">
                <div  :class="(message.role) === 'BOT' ? 'left' : 'right'">
                    <p>{{ message.content }}</p>
                    <!-- <MarkdownPreview :initialValue=message.content :copyCode="true" /> -->
                </div>  
            </div>
        </div>
    </div>
</template>
  
<script>
import axios from 'axios';
// import { MarkdownPreview } from 'vue-meditor'

export default {
    name: 'ChatBox',
    // components: {
    //     MarkdownPreview
    // },
    props: {
        name: {
            type: String,
            required: true
        },
        conversations: {
            type: Array,
            required: true
        },
        // status: {
        //     type: String,
        //     required: true
        // },
        url: {
            type: String,
            required: true
        },
        id: {
            type: String,
            required: true
        },
    },
    data() {
        return {
            drawer: false,
            model: this.name,
            dialogue: this.conversations,
            // currstatus: this.status,
            loading: false,
            link_loading: false
        };
    },
    watch: {
        // status(newVal) {
        //     this.currstatus = newVal;  
        // }
    },
    updated: function() {
        this.$nextTick(() => {
            const chatContainer = this.$el.querySelector('.chat-container');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    },
    methods: {
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
                console.log(this.model,'发送消息')
                console.log(this.chat)
                const instance = axios.create({
                    baseURL: ''
                })
                const data = this.dialogue
                this.loading = true
                console.log('连接', this.url)
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
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    },
    mounted() {
        this.scrollToBottom();
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

</style>
