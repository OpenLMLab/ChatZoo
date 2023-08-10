from peewee import Model, CharField, AutoField, DateTimeField, TextField
import datetime

from .utils import JSONField, BaseModel

class DebugMessage(BaseModel):
    
    dialogue_id = AutoField(primary_key=True)
    username = CharField()
    nickname = CharField(max_length=100)
    bot_response = TextField(null=True)
    user_query = TextField(null=True)
    generate_kwargs = JSONField()
    create_time = DateTimeField(default=datetime.datetime.now)
    model_name_or_path = CharField(max_length=100)
    turn_id = CharField()
