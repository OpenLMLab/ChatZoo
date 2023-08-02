from peewee import Model, CharField, DateTimeField, ForeignKeyField, AutoField
import datetime

from utils import JSONField
from user import User
from model_param import Model_param


class Dialogue_mess(Model):
    
    mess_id = AutoField(primary_key=True)
    user_id = ForeignKeyField(User, backref='dialogue_messages') # User 表外键关联
    model_id = ForeignKeyField(Model_param, backref='dialogue_messages') # Model_param 表外键关联
    message = JSONField()
    created_time = DateTimeField(default=datetime.now)
    session_id = CharField(unique=True) # 会话的 id
