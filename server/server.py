import os
import argparse
import json
import time

from prettytable import PrettyTable
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from service.apis.login import login_router
from service.apis.chat import chat_router
from service.apis.vote import vote_router
from service.database.crud.generate_config_crud import create_generate_config
from service.utils import AppConfig, ModelConfig, parse_json, pack_model_info, initial_database
from service.chatbots import choose_bot
from service.chatbots.base import TransformersChatBotBase

parser = argparse.ArgumentParser()
parser.add_argument("--port", default=8081, type=int)
parser.add_argument("--host", default="localhost", type=str)
parser.add_argument("--devices", default="0", type=str)
parser.add_argument("--nickname", type=str, required=True)
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
parser.add_argument(
    "--prompts", default=None, type=parse_json
)
parser.add_argument("--stream", default=False, action="store_true")
args = parser.parse_args()
os.environ["CUDA_VISIBLE_DEVICES"] = args.devices


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origin_regex='http.*?://.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event('startup')
def init_params():
    global args
    
    db = initial_database(args.db_path, args.db_type)
    gen_config = args.model_config
    if args.model_config is None and args.model_config_path is not None:
        with open(args.model_config_path, "w", encoding="uf8") as fp:
            gen_config = json.load(fp)
            
    model_config = ModelConfig(
        pretrained_path=args.model_name_or_path,
        prompts=args.prompts,
        tokenizer_path=args.tokenizer_path, dtype=args.dtype,
        from_s3=args.from_s3, base_model=args.base_model,
    )
    if model_config.type is not None:
        bot = choose_bot(config=model_config)
    else:
        bot = TransformersChatBotBase(config=model_config)
        bot.set_input_prompt(args.prompts)
        bot.set_generation_setting(args.model_config)
    
        
    gen_config = bot.get_generation_setting() if gen_config is None else gen_config
    if gen_config is None:
        raise ValueError("generate_kwargs couldnot be None, you should initial generate_kwargs!")
    
    # 如果为 arena 模式， 则将配置文件的模型配置参数写入数据库中
    generate_config_id = str(int(time.time()))
    if args.mode == "arena":
        generate_config_instance = create_generate_config(nickname=args.nickname, generate_kwargs=gen_config, model_name_or_path=args.model_name_or_path,
                            prompts=args.prompts)
        generate_config_id = generate_config_instance.generate_config_id
        
    model_info = pack_model_info(generate_config_id, gen_config, args.nickname, args.model_name_or_path, args.prompts, args.stream,
                                 url=args.host+":"+str(args.port), device=args.devices, tokenizer_path=model_config.tokenizer_path)

        
    config = AppConfig(db, bot=bot, model_info=model_info, mode=args.mode)
    
    logger.info(f"启动{args.nickname}后端服务")
    table = PrettyTable()
    data = [
        ["URL", f"{args.host}:{args.port}"],
        ["devices", args.devices],
        ["nickname", args.nickname],
        ["model_name_or_path", args.model_name_or_path],
        ["tokenizer_path", args.tokenizer_path],
        ["stream", args.stream],
        ["mode", args.mode],
        ["db_path", args.db_path],
        ["db_type", args.db_type]
    ]
    table.add_column("变量名", [row[0] for row in data])
    table.add_column("值", [row[1] for row in data])

    print(table)
    # print(f"Initializing model...")
    # print("Using devices:", args.devices)
    # print("Config:", model_config)
    # print(f"URL: {args.host}:{args.port}")

app.include_router(login_router, prefix="/login")
app.include_router(chat_router, prefix="/chat")
app.include_router(vote_router, prefix="/vote")

if __name__ == "__main__":
    uvicorn.run(app="server:app", host=args.host, port=args.port, reload=True)