import argparse
import json

from service.database.crud.user_crud import insert_many_users
from service.utils import initial_database

parser = argparse.ArgumentParser()
parser.add_argument("--config_path", type=str, default=None)
parser.add_argument("--db_path", type=str, default="./data.db")
parser.add_argument("--db_type", type=str, default="sqlite")
args = parser.parse_args()

if args.config_path is None:
    raise ValueError("You should use --config_path path to init config_path!")
with open(args.config_path, "r", encoding="utf8") as fp:
    user_jsons = json.load(fp)
db = initial_database(args.db_path, args.db_type)
response = insert_many_users(user_jsons, 100)
if response:
    print("insert success")
else:
    print("insert fail")    
