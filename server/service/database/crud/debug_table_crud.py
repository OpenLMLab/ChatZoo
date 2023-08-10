import traceback
from playhouse.shortcuts import model_to_dict

from ..models.debug_table import DebugMessage


def create_debugmessage(username:str, nickname: str, bot_reponse:str, turn_id:str, user_query:str, generate_kwargs: dict, model_name_or_path: str):
    try:
        return DebugMessage.create(nickname=nickname, username=username, bot_reponse=bot_reponse, user_query=user_query,
                            model_name_or_path=model_name_or_path, generate_kwargs=generate_kwargs, turn_id=turn_id)
    except:
        traceback.print_exc()
        return None

def update_user_query_in_debug_message(dialogue_id: int, bot_response: str):
    try:
        return True, DebugMessage.update(bot_response=bot_response).where(DebugMessage.dialogue_id==dialogue_id).execute()
    except:
        traceback.print_exc()
        return False, None

def query_debugmessage_by_turnid_genconfig(turn_id, nickname):
    try:
        items = DebugMessage.select().where((DebugMessage.turn_id == turn_id) & 
                                           (DebugMessage.nickname==nickname)).order_by(DebugMessage.create_time)
        query_result = [model_to_dict(item) for item in items]
        return query_result, True
    except:
        traceback.print_exc()
        return None, False