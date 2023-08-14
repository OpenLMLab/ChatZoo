from ..models import User


def create_user(user_name, session_mark_num=0, single_mark_num=0):
    try:
        return User.create(user_name=user_name, session_mark_num=session_mark_num, single_mark_num=single_mark_num)
    except:
        import traceback
        print(traceback.print_exception())
        
def get_user_by_id(user_id):
    try:
        return User.get(User.user_id == user_id)
    except:
        return None

def get_user_by_user_name(user_name):
    try:
        return User.get(User.user_name == user_name)
    except:
        return None

def update_user(user_id, user_name, session_mark_num=0, single_mark_num=0):
    params = {}
    if user_name is not None:
        params['user_name'] = user_name
    if session_mark_num is not None:
        params['session_mark_num'] = session_mark_num
    if single_mark_num is not None:
        params['single_mark_num'] = single_mark_num
    
    query = User.update(**params).where(User.user_id == user_id)
    return query.execute()     

def delete_user(user_id):
    try:
        User.delete().where(User.user_id == user_id).execute()
    except:
        import traceback
        print(traceback.print_exc())
