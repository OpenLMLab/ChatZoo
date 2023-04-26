<template>
    <div>
        <div class="box-card">
            <div class="chat-header clearfix">
                <h4>注册你的模型！</h4>
                <span>Register Your Own Model!</span>
            </div>
            <div class="box-container">
                <el-form :model="form" label-width="120px">
                    <el-form-item label="模型名称">
                    <el-input v-model="form.name"></el-input>
                    </el-form-item>
                    <el-form-item label="初始化对话">
                    <el-input
                        type="textarea"
                        :rows="5"
                        v-model="form.dialogue"
                        placeholder="请输入初始化对话"
                    ></el-input>
                    </el-form-item>
                    <el-form-item label="后端 URL">
                    <el-input v-model="form.url"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <button class="button" @click.prevent="register">
                            立即注册！
                        </button>
                    </el-form-item>
                </el-form>
            </div>
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
            let data = {}
            data.name = this.form.name
            let diaVec = this.form.dialogue.split('}')
            diaVec.pop()
            for(let i=0; i<diaVec.length; i++) {
                diaVec[i] = diaVec[i] + '}'
            }
            console.log(diaVec)
            const objects = diaVec.map(jsonString => JSON.parse(jsonString));
            data.dialogue = objects
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
    flex: 1;
}

.chat-header h4 {
margin: 0;
font-size: 1.2rem;
}

.chat-header span {
font-size: 0.8rem;
opacity: 0.7;
}

.box-container {
    height: 100%;
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
