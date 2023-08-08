import traceback

from ..models.vote import Vote


def create_vote(user_id: int, model_candidate: dict, vote_result: str, is_session_mark: bool):
    try:
        Vote.create(user_id=user_id, model_candidate=model_candidate, vote_result=vote_result, is_session_mark=is_session_mark)
        return True
    except:
        traceback.print_exc()
        return False

def delete_vote_by_vote_id(vote_id: int):
    try:
        Vote.delete().where(Vote.vote_id == vote_id)
        return True
    except:
        traceback.print_exc()
        return False

def update_vote(vote_id: int, user_id: int, model_candidate: dict, vote_result: str, is_session_mark: bool):
    try:
        Vote.update(user_id=user_id, model_candidate=model_candidate, vote_result=vote_result,
                    is_session_mark=is_session_mark).where(Vote.vote_id == vote_id)
        return True
    except:
        traceback.print_exc()
        return False
    
def read_all_votes():
    try:
        return Vote.select()
    except:
        traceback.print_exc()
        return None