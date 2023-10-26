import os
import json
import argparse
import importlib
import uvicorn

from prettytable import PrettyTable
from loguru import logger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tools.utils import find_free_port, run_subprocess_server, run_suprocess_ui, check_nickname_unique

from server.service.database.crud.user_crud import adjust_username_in_user
from server.service.database.crud.user_crud import insert_or_update_user
from server.service.database.crud.vote_crud import create_vote
from server.service.utils import initial_database


parse = argparse.ArgumentParser()
parse.add_argument("--config", type=str, required=True, help="Configuration file")
args = parse.parse_args()

if not os.path.exists(args.config):
    raise ValueError(f"config: {args.config} could not find! Please check if the file : {args.config} exists")


# 初始化参数
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex='http.*?://.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
subprocesses = []
db = None
spec = importlib.util.spec_from_file_location("config", args.config)
config_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config_module)
model_list = config_module.model_list
main_host = config_module.host_name
main_port = find_free_port([])
# logger.add(sink="console")   # 配置日志输出到控制台
sys_mode = config_module.mode

# 检查模型的 nickname 不能一样
if not check_nickname_unique(model_list=model_list):
    raise ValueError(f"请保证所有模型的 nickname 都一致")

# 检查模型的个数，如果定义了 label_prompt， 那么就不能超过3个
if hasattr(config_module, "label_prompt") and len(model_list) > 2:
    raise ValueError(f"if you set `label_prompt`, model_list could not larger than 2")

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
    global args, subprocesses, config_module, sys_mode
    # 加载配置文件所有的变量
    # config_module = importlib.import_module(args.config)

    model_list = config_module.model_list
    user_list = config_module.user_list
    host_name = config_module.host_name
    port = config_module.port
    mode = config_module.mode
    is_stream = config_module.is_stream
    database_path = config_module.database_path
    database_dtype = config_module.database_dtype
    db = initial_database(database_path=database_path,db_type=database_dtype)

    # insert_many_users(user_list, 100)
    # 批量插入改为一条条插入
    logger.info("检查用户信息是否存在,不存在则插入!", user_list)
    for idx, user in enumerate(user_list):
        try:
            result = insert_or_update_user(username=user['username'], session_mark_num=user['session_mark_num'],
                                single_mark_num=user['single_mark_num'], permission=user['role'])
            if isinstance(result, int):
                logger.info(f"更新用户username: {user['username']} 成功！")
            else:
                if result:
                    logger.info(f"插入用户数据：username: {result.username} role: {result.role} session_mark_num: {result.session_mark_num} single_mark_num: {result.single_mark_num}")
                else:
                    logger.info(f"第{idx}条用户数据插入失败，请检查该数据是否有问题。数据: {user}")
        except:
            raise ValueError(f"第{idx}条用户数据插入失败，请检查该数据是否有问题。数据: {user}")

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
            used_port.append(model['port'])
            

    for idx, model_info in enumerate(model_list):
        process = run_subprocess_server(model_info=model_info, database_path=database_path, database_dtype=database_dtype,
                              host_name=host_name, mode=mode, stream=is_stream)
        subprocesses.append(process)
    
    logger.info("启动前端网页服务")
    data = [
        ["URL", f"{host_name}:{port}"],
    ]
    table = PrettyTable()
    table.add_column("Field Name", [row[0] for row in data])
    table.add_column("Value", [row[1] for row in data])

    print(table)
    subprocesses.append(run_suprocess_ui(host_name=host_name, main_port=main_port, port=port, main_host=host_name))

@app.get("/get_model_list")
def get_model_list():
    global model_list, main_host
    # 移除URL中可能存在的结尾斜杠
    use_host = main_host
    if use_host.endswith('/'):
        use_host = use_host[:-1]
    if not use_host.startswith("http://") and not use_host.startswith("https://"):
        use_host = "http://" + use_host
    # 拼接URL和端口号
    urls = [f"{use_host}:{model['port']}" for model in model_list]
    logger.info(f"获取所有后端服务的urls: {urls}")

    return {"code": 200, "data": urls}

