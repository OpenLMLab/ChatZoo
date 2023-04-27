<template>
    <div class="new-box-card">
        <div class="chat-header clearfix" style="display: flex; flex-direction: column;">
            <h4>控制台</h4>
            <span>注册、修改模型</span>
        </div>
        <div class="box-main">
            <el-form :model="form" label-width="120px" >
                <el-form-item label="模型名称">
                <el-input v-model="form.name"></el-input>
                </el-form-item>>
                <el-form-item>
                    <el-button type="primary" @click.prevent="register">
                        立即注册！
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
        </div>
  </template>
  
<script>
export default {
    name: 'NewBox',
    data() {
        return {
            form: {
                name: '',
                dialogue: '',
                url: ''
            }
        }
    },
    methods: {
        register() {
            const uuid = require('uuid');
            let data = {}
            data.name = this.form.name
            data.dialogue = [{'role':'BOT','content':'我是机器人' + data.name}]
            const uuidv4 = uuid.v4({format:'N'})
            data.id = uuidv4
            data.status = 'info'
            data.url = '/generate' + data.id
            console.log('新模型的数据',data)
            this.$emit('new-box-data', data)
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
    flex: 1
}

.chat-header h4 {
margin: 0;
font-size: 1.2rem;
}

.chat-header span {
font-size: 0.8rem;
opacity: 0.7;
}

.new-box-card {
    width: 80%;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.box-main {
    flex: 15;
    align-items: center;
}

.box-container {
    height: 100%;
    width: 100%;
}



.el-form-item {
    display: flex;
    padding: 20px;
}

.el-form-item__label {
    color: #333;
    text-align: left;
}

.button {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 5px;
  background-color: #2196F3;
  color: #fff;
  text-align: center;
  text-decoration: none;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #0D47A1;
}

</style>
