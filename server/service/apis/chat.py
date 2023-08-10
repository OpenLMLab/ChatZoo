from collections import OrderedDict
import json
from urllib.parse import unquote
from playhouse.shortcuts import model_to_dict

from fastapi import APIRouter, Request, Response
from sse_starlette.sse import EventSourceResponse
from starlette.responses import StreamingResponse

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
    
    # 会话id 和 user 信息
    turn_id = request.query_params['turn_id']
    username = request.query_params['username']  
    role = request.query_params['role']
    
    if 'debug' in role:
        # debug 成员，此时headers 的 Authorization 为 generate_kwargs
        # 鉴权信息
        debug_generate_config = json.loads(request.headers["Authorization"])
        history_dialogue, is_query = query_debugmessage_by_turnid_genconfig(turn_id=turn_id, nickname=config.model_info["nickname"])
        dialogue_instance = create_debugmessage(username=username, nickname=config.model_info['nickname'], bot_reponse=None,
                                                turn_id=turn_id, user_query=prompt, generate_kwargs=debug_generate_config,
                                                model_name_or_path=config.model_info["model_name_or_path"])
    else:
        if config.model_info["generate_config_id"] is None:
            result = create_generate_config(nickname=config.model_info["nickname"],
                                generate_kwargs=config.model_info["generate_kwargs"],
                                model_name_or_path=config.model_info["model_name_or_path"],
                                prompts=config.model_info["prompts"])
            print(result)
            config.model_info["generate_config_id"] = result.generate_config_id
        # 查询历史的 query
        history_dialogue, is_query = query_dialogue_by_turnid_username(turn_id=turn_id, username=username, 
                                                                        generate_config_id=config.model_info["generate_config_id"])

        # 先插入问题
        dialogue_instance = create_dialogue_mess(username=username, generate_config_id=config.model_info['generate_config_id'],
                                bot_response=None, user_query=prompt, turn_id=turn_id)  
        
    # if config.mode == 'arena':
    #     # 开始对话， 检查是否插入参数配置
    #     if config.model_info["generate_config_id"] is None:
    #         result = create_generate_config(nickname=config.model_info["nickname"],
    #                             generate_kwargs=config.model_info["generate_kwargs"],
    #                             model_name_or_path=config.model_info["model_name_or_path"],
    #                             prompts=config.model_info["prompts"])
    #         print(result)
    #         config.model_info["generate_config_id"] = result.generate_config_id
    #     # 查询历史的 query
    #     history_dialogue, is_query = query_dialogue_by_turnid_username(turn_id=turn_id, username=username, 
    #                                                                     generate_config_id=config.model_info["generate_config_id"])
    # else:
    #     history_dialogue, is_query = query_debugmessage_by_turnid_genconfig(turn_id=turn_id, nickname=config.model_info["nickname"])
    
    # # 插入问题
    # dialogue_instance = create_dialogue_mess(username=username, generate_config_id=config.model_info['generate_config_id'],
    #                          bot_response=None, user_query=prompt, turn_id=turn_id)  
    print(history_dialogue)
    input_query = []
    for item in history_dialogue:
        input_query.append({"role": "HUMAN", "content": item["user_query"]})
        input_query.append({'role': 'BOT', "content": item["bot_response"]})
    input_query.append({"role":"HUMAN", "content": prompt})
    query = {"query": input_query, "params": config.model_info["generate_kwargs"], "is_stream": config.model_info["stream"]}
    if 'debug' in role:
        query['params'] = debug_generate_config
    else:
        query['params'] = config.model_info["generate_kwargs"]
        
    async def generator(querys, bot, prompt, dialogue_instance, role):
        print("query", query)
        gen_response = bot.chat(querys)
        idx = 0
        response = None
        status = False
        for response, status in gen_response:
            idx += 1
            print(response)
            yield {
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
        print("new_message", new_message)
        if 'debug' in role:
            is_update, new_dialogue = update_user_query_in_debug_message(dialogue_id=dialogue_instance.dialogue_id,
                                                                         bot_response=response)
        else:
            is_update, new_dialogue = update_user_query_in_dialogue(dialogue_id=dialogue_instance.dialogue_id,
                                                                    bot_response=response)
        print(is_update, new_dialogue, status)
        if status:
            yield {
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
    return {"code": 200, "data": config.model_info["generate_kwargs"], "msg": "ok"}

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