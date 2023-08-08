from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from service.utils import AppConfig


chat_router = APIRouter()

@chat_router.get("/")
async def chat(request: Request):
    print(request.query_params)
    print(request.headers)
    config = AppConfig()
    if "token" in request.headers:
        token = request.headers["token"]
    
    # data = request.headers["data"]
    import time
    async def generator():
        
        for i in range(100):
            yield {
                "event": 1,
                "data": {
                    "context": "hello",
                    "id": i,
                    "request": "请求",
                    "response": "回复"
                }
            }
            time.sleep(0.5)
    return EventSourceResponse(generator())


@chat_router.get("/get_paramters")
def get_model_parameters():
    config = AppConfig()
    return config.model_info.gen_config()

@chat_router.post("/set_parameters")
def set_model_parameters(request: Request):
    params = request.query_params
    
    return {"status": 200, "response": "ok"}