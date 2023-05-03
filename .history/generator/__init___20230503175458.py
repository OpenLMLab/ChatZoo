from .moss import MOSSBOT
from .chatglm import ChatGLMBOT
from .firefly import FireflyBOT
from .godel import GODELBOT

MODEL_DICT = {
    "moss": MOSSBOT,
    "chatglm": ChatGLMBOT,
    "firefly": FireflyBOT,
    "godel": GODELBOT,
}

def choose_bot(config):
    if config.type not in MODEL_DICT:
        raise ValueError(
            f"Unsupported model type {config.type}. Should be one of: "
            f"{MODEL_DICT.keys()}"
        )
    return MODEL_DICT[config.type](config)