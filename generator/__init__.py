import importlib
import inspect

from .chatbot import ChatBOT

def choose_bot(config):
    mod = importlib.import_module("." + config.type, package="generator")
    classes = inspect.getmembers(mod, inspect.isclass)
    name, bot_cls = None, None
    for name, bot_cls in classes:
        if issubclass(bot_cls, ChatBOT):
            break

    print(f"Choose ChatBOT: {name}")
    return bot_cls(config)
