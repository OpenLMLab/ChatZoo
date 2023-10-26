from collections import OrderedDict
import json
from urllib.parse import unquote
from playhouse.shortcuts import model_to_dict

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from loguru import logger

from service.utils import AppConfig
from service.database.crud.generate_config_crud import create_generate_config
from service.database.crud.debug_table_crud import create_debugmessage, query_debugmessage_by_turnid_genconfig, update_user_query_in_debug_message
from service.database.crud.dialogue_mess_crud import create_dialogue_mess, query_dialogue_by_turnid_username, update_user_query_in_dialogue


chat_router = APIRouter()

@chat_router.get("/generate")
async def chat(request: Request):
    config = AppConfig()
    # 鉴权信息
    # if "Authorization" in request.headers:
    #     debug_generate_config = json.loads(request.headers["Authorization"])
    # 输入的对话
    prompt = unquote(request.headers['prompt'])
    print("prompt", prompt)
    
    sys_mode = config.mode
    # 单独处理特殊的evaluation模式
    if sys_mode == "evaluation":
        ds_name = request.query_params['ds_name']
        query_idx = request.query_params["query_idx"]
        query = {"query_idx": query_idx, "ds_name": ds_name, "is_stream": config.model_info["stream"]}
        async def generator(querys, bot):
 
            gen_response = bot.chat(querys)
            idx = 0
            response = None
            status = False
            for response, status in gen_response:
                idx += 1
                yield {
                    "id": idx,
                    "event": "message",
                    "retry": 20000,
                    "data": json.dumps({
                        "code": 1,
                        "data": {
                            "context": response,
                            "id": dialogue_instance.dialogue_id,
                            "request": prompt,
                            "response": response
                        }
                    })
                }
                if await request.is_disconnected():
                    break
            if status:
                yield {
                    "id": idx,
                    "event": "message",
                    "retry": 20000,
                    "data": json.dumps({
                        "code": -20003,
                        "data": {
                            "context": "",
                            "id": dialogue_instance.dialogue_id,
                            "request": prompt,
                            "response": response
                        }
                    })
                }
            else:
                yield {
                        "id": idx,
                        "event": "message",
                        "retry": 20000,
                        "data": json.dumps({
                            "code": 0,
                            "data": {
                                "context": "",
                                "id": dialogue_instance.dialogue_id,
                                "request": prompt,
                                "response": response
                            }
                        })
                }
    
        return EventSourceResponse(generator(query, config.bot))
    
    # 会话id 和 user 信息
    turn_id = request.query_params['turn_id']
    username = request.query_params['username']  
    role = request.query_params['role']
    
    if 'debug' in role:
        # debug 成员，此时headers 的 Authorization 为 generate_kwargs
        # 鉴权信息
        # print(request.headers["Authorization"])
        model_info = json.loads(unquote(request.headers["Authorization"]))
        debug_generate_config = model_info['generate_config']
        # debug_generate_config = json.loads(request.headers["Authorization"])
        history_dialogue, is_query = query_debugmessage_by_turnid_genconfig(turn_id=turn_id, nickname=config.model_info["nickname"])
        dialogue_instance = create_debugmessage(username=username, nickname=config.model_info['nickname'], bot_reponse=None,
                                                turn_id=turn_id, user_query=prompt, generate_kwargs=debug_generate_config,
                                                model_name_or_path=config.model_info["model_name_or_path"])
        logger.info(f"对话 role: {role} debug_generate_config: {debug_generate_config}")
        
    else:
        # config.model_info["generate_config_id"] = None
        if config.model_info["generate_config_id"] is None:
            result = create_generate_config(nickname=config.model_info["nickname"],
                                generate_kwargs=config.model_info["generate_kwargs"],
                                model_name_or_path=config.model_info["model_name_or_path"],
                                prompts=config.model_info["prompts"])
            print(result)
            config.model_info["generate_config_id"] = result.generate_config_id
            logger.info(f"对话， 插入生成配置参数! generate_config_id: {result.generate_config_id}")
        # 查询历史的 query
        logger.info(f"对话 role: {role}", config.model_info["generate_config_id"])
        history_dialogue, is_query = query_dialogue_by_turnid_username(turn_id=turn_id, username=username, 
                                                                        generate_config_id=config.model_info["generate_config_id"])

        # 先插入问题
        dialogue_instance = create_dialogue_mess(username=username, generate_config_id=config.model_info['generate_config_id'],
                                bot_response=None, user_query=prompt, turn_id=turn_id)  

    input_query = []
    for item in history_dialogue:
        input_query.append({"role": "HUMAN", "content": item["user_query"]})
        input_query.append({'role': 'BOT', "content": item["bot_response"]})
    input_query.append({"role":"HUMAN", "content": prompt})
    query = {"query": input_query, "params": config.model_info["generate_kwargs"], "is_stream": config.model_info["stream"]}
    if 'debug' in role:
        if "stream" in model_info:
            query["is_stream"] = model_info.pop("stream")
        query['params'] = debug_generate_config   
        logger.info(f"更新的参数: {debug_generate_config}")
        logger.info(f"查询输入: {query}", )
    else:
        query['params'] = config.model_info["generate_kwargs"]
        
    async def generator(querys, bot, prompt, dialogue_instance, role):
 
        gen_response = bot.chat(querys)
        idx = 0
        response = None
        status = False
        for response, status in gen_response:
            idx += 1
            yield {
                "id": idx,
                "event": "message",
                "retry": 20000,
                "data": json.dumps({
                    "code": 1,
                    "data": {
                        "context": response,
                        "id": dialogue_instance.dialogue_id,
                        "request": prompt,
                        "response": response
                    }
                })
            }
            if await request.is_disconnected():
                break
        # 这里进行数据库的插入操作
        new_message = {"BOT": prompt, "HUMAN": response}
        logger.info("new_message ", new_message)
        if 'debug' in role:
            is_update, new_dialogue = update_user_query_in_debug_message(dialogue_id=dialogue_instance.dialogue_id,
                                                                         bot_response=response)
        else:
            is_update, new_dialogue = update_user_query_in_dialogue(dialogue_id=dialogue_instance.dialogue_id,
                                                                    bot_response=response)
        logger.info(f"插入数据库情况： is_update: {is_update}\tnew_dialogue: {new_dialogue}\tstatus:{status}")
        if status:
            yield {
                "id": idx,
                "event": "message",
                "retry": 20000,
                "data": json.dumps({
                    "code": -20003,
                    "data": {
                        "context": "",
                        "id": dialogue_instance.dialogue_id,
                        "request": prompt,
                        "response": response
                    }
                })
            }
        else:
            yield {
                    "id": idx,
                    "event": "message",
                    "retry": 20000,
                    "data": json.dumps({
                        "code": 0,
                        "data": {
                            "context": "",
                            "id": dialogue_instance.dialogue_id,
                            "request": prompt,
                            "response": response
                        }
                    })
            }
    
    return EventSourceResponse(generator(query, config.bot, prompt, dialogue_instance, role))


