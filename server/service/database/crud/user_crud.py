import traceback

from ..models.user import User


def create_user(user_name: str, session_mark_num: int=0, single_mark_num: int=0):
    try:
        User.create(user_name=user_name, session_mark_num=session_mark_num, single_mark_num=single_mark_num)
        return True
    except:
        traceback.print_exc()
        return False

def delete_user_by_username(user_name: str):
    try:
        User.delete(User.user_name == user_name)
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

def update_user(user_name: str, session_mark_num: int=0, single_mark_num: int=0):
    try:
        User.update(user_name=user_name, session_mark_num=session_mark_num, single_mark_num=single_mark_num)
        return True
    except:
        traceback.print_exc()
        return False

def read_user_by_username(user_name: str):
    try:
        return User.select().where(User.user_name == user_name)
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
    try:
        User.select().where(User.user_name == username).get()
        return True
    except:
        return False 
