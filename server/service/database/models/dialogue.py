from peewee import Model, CharField, DateTimeField, ForeignKeyField, AutoField, TextField
import datetime

from .utils import BaseModel
from .user import User
from .generate_config import Generate_Config


class Dialogue(BaseModel):
    
    dialogue_id = AutoField(primary_key=True)
    username = ForeignKeyField(User, backref='dialogue_messages') # User 表外键关联
    generate_config_id = ForeignKeyField(Generate_Config, backref='dialogue_messages') # Generate_Config 表外键关联
    bot_response = TextField(null=True)
    user_query = TextField()
    created_time = DateTimeField(default=datetime.datetime.now)
    turn_id = CharField() # 会话的 id

