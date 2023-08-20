import psutil
import subprocess
import json
import os

def find_free_port(used_port: list):
    # 获取当前正在使用的端口号列表
    used_ports = [conn.laddr.port for conn in psutil.net_connections()]
    used_ports.extend(used_port)
    
    # 遍历端口号范围，找到未被使用的端口
    for port in range(1024, 65536):
        if port not in used_ports:
            return port

    raise RuntimeError("No free port available.")

def run_subprocess_server(model_info: dict, database_path: str, database_dtype: str, host_name: str, mode: str, stream: bool):
    """将配置参数注入，用subprocess拉起开启后端服务

    Args:
        model_info (dict): 模型的信息
        database_path (str): _description_
        database_dtype (str): _description_
        host_name (str): _description_
        mode (str): _description_
        stream (bool): _description_

    Returns:
        _type_: _description_
    """
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

def run_suprocess_ui(host_name, main_port, port, main_host):
    """将配置参数注入，用subprocess拉起前端服务

    Args:
        host_name (_type_): _description_
        main_port (_type_): _description_
        port (_type_): _description_

    Returns:
        _type_: _description_
    """
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

