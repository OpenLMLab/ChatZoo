"""
Launch a server for a single model.
"""
import os
import argparse

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

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
    allow_origins=["*", "localhost:8081", "10.140.0.133:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot = None
stream_response = None

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
    global stream_response
    response = bot.chat(post)
    if response is not None:
        status = 0
    else:
        status = 1
    stream_response = response
    return {"status": status, "response": "正在努力搜索中，请稍等一下哦~"}
    # print("response", response)
    # return StreamingResponse(response, media_type='text/plain')

@app.post("/parameters")
async def default_settings():
    return bot.default_settings()

@app.post("/get_prompt")
async def default_prompt():
    return bot.prompt if bot.prompt is not None else "Null"


@app.get("/stream")
async def message_stream():
    global stream_response
    async def response_generator(stream_response):
        # print("stream_response", stream_response)
        if stream_response is not None:
            for response in stream_response:
                    # If client closes connection, stop sending events
                yield response
            stream_response = None
    return EventSourceResponse(response_generator(stream_response))

if __name__ == "__main__":
    uvicorn.run(app="server:app", host=args.host, port=args.port, reload=True)
