from peewee import Model, CharField, ForeignKeyField, DateTimeField, BooleanField
import datetime

from .user import User
from .utils import JSONField, BaseModel


class Vote(BaseModel):
    
    vote_id = CharField(primary_key=True)
    user_id = ForeignKeyField(User, backref='votes')
    model_candidate = JSONField()
    vote_result = CharField(max_length=100)
    created_time = DateTimeField(datetime.datetime.now)
    is_session_mark = BooleanField(default=False)