from peewee import Model, CharField, DateTimeField, IntegerField, AutoField
import datetime

class User(Model):
    user_id = AutoField(primary_key=True)
    user_name = CharField(unique=True)
    create_time = DateTimeField(default=datetime.now)
    session_mark_num = IntegerField(default=0)
    single_mark_num = IntegerField(default=0)
