# import sys
# sys.path.append("../")

from fastapi import APIRouter

from service.utils import AppConfig
from service.database.crud.user_crud import adjust_username_in_user
# from service.database.crud.user_curd import adjust_username_in_user


login_router = APIRouter()

        
@login_router.post("/user_login")
async def login_by_username(username):
    print(username)
    config = AppConfig()
    # if config.mode == 'debug':
    is_access = adjust_username_in_user(username)
    return {"status": 200, "response": is_access}
