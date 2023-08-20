from peewee import TextField, Model
import json

class JSONField(TextField):
    def db_value(self, value):
        return json.dumps(value)

    def python_value(self, value):
        if value is not None:
            return json.loads(value)

class BaseModel(Model):
    
    class Meta:
        database = None # 不指定具体的数据库连接
