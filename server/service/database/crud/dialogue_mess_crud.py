import traceback
from playhouse.shortcuts import model_to_dict

from ..models.dialogue import Dialogue


def create_dialogue_mess(username: str, generate_config_id: int, bot_response: str, user_query: str, turn_id: str):
    try:
        return Dialogue.create(username=username, generate_config_id=generate_config_id, bot_response=bot_response, user_query=user_query, turn_id=turn_id)
    except:
        traceback.print_exc()
        return None

def update_user_query_in_dialogue(dialogue_id: int, bot_response: str):
    try:
        return True, Dialogue.update(bot_response=bot_response).where(Dialogue.dialogue_id==dialogue_id).execute()
    except:
        traceback.print_exc()
        return False, None

def read_dialogue_mess():
    try:
        return Dialogue.select()
    except:
        traceback.print_exc()
        return None

def query_dialogue_by_turnid_username(turn_id, username, generate_config_id):
    try:
        items = Dialogue.select().where((Dialogue.turn_id == turn_id) &
                                                    (Dialogue.username == username) & (Dialogue.generate_config_id == generate_config_id)).order_by(Dialogue.created_time)
        query_result = [model_to_dict(item) for item in items]
        return query_result, True
    except:
        traceback.print_exc()
        return None, False
