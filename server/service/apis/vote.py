from fastapi  import APIRouter, Request

from service.database.crud.vote_crud import create_vote

vote_router = APIRouter()


@vote_router.post("/")
def vote_model(vote_msg: dict):
    username = vote_msg.get("username")
    vote_result = vote_msg.get("vote_result")
    vote_model = vote_msg.get("vote_model")
    dialogue_id = vote_msg.get("dialogue_id")
    turn_id = vote_msg.get("turn_id")
    
    vote_instance = create_vote(username=username, vote_model=vote_model, vote_result=vote_result, dialogue_id=dialogue_id,
                           turn_id=turn_id)
    if vote_instance:
        return {"code": 200, "response": "ok", "data": vote_instance}
    else:
        return {"code": 400, "response": "sql error!"}
