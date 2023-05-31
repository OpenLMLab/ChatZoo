"""
Launch a server for a single model.
"""
import os
import argparse

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ModelConfig
from generator import choose_bot

parser = argparse.ArgumentParser()
parser.add_argument("--port", default=8081, type=int)
parser.add_argument("--host", default="localhost", type=str)
parser.add_argument("--devices", default="0", type=str)
# model config
parser.add_argument(
    "--pretrained_path", type=str, help="Path of pretrained model."
)
parser.add_argument(
    "--type", type=str, default=None,
    help="Type of model to initialized. If None, we will initialize a "
         "model according to `pretrained_path`."
)
parser.add_argument(
    "--tokenizer_path", type=str, default=None,
    help="Path to load a tokenizer. If None, we will set it to "
         "`pretrained_path`."
)
parser.add_argument(
    "--dtype", type=str, default="float32",
    help="Dtype to load model."
)
parser.add_argument(
    "--base_model", type=str,
    help="Path to load base model for lora model."
)
parser.add_argument(
    "--from_s3", default=False, action="store_true",
    help="Whether to load model from s3. Only for testing purpose."
)
parser.add_argument("--openai_api_key", default=None, type=str,
    help="Api keys for using openai GPT")
parser.add_argument("--openai_api_key_file_path", default=None, type=str,
    help="txt file for saving some openai aip keys")
    
args = parser.parse_args()
os.environ["CUDA_VISIBLE_DEVICES"] = args.devices
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot = None

@app.on_event('startup')
def init_bot():
    print(f"Initializing model...")
    print("Using devices:", args.devices)
    print("Config:", config)
    global bot
    bot = choose_bot(config)

config = ModelConfig(
    pretrained_path=args.pretrained_path, type=args.type,
    tokenizer_path=args.tokenizer_path, dtype=args.dtype,
    from_s3=args.from_s3, base_model=args.base_model,
    api_key=args.openai_api_key, api_key_file_path=args.openai_api_key_file_path
)

@app.post("/")
async def generate(post: dict):
    response = bot.chat(post)
    if response is not None:
        status = 0
    else:
        status = 1
    return {"status": status, "response": response}

@app.post("/parameters")
async def default_settings():
    return bot.default_settings()

if __name__ == "__main__":
    uvicorn.run(app="server:app", host=args.host, port=args.port, reload=True)
