import traceback

from peewee import chunked

from ..models.user import User


def create_user(username: str, session_mark_num: int=0, single_mark_num: int=0, permission:str="root"):
    try:
        User.create(username=username, session_mark_num=session_mark_num, single_mark_num=single_mark_num, role=permission)
        return True
    except:
        traceback.print_exc()
        return False

def delete_user_by_username(username: str):
    try:
        User.delete(User.username == username)
        return True
    except:
        traceback.print_exc()
        return False

def delete_user_by_userid(user_id: int):
    try:
        User.delete(User.user_id == user_id)
        return True
    except:
        traceback.print_exc()
        return False

def update_user(username: str, session_mark_num: int=0, single_mark_num: int=0, permission: str = "root"):
    try:
        User.update(username=username, session_mark_num=session_mark_num, single_mark_num=single_mark_num, permission=permission)
        return True
    except:
        traceback.print_exc()
        return False

def read_user_by_username(username: str):
    try:
        return User.select().where(User.username == username)
    except:
        traceback.print_exc()
        return None

def read_all_users():
    try:
        return User.select()
    except:
        traceback.print_exc()
        return None

def adjust_username_in_user(username: str):
    # 判断username是否存在
    try:
        query = User.select().where(User.username == username).get()
        return True, query
    except:
        return False, None


def insert_many_users(batch_data, chunk_num):
    try:
        for data_chunk in chunked(batch_data, chunk_num):
            User.insert_many(data_chunk).execute()
        return True
    except:
        traceback.print_exc()
        return False

def insert_or_update_user(username: str, session_mark_num: int=0, single_mark_num: int=0, permission:str="root"):
    try:
        update_row = User.update(session_mark_num=session_mark_num, single_mark_num=single_mark_num, role=permission).where(User.username==username).execute()
        if update_row == 0:
            return User.create(username=username, session_mark_num=session_mark_num, single_mark_num=single_mark_num, role=permission)
        else:
            return update_row
    except:
        traceback.print_exc()
        return None


