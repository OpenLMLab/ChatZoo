import traceback

from playhouse.shortcuts import model_to_dict

from ..models.vote import Vote


def create_vote(username: str, vote_model: dict, vote_result: str, dialogue_id, turn_id):
    try:
        item =  Vote.create(username=username, vote_model=vote_model, vote_result=vote_result, dialogue_id=dialogue_id, turn_id=turn_id)
        return model_to_dict(item)
    except:
        traceback.print_exc()
        return None

def delete_vote_by_vote_id(vote_id: int):
    try:
        Vote.delete().where(Vote.vote_id == vote_id)
        return True
    except:
        traceback.print_exc()
        return False

def update_vote(vote_id: int, username: int, vote_model: dict, vote_result: str, dialogue_id: bool):
    try:
        Vote.update(username=username, vote_model=vote_model, vote_result=vote_result,
                    dialogue_id=dialogue_id).where(Vote.vote_id == vote_id)
        return True
    except:
        traceback.print_exc()
        return False
    
def read_all_votes():
    try:
        results = Vote.select()
        vote_dicts = [model_to_dict(result) for result in results]
        return vote_dicts
    except:
        traceback.print_exc()
        return None