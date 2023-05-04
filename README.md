# ChatZoo
对话语言模型横向对比工具。

我们提供了一个轻量级的工具，可以将您的模型或者来自 [🤗huggingface]([Models - Hugging Face](https://huggingface.co/models)) 的模型轻松部署到网页中。ChatZoo 还可以将一句提示同时发送到多个模型中进行回答生成，方便地对比模型效果。

## 如何使用

### 1. 启动前端

我们的前端代码 [./ui]([ChatZoo/ui at main · OpenLMLab/ChatZoo (github.com)](https://github.com/OpenLMLab/ChatZoo/tree/main/ui)) 使用 <a href="https://vuejs.org"><img width="25" src="https://vuejs.org/images/logo.png" alt="Vue logo">vue</a> 实现，您可以使用 npm 工具编译，或者使用我们预编译好的 [release]([Releases · OpenLMLab/ChatZoo (github.com)](https://github.com/OpenLMLab/ChatZoo/releases))。当您当您经过下载或编译得到 dist 文件夹后，请在 dist 文件夹中执行：

```bash
python -m http.server 8080
```

即可启动前端，之后可通过 ``http://localhost:8080`` 访问前端页面（命令中的端口号可根据您的方便替换）。

### 2. 启动后端

我们的后端代码启动点位于 [server.py]([ChatZoo/server.py at main · OpenLMLab/ChatZoo (github.com)](https://github.com/OpenLMLab/ChatZoo/blob/main/server.py)) ，您可以通过指定参数 ``--pretrained_path`` 为  [🤗huggingface]([Models - Hugging Face](https://huggingface.co/models)) 中模型的名字来启动模型，例如，倘若您想要启动 ``fnlp/moss-moon-003-sft`` 那么可以执行如下命令：

```bash
python server.py --pretrained_path fnlp/moss-moon-003-sft 
				 --host 127.0.0.1 
				 --port 8081
```

我们目前支持的模型可以参见 [目前支持的模型](##目前支持的模型)，想要添加自己的模型可以参照 [添加自己的模型](###添加自己的模型)。

### 3. 使用

在您完成以上两步操作后，您可以正式开始使用 ChatZoo。首先在浏览器地址栏中输入执行 [第一步](###1.%20启动前端) 的主机 ip 地址和端口号（本例中为 ``http://localhost:8080``）可打开前端页面：

![](./pics/readme1.png)

此时页面中并未加载任何模型，那么可以点击右下角的加号图标，输入模型名称（方便您自己区分）和 [第二步](###2.%20启动后端) 得到的 ip 地址和端口号，并点击立即注册：

![](./pics/readme2.png)

此时模型便会以聊天窗口的形式出现在屏幕中央。此时不断重复前一步操作可以添加多个模型，并可通过屏幕正下方的文本输入区域将同一句提示同时发送给多个模型：

![](./pics/readme3.png)

## 目前支持的模型

- [MOSS](https://github.com/OpenLMLab/MOSS)
    - [moss-moon-003-sft](https://huggingface.co/fnlp/moss-moon-003-sft)
    - [moss-moon-003-sft-plugin](https://huggingface.co/fnlp/moss-moon-003-sft-plugin)
    - [moss-moon-003-sft-int8](https://huggingface.co/fnlp/moss-moon-003-sft-int8)
    - [moss-moon-003-sft-plugin-int8](https://huggingface.co/fnlp/moss-moon-003-sft-plugin-int8)
    - [moss-moon-003-sft-int4](https://huggingface.co/fnlp/moss-moon-003-sft-int4)
    - [moss-moon-003-sft-plugin-int4](https://huggingface.co/fnlp/moss-moon-003-sft-plugin-int4)
- [ChatGLM](https://github.com/THUDM/ChatGLM-6B)
    - [chatglm-6b](https://huggingface.co/THUDM/chatglm-6b)
- [Firefly](https://github.com/yangjianxin1/Firefly)
    - [firefly-1b4](https://huggingface.co/YeungNLP/firefly-1b4)
    - [firefly-2b6](https://huggingface.co/YeungNLP/firefly-2b6)
- [GODEL](https://github.com/microsoft/GODEL)
    - [GODEL-v1_1-base-seq2seq](https://huggingface.co/microsoft/GODEL-v1_1-base-seq2seq)
    - [GODEL-v1_1-large-seq2seq](https://huggingface.co/microsoft/GODEL-v1_1-large-seq2seq)

### 添加自己的模型

TODO
