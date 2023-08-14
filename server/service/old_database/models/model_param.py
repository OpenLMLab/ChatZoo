from peewee import CharField, DateTimeField, Model, AutoField
import datetime

from .utils import JSONField


class Model_param(Model):
    
    model_id = AutoField(primary_key=True) # 自增的主键
    model_name = CharField(max_length=100)
    create_time = DateTimeField(default=datetime.now)
    model_param = JSONField() # 模型的参数

