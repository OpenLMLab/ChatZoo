import os
import argparse
import json

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from peewee import SqliteDatabase

from service.apis.login import login_router
from service.apis.chat import chat_router
# from service.database.models import User, DebugMessage, Dialogue_Mess, Generate_Config, Vote 
from service.utils import AppConfig, ModelConfig, parse_json, pack_model_info, initial_database
from service.chatbots import choose_bot

parser = argparse.ArgumentParser()
parser.add_argument("--port", default=8081, type=int)
parser.add_argument("--host", default="localhost", type=str)
parser.add_argument("--devices", default="0", type=str)
parser.add_argument("--nickname", type=str)
parser.add_argument("--model_name_or_path", type=str, help="Path of pretrained model.")
parser.add_argument(
    "--from_s3", default=False, action="store_true",
    help="Whether to load model from s3. Only for testing purpose."
)
parser.add_argument(
    "--base_model", type=str,
    help="Path to load base model for lora model."
)
parser.add_argument(
    "--type", type=str, default=None,
    help="Type of model to initialized. If None, we will initialize a "
         "model according to `pretrained_path`."
)
parser.add_argument(
    "--dtype", type=str, default="float32",
    help="Dtype to load model."
)
parser.add_argument(
    "--tokenizer_path", type=str, default=None,
    help="Path to load a tokenizer. If None, we will set it to "
         "`pretrained_path`."
)

parser.add_argument(
    "--model_config",  type=parse_json, default=None,
)
parser.add_argument(
    "--model_config_path", type=str, default=None,
    help="could not exist model_config and model_config_path"
)
parser.add_argument(
    "--db_type", default="sqlite", type=str
)
parser.add_argument(
    "--db_path", default="./data.db", type=str
)
parser.add_argument(
    "--mode", default="arena", type=str
)
args = parser.parse_args()
os.environ["CUDA_VISIBLE_DEVICES"] = args.devices

db = initial_database(args.db_path, args.db_type)

model_config = ModelConfig(
    pretrained_path=args.model_name_or_path, type=args.type,
    tokenizer_path=args.tokenizer_path, dtype=args.dtype,
    from_s3=args.from_s3, base_model=args.base_model,
)
print(f"Initializing model...")
print("Using devices:", args.devices)
print("Config:", model_config)
bot = choose_bot(config=model_config)
gen_config = args.model_config
if args.model_config is None and args.model_config_path is not None:
    with open(args.model_config_path, "w", encoding="uf8") as fp:
        gen_config = json.load(fp)
    
gen_config = bot.get_generation_setting() if gen_config is None else gen_config
print(gen_config)
model_info = pack_model_info(gen_config, args.nickname, args.model_name_or_path)

config = AppConfig(db, bot=None, model_info=model_info, mode=args.mode)


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(login_router, prefix="/login")
app.include_router(chat_router, prefix="/chat")

if __name__ == "__main__":
    uvicorn.run(app="server:app", host=args.host, port=args.port, reload=True)