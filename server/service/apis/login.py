# import sys
# sys.path.append("../")

from fastapi import APIRouter, Request

# from service.utils import AppConfig
from service.database.crud.user_crud import adjust_username_in_user
# from service.database.crud.user_curd import adjust_username_in_user


login_router = APIRouter()

        
@login_router.post("/")
async def login_by_username(username):
    print(username)
    # username = request.query_params['username']
    # config = AppConfig()
    is_access, query = adjust_username_in_user(username)
    if is_access:
        return {"code": 200, "data": {"role": query.role,
                                      "username": query.username, "session_mark_num": query.session_mark_num,
                                      "single_mark_num": query.single_mark_num,"create_time": query.create_time},
                "msg": "登录成功!"}
    else:
        return {"code": 400, "data": None, "msg": "sql operation error!"}
