import asyncio

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ModelConfig
from generator import choose_bot

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate/{idx}")
async def generate(idx: int, dialogue: list):
    response = bots[idx].chat(dialogue)
    if response is not None:
        status = 0
    else:
        status = 1
    return {"status": status, "response": response}

async def init_single(model_info, status_dict):
    idx = int(model_info["id"])
    model_name = model_info["name"]
    print(f"Initializing id: {idx}, model: {model_name}...")
    exists_model_names = [bot.model_name for bot in bots.values()]
    try:
        if model_name not in exists_model_names:
            config = ModelConfig(
                # TODO
                pretrained_path=model_name
            )
            bot = choose_bot(config)
        else:
            print(f"{model_name} is already exits.")
    except Exception as e:
        print(e.message)
        # 1: error happens
        status_dict[idx] = 1
    else:
        status_dict[idx] = 0
    print(f"{model_name} Initialized. status: {status_dict[idx]}")
    bots[idx] = bot

@app.post("/init/")
def initialize(model_infos: list):
    """
    Initialize models.

    :param model_infos: list of dict.
        [
            {"id": 1, "name":"fnlp/moss-sft-003-base"},
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
    uvicorn.run(app, port=10030)