from peewee import Model, CharField, AutoField, DateTimeField
import datetime

from .utils import JSONField, BaseModel

class DebugMessage(BaseModel):
    
    mess_id = AutoField(primary_key=True)
    nickname = CharField(max_length=100)
    message = JSONField()
    generate_config = JSONField()
    create_time = DateTimeField(default=datetime.datetime.now)
    model_name_or_path = CharField(max_length=100)