@chat_router.get("/get_paramters")
def get_model_parameters():
    config = AppConfig()
    logger.info("获取模型配置参数")
    return {"code": 200, "data": config.model_info["generate_kwargs"], "msg": "ok"}


@chat_router.get("/model_info")
def get_model_info():
    config = AppConfig()
    model_info = config.model_info
    logger.info("获取模型的信息")
    return {"code": 200, "data": {
        "model_name_or_path": model_info["model_name_or_path"],
        "nickname": model_info["nickname"],
        "tokenizer_path": model_info["tokenizer_path"],
        "generate_kwargs": model_info["generate_kwargs"],
        "device": model_info["device"],
        "prompts": model_info["prompts"],
        "url": model_info["url"],
        "stream": model_info["stream"],
        "model_id": model_info["generate_config_id"]
    }}


@chat_router.post("/set_parameters")
def set_model_parameters(gen_config: dict):
    states = AppConfig()
    print(gen_config)
    # 这里需要进行数据库的插入操作
    # gen_config = params["gen_config"]
    gen_config = OrderedDict(sorted(gen_config.items()))
    
    response = create_generate_config(nickname=states.model_info["nickname"], generate_kwargs=gen_config,
                                      model_name_or_path=states.model_info["model_name_or_path"],
                                      prompts=states.model_info["prompts"])
    if response:
        states.model_info["generate_config"] = gen_config
        states.model_info["generate_config_id"] = response.generate_config_id
        return {"code": 200, "msg": "ok", "data": response}
    else:
        return {"code": 400, "msg": "error", "data": response}

@chat_router.post("/get_ds_instance")
def get_ds_instance(request: Request):
    config = AppConfig()
    ds_name = request.query_params['ds_name']
    query_idx = request.query_params["query_idx"]
    instance = config.bot.get_ds_instance(ds_name, query_idx)
    return {"code": 200, "msg": "ok", "data": instance}

@chat_router.post("/get_ds_chip")
def get_ds_chip(request: Request):
    config = AppConfig()
    ds_name = request.query_params['ds_name']
    start_idx = request.query_params["start_idx"]
    end_idx = request.query_params["end_idx"]
    rsp_list = config.bot.get_ds_chip(ds_name, start_idx, end_idx)
    return {
        "code": 200, "msg": "ok", "data": {"model_id": config.model_info["generate_config_id"],
                                           "data": rsp_list}
    }
