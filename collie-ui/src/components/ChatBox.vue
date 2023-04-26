<template>
    <div>
        <div class="box-card">
            <div class="chat-header clearfix" style="display: flex; flex-direction: column;">
                <h4>{{ model }}</h4>
                <span>Chat with a bot</span>
            </div>
            <div class="chat-container">
                <div class="chat-body" v-for="(message, index) in dialogue" :key="index">
                    <div :class="Object.keys(message)[0] === 'BOT' ? 'left' : 'right'">
                        <p :style="{'white-space': 'pre-line'}">{{ Object.values(message)[0] }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </template>
  
<script>
export default {
    name: 'ChatBox',
    props: {
        name: {
            type: String,
            required: true
        },
        conversations: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            model: this.name,
            dialogue: this.conversations
        };
    },
    methods: {
        deleteChatBox() {
            this.$emit('delete');
        }
    }
};
</script>
<style>

.chat-header {
    background-color: #333;
    color: #fff;
    padding: 10px;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    flex: 1;
    justify-content: space-around;
    
}

.chat-header h4 {
margin: 0;
font-size: 1.2rem;
}

.chat-header span {
font-size: 0.8rem;
opacity: 0.7;
}

.chat-container {
    flex: 15;
    overflow-y: auto;
    height: 100%;
    margin-bottom: 5%;
}


.chat-body {
  display: flex;
  flex-direction: column;
  overflow: auto;
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
    width: 300px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
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
