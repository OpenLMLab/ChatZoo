import sys
sys.path.append("../../..")

from peewee import SqliteDatabase

from server.service.database.models.user import User

db = SqliteDatabase("test.db")
User._meta.database = db

db.connect()
db.create_tables([User])

user = User.create(user_name="hjw", session_mark_num=10, single_mark_num=20)
User.create(user_name="hjw1", session_mark_num=10, single_mark_num=20)


instance = User.select().execute()
for item in instance:
    print(item.user_name, item.user_id, item.session_mark_num, item.single_mark_num)
print(instance)
