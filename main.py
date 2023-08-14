import os
import argparse
import importlib
import subprocess
import uvicorn
import json
import sys

from prettytable import PrettyTable
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tools.utils import find_free_port

from server.service.database.crud.user_crud import adjust_username_in_user
from server.service.database.crud.user_crud import insert_many_users
from server.service.utils import initial_database


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
    # print(f"server_kwargs {server_kwargs}")
    command = ["python", "server/server.py"]
    command.extend(server_kwargs)
    process = subprocess.Popen(command)
    return process

def run_suprocess_ui(host_name, main_port, port):
    base_path = "ui/dist/"
    html_file = os.path.join(base_path, "index.html")
    with open(html_file, 'rt') as f:
        html_content = f.read()

    # 动态插入的 script 行
    script_line = f'<script>window.VITE_REACT_APP_PORT = "{main_port}";window.VITE_REACT_APP_HOST="{main_host}"</script>'

    # 在 </body> 标签之前插入 script 行
    modified_content = html_content.replace('</body>', script_line + '\n</body>')

    # 创建临时 HTML 文件
    temp_html_file = os.path.join(base_path,'index.html')
    with open(temp_html_file, 'wt') as f:
        f.write(modified_content)
    
    command = ["python", "-m", "http.server", str(port), "--b", host_name, "--d", base_path]
    process = subprocess.Popen(command)
    return process

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origin_regex='http.*?://.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
main_port = find_free_port([])
main_host = "10.140.1.169"
subprocesses = []
model_list = []
db = None

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
    global args, subprocesses, main_host, model_list, main_port
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
    initial_database(database_path=database_path,db_type=database_dtype)
    insert_many_users(user_list, 100)

    # check 变量是否出现问题
    if len(model_list) == 0:
        raise ValueError(f"model_list length is `{len(model_list)}`, you should init it")
    if len(user_list) == 0:
        raise ValueError(f"user_list length is `{len(user_list)}`, you should init it")

    # 搜寻空闲的端口
    used_port = [model['port'] for model in model_list if 'port' in model]
    used_port.append(main_port)
    for model in model_list:
        if 'port' not  in model:
            model['port'] = find_free_port(used_port)
            
    
    for idx, model_info in enumerate(model_list):
        # print("**" * 10 + f"启动后端服务{idx}" +"**" * 10)
        # print(f"nickname: {model_info['nickname']}")
        # print(f"model_name_or_path: {model_info['model_name_or_path']}")
        # print(f"generate_kwargs: {model_info['generate_kwargs']}")
        # print(f"devices: {model_info['devices']}")
        # print(f"IP:Host -> {host_name} : {model_info['port']}")
        process = run_subprocess_server(model_info=model_info, database_path=database_path, database_dtype=database_dtype,
                              host_name=host_name, mode=mode, stream=is_stream)
        subprocesses.append(process)
    main_host = host_name
    
    print("*"*20 + "启动前端网页服务" + "*"*20)
    data = [
        ["URL", f"{host_name}:{port}"],
    ]
    table = PrettyTable()
    table.add_column("Field Name", [row[0] for row in data])
    table.add_column("Value", [row[1] for row in data])

    print(table)
    subprocesses.append(run_suprocess_ui(host_name=host_name, main_port=main_port, port=port))

@app.get("/get_model_list")
def get_model_list():
    global model_list, main_host
    # 移除URL中可能存在的结尾斜杠
    use_host = main_host
    if use_host.endswith('/'):
        use_host = use_host[:-1]
    if not use_host.startswith("http://") and not use_host.startswith("https://"):
        use_host = "http://" + use_host
    print(use_host, "use_host")
    # 拼接URL和端口号
    urls = [f"{use_host}:{model['port']}" for model in model_list]
    
    return {"code": 200, "data": urls}

@app.post("/login/")
async def login_by_username(username):
    print(username)
    # username = request.query_params['username']
    is_access, query = adjust_username_in_user(username)
    print(is_access, query)
    if is_access:
        return {"code": 200, "data": {"role": query.role,
                                      "username": query.username, "session_mark_num": query.session_mark_num,
                                      "single_mark_num": query.single_mark_num,"create_time": query.create_time},
                "msg": "登录成功!"}
    else:
        return {"code": 400, "data": None, "msg": "sql operation error!"}


# 关闭进程
@app.on_event("shutdown")
async def shutdown_event():
    global subprocesses
    print("*" * 20 + "关闭子进程服务" + "*" * 20)
    terminate_subprocesses(subprocesses=subprocesses)
    

if __name__ == "__main__":
    uvicorn.run(app, host=main_host, port=main_port)
    base_path = "ui/dist/"
    html_file = os.path.join(base_path, "index.html")
    with open(html_file, 'rt') as f:
        html_content = f.read()

    # 动态插入的 script 行
    script_line = f'<script>window.VITE_REACT_APP_PORT = "{main_port}";window.VITE_REACT_APP_HOST="{main_host}"</script>'

    # 在 </body> 标签之前插入 script 行
    modified_content = html_content.replace(script_line,"")

    # 创建临时 HTML 文件
    temp_html_file = os.path.join(base_path,'index.html')
    with open(temp_html_file, 'wt') as f:
        f.write(modified_content)