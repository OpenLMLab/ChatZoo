from peewee import Model, CharField, ForeignKeyField, DateTimeField
import datetime

from user import User
from utils import JSONField


class Vote(Model):
    
    vote_id = CharField(primary_key=True)
    user_id = ForeignKeyField(User, backref='votes')
    model_candidate = JSONField()
    vote_result = CharField(max_length=100)
    session_id = CharField(unqiue=True) # 会话的id
    created_time = DateTimeField(datetime.now)