@app.post("/login/")
async def login_by_username(username):
    """主进程控制是否能够登录
    """
    global sys_mode
    print(username)
    is_access, query = adjust_username_in_user(username)
    print(is_access, query)
    logger.info(f"登录: username: {username} is_access: {is_access} user_info: {query}")
    if sys_mode == 'evaluation':
        return {"code": 200, "data": {"role": query.role,
                                      "username": query.username, "session_mark_num": query.session_mark_num,
                                      "single_mark_num": query.single_mark_num,"create_time": query.create_time,
                                      "sys_mode": sys_mode},
                "msg": "登录成功!"}
    if is_access:
        # 在 debug 模式下， 非 debug 用户应该没法登录
        if 'debug' in sys_mode and 'debug' not in query.role:
            return {"code": 403, "data": None, "msg": "Debug模式, 标注用户无法登录"}
        # 在 arena 模式下， debug 用户无法登录
        if 'arena' in sys_mode and 'annotate' not in query.role:
            return {"code": 403, "data": None, "msg": "Arena模式, debug用户无法登录"}
            
        return {"code": 200, "data": {"role": query.role,
                                      "username": query.username, "session_mark_num": query.session_mark_num,
                                      "single_mark_num": query.single_mark_num,"create_time": query.create_time,
                                      "sys_mode": sys_mode},
                "msg": "登录成功!"}
    else:
        return {"code": 400, "data": None, "msg": "找不到该用户"}

@app.post("/vote/")
def vote_model(vote_msg: dict):
    username = vote_msg.get("username")
    vote_result = vote_msg.get("vote_result")
    vote_model = vote_msg.get("vote_model")
    dialogue_id = vote_msg.get("dialogue_id")
    turn_id = vote_msg.get("turn_id")
    vote_model_sequeue = vote_msg.get("model_sequeue")
    logger.info(f"投票：username: {username} vote_model: {vote_model} vote_result: {vote_result} dialogue_id: {dialogue_id} turn_id: {turn_id} vote_model_sequeue: {vote_model_sequeue}")
    vote_instance = create_vote(username=username, vote_model=vote_model, vote_result=vote_result, dialogue_id=dialogue_id,
                           turn_id=turn_id, vote_model_sequeue=vote_model_sequeue)
    if vote_instance:
        return {"code": 200, "response": "ok", "data": vote_instance}
    else:
        return {"code": 400, "response": "sql error!"}


@app.get("/get_label_prompt")
def get_label_prompt():
    global config_module
    try:
        # 自定义的 label, 若只有一个模型，那么模板为原本的label；若是两个模型，则是 A label B 和 B label A的对称结构
        label_prompt = {"data": config_module.label_prompt, "user_prompt": True}
    except:
        # nickname 为 label
        if config_module.mode == 'arena':
            label_prompt = [f"Model_{chr(ord('A')+item)}" for item in range(len(config_module.model_list))]
        else:
            label_prompt = [item["nickname"] for item in config_module.model_list]
        label_prompt.extend(["都不符合", "都符合"])
        label_prompt = {"data": label_prompt, "user_prompt": False}
    return {"data": label_prompt, "code": 200, "response": "ok"}


@app.get("/get_session_list")
def get_session_list():
    # evaluation 模式下获取数据集的个数
    global sys_mode, model_list
    if sys_mode == "evaluation":
        file_names = []
        for model in model_list:
            model_name_or_path = model['model_name_or_path']
            model_file_names = os.listdir(model_name_or_path)
            file_names.extend([item.replace(".json", "") for item in model_file_names])
        file_names = list(set(file_names))
        file_names = sorted(file_names)
        logger.info("获取所有数据集的名字: {}".format(file_names))
        return {
            "code": 200, "response": "ok", "data": file_names
        }
    else:
        return {
            "code": 400, "response": "error", "data": None
        }

@app.post("/get_length_by_ds_name/")
def get_length_by_ds_name(query_msg: dict):
    # Eval评测数据集下，获取指定模型的数据集的长度
    global model_list
    print(query_msg)
    ds_name = query_msg.get("ds_name")
    nickname = query_msg.get("nickname")
    logger.info(f"/get_length_by_ds_name ---> ds_name: {ds_name}, nickname: {nickname}")
    mode_info = list(filter(lambda x: x["nickname"] == nickname, model_list))[0]
    with open(os.path.join(mode_info["model_name_or_path"], ds_name+".json"), "r", encoding="utf8") as fp:
        jsondata = json.load(fp)
        ds_len = len(jsondata["outputs"])
    return {
        "code": 400, "response": "ok", "data": {"ds_len": ds_len}
    }
    
@app.post("/get_ds_chip")
def get_ds_chip(query_msg: dict):
    # 获取 eval评测数据集的若干个数据
    global model_list
    print(query_msg)
    ds_name = query_msg.get("ds_name")
    start_idx = query_msg.get("start_idx")
    end_idx = query_msg.get("end_idx")
    

# 获取自定义的关键词
# @app.get("/get_keywords")
# def get_keywords():
#     global config_module
#     try:
#         keywords = config_module.keywords
#     except:
#         keywords = []
#     return {"data": keywords, "code": 200, "response": "ok"}

# 关闭进程
@app.on_event("shutdown")
async def shutdown_event():
    global subprocesses
    logger.info("关闭子进程服务")
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