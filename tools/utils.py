import psutil
import subprocess

def find_free_port(used_port: list):
    # 获取当前正在使用的端口号列表
    used_ports = [conn.laddr.port for conn in psutil.net_connections()] + used_port
    
    # 遍历端口号范围，找到未被使用的端口
    for port in range(1024, 65536):
        if port not in used_ports:
            return port

    raise RuntimeError("No free port available.")

def run_command(command, filename, argument):
    all_command = [command, filename, argument]
    
    # 在指定文件夹中执行
    process = subprocess.Popen()