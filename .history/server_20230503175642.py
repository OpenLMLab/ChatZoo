"""
Launch a server for a single model.
"""
import argparse
import asyncio
import traceback

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ModelConfig
from generator import choose_bot

parser = argparse.ArgumentParser()
parser.add_argument("--mid_port", default=10020, type=int)
parser.add_argument("--host", default="localhost", type=str)
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
    "--dtype", type=str, default="float16",
    help="Dtype to load model."
)
args = parser.parse_args()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = ModelConfig(
    pretrained_path=args.pretrained_path, type=args.type,
    tokenizer_path=args.tokenizer_path, dtype=args.dtype,
)

@app.post("/")
async def generate(dialogue: list):
    response = bot.chat(dialogue)
    if response is not None:
        status = 0
    else:
        status = 1
    return {"status": status, "response": response}

# if __name__ == "__main__":
print(f"Initializing model...")
print("Config:", config)
bot = choose_bot(config)
uvicorn.run(app="server:app", host=args.host, port=bot.port, reload=True)