from peewee import CharField, DateTimeField, Model, AutoField
import datetime

from .utils import JSONField, BaseModel


class Generate_Config(BaseModel):
    
    generate_config_id = AutoField(primary_key=True)
    nickname = CharField(max_length=100)
    generate_kwargs = JSONField()
    model_name_or_path = CharField(max_length=100)
    create_time = DateTimeField(default=datetime.datetime.now)
    prompts = JSONField()