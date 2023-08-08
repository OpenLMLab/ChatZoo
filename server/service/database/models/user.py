from peewee import AutoField, CharField, IntegerField, DateTimeField, Model
import datetime

from .utils import BaseModel

class User(BaseModel):
    
    user_id = AutoField(primary_key=True)
    user_name = CharField(unique=True)
    create_time = DateTimeField(default=datetime.datetime.now)
    session_mark_num = IntegerField(default=0)
    single_mark_num = IntegerField(default=0)
