from server.service.utils import initial_database
from server.service.database.crud.vote_crud import read_all_votes 
import argparse
import importlib

parser = argparse.ArgumentParser()
parse = argparse.ArgumentParser()
parse.add_argument("--config", type=str, required=True, help="Configuration file")
args = parse.parse_args()
# 导入配置文件
spec = importlib.util.spec_from_file_location("config", args.config)
config_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config_module)

# 初始化数据库
db = initial_database(database_path=config_module.database_path,db_type=config_module.database_dtype)
all_vote_list = read_all_votes()
for vote_info in all_vote_list:
    print(vote_info)
