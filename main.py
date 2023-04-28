import argparse
import asyncio
import traceback

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ModelConfig
from generator import choose_bot

parser = argparse.ArgumentParser()
parser.add_argument("--host", default="127.0.0.1", type=str)
parser.add_argument("--port", default=10030, type=int)
parser.add_argument("--mid_port", default=10020, type=int)
args = parser.parse_args()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://localhost:{args.mid_port}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate/{idx}")
async def generate(idx: str, dialogue: list):
    response = bots[idx].chat(dialogue)
    if response is not None:
        status = 0
    else:
        status = 1
    return {"status": status, "response": response}

async def init_single(model_info, status_dict):
    idx = model_info["id"]
    model_name = model_info["name"]
    print(f"Initializing id: {idx}, model: {model_name}...")
    try:
        if model_name not in bot_names.keys():
            config = ModelConfig(
                # TODO
                pretrained_path=model_name
            )
            bot = choose_bot(config)
            bot_names[model_name] = bot
        else:
            print(f"{model_name} is already exists.")
            bot = bot_names[model_name]
    except Exception as e:
        traceback.print_exc()
        # 1: error happens
        status = 1
        bot = None
        bot_names[model_name] = None
    else:
        status = int(bot is None)
    status_dict[idx] = status
    print(f"{model_name} Initialized. status: {status_dict[idx]}")
    bots[idx] = bot

@app.post("/init/")
def initialize(model_infos: list):
    """
    Initialize models.

    :param model_infos: list of dict.
        [
            {"id": 1, "name":"fnlp/moss-moon-003-base"},
            {"id": 2, "name":"THUDM/chatglm-6b"},
            {"id": 3, "name":"YeungNLP/firefly-1b4"},
        ]
    """
    # init models
    print(f"Initializing models:\n{model_infos}")

    status_dict = {}
    tasks = [init_single(info, status_dict) for info in model_infos]
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(asyncio.wait(tasks))
    loop.close()
    print(bots)
    print(status_dict)

    return status_dict


if __name__ == "__main__":
    bots = {}
    bot_names = {}
    uvicorn.run(app, host=args.host, port=args.port)