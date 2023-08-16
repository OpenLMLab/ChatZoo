model_list = [
    {
        "model_name_or_path": "THUDM/chatglm2-6b-32k",
        "nickname": "chatglm2-6b-32k",
        "tokenizer_path": "THUDM/chatglm2-6b-32k",
        "generate_kwargs": {
            "max_length": 2048
        },
        "devices": "3",
        "dtype": "float16",
        "base_model": None,
        "prompts": { # 若不指定，则默认找已经定义好的chatbots，若找不到则报错
             "meta_prompt": "",
             "user_prompt": "问: {}\n",
             "bot_prompt": "答: {}\n"
         }
    },
    
    #  {
    #     "model_name_or_path": "meta-llama/Llama-2-7b-chat-hf",
    #     "nickname": "Llama-2-7b-chat-hf",
    #     "tokenizer_path": "meta-llama/Llama-2-7b-chat-hf",
    #    "generate_kwargs": {
    #         "max_length": 2048, "num_beams": 1, "do_sample": True,
    #         "top_p": 0.9, "top_k": 1, "temperature": 0.95,
    #         "repetition_penalty": 1.02
    #     },
    #     "devices": "2,3",
    #     "dtype": "float16",
    #     "base_model": None,
    #     "prompts": { # 若不指定，则默认找已经定义好的chatbots，若找不到则报错
    #          "meta_prompt": "",
    #          "user_prompt": "[IJNST]{}[/INST]",
    #          "bot_prompt": "{}\n"
    #      }
    # },
    
    {
        "model_name_or_path": "fnlp/moss-moon-003-sft",
        "nickname": "moss_01",
        "tokenizer_path": "fnlp/moss-moon-003-sft",
        "generate_kwargs": {"max_length": 2048},
        "devices": "0,1",
        "dtype": "float16",
        "base_model": None,
        "port": 8082, # 若不指定则采用默认的配置参数
        # "prompts": { # 若不指定，则默认找已经定义好的chatbots，若找不到则报错
        #      "meta_prompt": "",
        #      "user_prompt": "Human: {}\n",
        #      "bot_prompt": "Assistant: {}\n"
        #  }
    },
    {
        "model_name_or_path": "THUDM/chatglm-6b",
        "nickname": "chatglm2",
        "tokenizer_path": "THUDM/chatglm-6b",
        "generate_kwargs": {
            "max_length": 2048, "num_beams": 1, "do_sample": True,
            "top_p": 0.9, "top_k": 1, "temperature": 0.95,
            "repetition_penalty": 1.02
        },
        "devices": "2", 
        "dtype": "float16",
        "base_model": None,
        "port": 8083, # 若不指定则采用默认的配置参数
    },
    # {
    #     "model_name_or_path": "gpt2",
    #     "nickname": "gpt2",
    #     "tokenizer_path": "gpt2",
    #     "generate_kwargs": {
    #         "max_length": 250, "num_beams": 1, "do_sample": True,
    #         "top_p": 0.9, "top_k": 1, "temperature": 0.95,
    #         "repetition_penalty": 1.02
    #     },
    #     "devices": "3",
    #     "dtype": "float16",
    #     "base_model": None,
    #     "prompts": { # 若不指定，则默认找已经定义好的chatbots，若找不到则报错
    #          "meta_prompt": "",
    #          "user_prompt": "{}",
    #          "bot_prompt": "{}"
    #      },
        
    #     # "port": 8083, # 若不指定则采用默认的配置参数
    # },
]
user_list = [
    {"username": "hjw", "role": "annotate", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "gtl", "role": "annotate", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "hjw_debug", "role": "debug", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "gtl_debug", "role": "debug", "session_mark_num": 100, "single_mark_num": 100}
]
host_name = "10.140.1.169" # 默认为 localhost
port = 8080 # 前端使用的端口
mode = "debug"# 启动的模式
is_stream = True # 是否开启流式输出

database_dtype = "sqlite" 
database_path = "./data.db"
