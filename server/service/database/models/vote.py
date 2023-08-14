from peewee import AutoField, CharField, ForeignKeyField, DateTimeField, IntegerField
import datetime

from .user import User
from .utils import JSONField, BaseModel


class Vote(BaseModel):
    
    vote_id = AutoField()
    username = ForeignKeyField(User, backref='votes')
    vote_model = JSONField()
    vote_result = CharField(max_length=100)
    created_time = DateTimeField(default=datetime.datetime.now)
    dialogue_id = JSONField(null=True)
    turn_id = JSONField(null=True)
