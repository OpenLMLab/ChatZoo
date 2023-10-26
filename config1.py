model_list = [
    {
        "model_name_or_path": "decapoda-research/llama-7b-hf",
        "nickname": "llama",
        "tokenizer_path": "huggyllama/llama-7b",
        "generate_kwargs": {
            "max_length": 2048, "num_beams": 1, "do_sample": True,
            "top_p": 0.9, "top_k": 1.0, "temperature": 0.95,
            "repetition_penalty": 1.02,"num_return_sequences": 1
        },
        "devices": "1",
        "dtype": "float16",
        "base_model": None,
        "prompts": { # 若不指定，则默认找已经定义好的chatbots，若找不到则报错
             "meta_prompt": "",
             "user_prompt": "{}",
             "bot_prompt": "{}"
         }
    },
    {
        "model_name_or_path": "baichuan-inc/Baichuan2-7B-Base",
        "nickname": "baichuan2",
        "tokenizer_path": "baichuan-inc/Baichuan2-7B-Base",
        "generate_kwargs": {
            "max_length": 2048, "num_beams": 1, "do_sample": True,
            "top_p": 0.9, "top_k": 1.0, "temperature": 0.95,
            "repetition_penalty": 1.02,"num_return_sequences": 1
        },
        "devices": "2",
        "dtype": "float16",
        "base_model": None,
        "prompts": { # 若不指定，则默认找已经定义好的chatbots，若找不到则报错
             "meta_prompt": "",
             "user_prompt": "{}",
             "bot_prompt": "{}"
         }
    },
    {
        "model_name_or_path": "internlm/internlm-7b",
        "nickname": "internlm",
        "tokenizer_path": "internlm/internlm-7b",
        "generate_kwargs": {
            "max_length": 2048, "num_beams": 1, "do_sample": True,
            "top_p": 0.9, "top_k": 1, "temperature": 0.95,
            "repetition_penalty": 1.02,"num_return_sequences": 1
        },
        "devices": "3",
        "dtype": "float16",
        "base_model": None,
        "prompts": { # 若不指定，则默认找已经定义好的chatbots，若找不到则报错
             "meta_prompt": "",
             "user_prompt": "{}",
             "bot_prompt": "{}"
         }
    }
]
user_list = [
    {"username": "test", "role": "annotate", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "test1", "role": "annotate", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "test_debug", "role": "debug", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "test1_debug", "role": "debug", "session_mark_num": 100, "single_mark_num": 100}
]

host_name = "10.140.66.63" # 默认为 localhost
port = 8080 # 前端使用的端口
mode = "debug"# 启动的模式
is_stream = True # 是否开启流式输出

database_dtype = "sqlite" 
database_path = "./data.db"
