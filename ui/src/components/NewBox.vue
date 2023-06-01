<template>
    <div class="new-box-card">
        <div class="chat-header clearfix" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <h4>新建模型</h4>
        </div>
        <div class="box-main">
            <el-form :model="form">
                <el-form-item label="模型名称">
                    <el-input v-model="form.name"></el-input>
                </el-form-item>
                <el-form-item label="模型URL">
                    <el-input v-model="form.url"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-radio v-model="form.isiframe" label="iframe">外部网页接入</el-radio>
                    <el-radio v-model="form.isiframe" label="box">本地模型</el-radio>
                </el-form-item>
                <el-form-item>
                    <el-button :loading="loading" type="primary" @click.prevent="register">
                        立即注册！
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
        </div>
  </template>
  
<script>
import axios from 'axios';
export default {
    name: 'NewBox',
    data() {
        return {
            loading: false,
            form: {
                name: '',
                dialogue: '',
                url: '',
                isiframe: 'box'
            }
        }
    },
    methods: {
        async getParams(url) {
            if(url.indexOf("http://")==-1 && url.indexOf("https://")==-1){
                url = "http://" + url
            }
            const instance = axios.create({baseURL:''})
            try {
                const response = await instance.post(url+'/parameters')
                console.log('获取参数', response.data)
                return response.data
            } catch (error) {
                console.error(error)
            }
        },
        async register() {
            if(this.form.name) {
                const uuid = require('uuid');
                let data = {}
                data.name = this.form.name
                data.dialogue = []
                const uuidv4 = uuid.v4({format:'N'})
                data.id = uuidv4
                data.isiframe = this.form.isiframe
                if(data.isiframe === 'iframe') {
                    data.isiframe = true
                } else {
                    data.isiframe = false
                }
                data.url = this.form.url
                const parameters = await this.getParams(this.form.url)
                data.parameters = parameters
                console.log('新的模型', data)
                this.$emit('new-box-data', data)
            } else {
                this.$message.error('模型名称不能为空！')
            }
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

.el-input {
    width: 100%;
    padding: 0%;
}

.chat-input input {
    padding-left: 0px;
}

.el-form-item {
    padding: 10%;
}

.el-input__inner {
    padding: 0%;
    width: 100%;
}

.new-box-card {
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.box-main {
    flex: 15;
    justify-content: center;
    align-items: center;
}

.box-container {
    height: 100%;
    width: 100%;
}


</style>
