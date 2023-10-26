model_list = [
    {
        "model_name_or_path": "/mnt/petrelfs/share_data/chenkeyu1/outputs/2023_10_24/20231024_111546/results/Laplace_1B_v1_0_0_4000",
        "nickname": "Laplace_1B_v1_0_0_4000",
    },
    {
        "model_name_or_path": "/mnt/petrelfs/share_data/chenkeyu1/outputs/2023_10_24/20231024_111546/results/Laplace_1B_v1_0_0_8000",
        "nickname": "Laplace_1B_v1_0_0_8000",
    },
    # {
    #     "model_name_or_path": "/mnt/petrelfs/share_data/chenkeyu1/outputs/2023_10_24/20231024_111546/results/",
    #     "nickname": "7B_llama2_coder_sft_v5_300",
    # }
]
user_list = [
    {"username": "test", "role": "annotate", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "test1", "role": "annotate", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "test_debug", "role": "debug", "session_mark_num": 100, "single_mark_num": 100},
    {"username": "test1_debug", "role": "debug", "session_mark_num": 100, "single_mark_num": 100}
]

host_name = "10.140.66.104" # 默认为 localhost
port = 8080 # 前端使用的端口
mode = "evaluation"# 启动的模式
is_stream = True # 是否开启流式输出

database_dtype = "sqlite" 
database_path = "./data.db"
