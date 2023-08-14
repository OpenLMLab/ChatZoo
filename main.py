import os
import argparse
import importlib
import subprocess
import uvicorn
import json

from fastapi import FastAPI

from tools.utils import find_free_port

parse = argparse.ArgumentParser()
parse.add_argument("--config", type=str, required=True, help="Configuration file")
args = parse.parse_args()

if not os.path.exists(args.config):
    raise ValueError(f"config: {args.config} could not find! Please check if the file : {args.config} exists")


def run_subprocess_server(model_info: dict, database_path: str, database_dtype: str, host_name: str, mode: str, stream: bool):
    server_kwargs = ["--port", str(model_info['port']), "--host", host_name, "--devices",  model_info['devices'],  "--nickname", model_info['nickname'], 
                     "--model_name_or_path", model_info['model_name_or_path'],  "--dtype", model_info['dtype'], "--tokenizer_path", model_info['tokenizer_path'], 
                     "--model_config", json.dumps(model_info['generate_kwargs']), "--db_type", database_dtype, 
                     "--db_path", database_path, "--mode", mode]
    if model_info['base_model']:
        server_kwargs.append("--base_model")
        server_kwargs.append(model_info['base_model'])
    if "prompts" in model_info:
        server_kwargs.append("--prompts")
        server_kwargs.append(json.dumps(model_info['prompts']))
    if stream:
        server_kwargs.append("--stream")
        # server_kwargs += f" --prompts {model_info['prompts']}"
    print(f"server_kwargs {server_kwargs}")
    command = ["python", "server/server.py"]
    command.extend(server_kwargs)
    process = subprocess.Popen(command)
    return process

def run_suprocess_ui(host_name, port):
    base_path = "ui"
    command = ["npm", "start"]
    # 设置环境变量，指定端口号和主机
    env = {
        "PORT": host_name,  # 设置端口号
        "HOST": str(port)  # 设置主机
    }
    process = subprocess.Popen(command, cwd=base_path, env=env)
    return process

app = FastAPI()
main_port = find_free_port()
main_host = None
subprocesses = []

# 在程序退出前终止所有子进程
def terminate_subprocesses(subprocesses):
    for process in subprocesses:
        process.terminate()
    # 等待子进程终止
    for process in subprocesses:
        process.wait()

# 注册退出时的回调函数
def exit_handler(signum, frame):
    terminate_subprocesses()
    exit(0)

# 启动进程
@app.on_event("startup")
async def startup_event():
    print("*" * 20 + "启动子进程服务" + "*" * 20)
    global args, subprocesses, main_host
    # 加载配置文件所有的变量
    # config_module = importlib.import_module(args.config)
    spec = importlib.util.spec_from_file_location("config", args.config)
    config_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(config_module)

    model_list = config_module.model_list
    user_list = config_module.user_list
    host_name = config_module.host_name
    port = config_module.port
    mode = config_module.mode
    is_stream = config_module.is_stream
    database_path = config_module.database_path
    database_dtype = config_module.database_dtype

    # check 变量是否出现问题
    if len(model_list) == 0:
        raise ValueError(f"model_list length is `{len(model_list)}`, you should init it")
    if len(user_list) == 0:
        raise ValueError(f"user_list length is `{len(user_list)}`, you should init it")

    # 搜寻空闲的端口
    for model in model_list:
        if 'port' not in model:
            model['port'] = find_free_port()
    
    for idx, model_info in enumerate(model_list):
        print("**" * 10 + f"启动后端服务{idx}" +"**" * 10)
        print(f"nickname: {model_info['nickname']}")
        print(f"model_name_or_path: {model_info['model_name_or_path']}")
        print(f"generate_kwargs: {model_info['generate_kwargs']}")
        print(f"devices: {model_info['devices']}")
        print(f"IP:Host -> {host_name} : {model_info['port']}")
        process = run_subprocess_server(model_info=model_info, database_path=database_path, database_dtype=database_dtype,
                              host_name=host_name, mode=mode, stream=is_stream)
        subprocesses.append(process)
    main_host = host_name
    subprocesses.append(run_suprocess_ui(host_name=host_name, port=port))

# 关闭进程
@app.on_event("shutdown")
async def shutdown_event():
    global subprocesses
    print("*" * 20 + "关闭子进程服务" + "*" * 20)
    terminate_subprocesses(subprocesses=subprocesses)

if __name__ == "__main__":
    uvicorn.run(app, host=main_host, port=main_port)