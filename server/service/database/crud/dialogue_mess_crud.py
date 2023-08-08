import traceback

from ..models.dialogue_mess import Dialogue_Mess


def create_dialogue_mess(user_id: int, gen_id: int, message: dict, session_id: str):
    try:
        Dialogue_Mess.create(user_id=user_id, gen_id=gen_id, message=message, session_id=session_id)
        return True
    except:
        traceback.print_exc()
        return False

def delete_dialogue_mess_by_id(mess_id):
    try:
        Dialogue_Mess.delete().where(Dialogue_Mess.mess_id == mess_id)
        return True
    except:
        traceback.print_exc()
        return False

def update_dialogue_mess(mess_id: int, user_id: int, gen_id: int, message: dict, session_id: str):
    try:
        Dialogue_Mess.update(mess_id=mess_id, user_id=user_id, gen_id=gen_id, message=message, session_id=session_id)
        return True
    except:
        traceback.print_exc()
        return False

def read_dialogue_mess():
    try:
        return Dialogue_Mess.select()
    except:
        traceback.print_exc()
        return None