import os
import importlib
import inspect

from .chatbot import ChatBOT

def choose_bot(config):
    mod = importlib.import_module("." + config.type, package="generator")
    classes = inspect.getmembers(mod, inspect.isclass)
    name, bot_cls = None, None
    for name, bot_cls in classes:
        _, filename = os.path.split(inspect.getsourcefile(bot_cls))
        file_mod, _ = os.path.splitext(filename)
        # bot_cls may be class that is imported from other files
        # ex. ChatBOT
        if file_mod == config.type and issubclass(bot_cls, ChatBOT):
            break

    print(f"Choose ChatBOT: {name}")
    return bot_cls(config)
