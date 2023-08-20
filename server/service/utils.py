import os
from dataclasses import dataclass

import torch
from peewee import SqliteDatabase, MySQLDatabase

from .database.models import User, DebugMessage, Dialogue, Generate_Config, Vote 


class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class AppConfig(metaclass=Singleton):
    
    def __init__(self, db=None, bot=None, model_info=None, mode=None) -> None:
        self.db = db
        self.bot = bot
        self.model_info = model_info
        self.mode = mode


MODEL_NAME_TO_MODEL_DICT = {
    # MOSS
    "fnlp/moss-moon-003-base": "moss",
    "fnlp/moss-moon-003-sft": "moss",
    "fnlp/moss-moon-003-sft-plugin": "moss",
    "fnlp/moss-moon-003-sft-int8": "moss",
    "fnlp/moss-moon-003-sft-plugin-int4": "moss",
    "fnlp/moss-moon-003-sft-int4": "moss",
    "fnlp/moss-moon-003-sft-plugin-int8": "moss",
    # chatglm
    "THUDM/chatglm-6b": "chatglm",
    "THUDM/chatglm2-6b": "chatglm2",
    # firefly
    "YeungNLP/firefly-1b4": "firefly",
    "YeungNLP/firefly-2b6": "firefly",
    # baize
    "project-baize/baize-lora-7B": "baize",
    # godel
    "microsoft/GODEL-v1_1-base-seq2seq": "godel",
    "microsoft/GODEL-v1_1-large-seq2seq": "godel",
    # belle
    "BelleGroup/BELLE-7B-2M": "belle",
    # stablelm
    "stabilityai/stablelm-tuned-alpha-3b": "stablelm",
    "stabilityai/stablelm-tuned-alpha-7b": "stablelm",
    # vicuna
    "lmsys/vicuna-7b-delta-v1.1": "vicuna",
    "lmsys/vicuna-13b-delta-v1.1": "vicuna",
    # fastchat t5
    "lmsys/fastchat-t5-3b-v1.0": "fastchat-t5",
    # OpenAi
    "openai/chatgpt3.5": "chatgpt"
}

DTYPE_DICT = {
    "float16": torch.float16,
    "float32": torch.float32,
    "bfloat16": torch.bfloat16
}

      
@dataclass
class ModelConfig:
    pretrained_path: str # path of pretrained model.
    type: str = None # type of model. 'moss', 'chatglm' etc.
    tokenizer_path: str = None
    dtype: str = "float32"
    from_s3: bool = False
    # for lora-finetuned model such as baize
    base_model: str = None
    prompts: dict = None
    
    def __post_init__(self):
        if self.tokenizer_path is None:
            self.tokenizer_path = self.pretrained_path
        if self.type is None:
            try:
                self.type = MODEL_NAME_TO_MODEL_DICT[self.pretrained_path]
            except KeyError as e:
                if self.prompts is None:
                    raise ValueError(f"pretrained model {self.pretrained_path} is not a chatbot, "
                                     "you must init prompts so that we could init a new chatbot.")
                    raise ValueError(
                        f"Unknown pretrained model {self.pretrained_path}. Please "
                        "check `pretrained_path` in your config as "
                        f"one of: {set(MODEL_NAME_TO_MODEL_DICT.values())}"
                    )
        self.dtype = DTYPE_DICT[self.dtype]
        if torch.cuda.device_count() < 1:
            # no gpu
            if self.dtype == torch.float16:
                print(
                    "Half precision is not supported with no gpu available. "
                    "We will set `config.dtype` to `torch.float32`."
                )
                self.dtype = torch.float32


    def __repr__(self) -> str:

        width = os.get_terminal_size().columns // 2 * 2
        single_side = (width - 8) // 2
        r = f"\n{'-' * single_side} CONFIG {'-' * single_side}\n"
        for k, v in self.__dict__.items():
            r += f"{k}: {v}\n"
        r += f"{'-' * width}\n"

        return r


def parse_json(json_str):
    import json
    try:
        return json.loads(json_str)
    except:
        raise ValueError("Can not parse to json dict")


def pack_model_info(generate_config_id, model_config, nickname, model_name_or_path, prompts, is_stream, url, device, tokenizer_path):
    from collections import OrderedDict
    gen_config = OrderedDict(sorted(model_config.items()))
    model_info = {
        "generate_kwargs": gen_config,
        "nickname": nickname,
        "model_name_or_path": model_name_or_path,
        "generate_config_id": generate_config_id,
        "prompts": prompts,
        "stream": is_stream,
        "url": url,
        "device": device,
        "tokenizer_path": tokenizer_path
    }
    return model_info


def initial_database(database_path, db_type):
    if 'sqlite' in db_type:
        db = SqliteDatabase(database_path)
    elif 'mysql' in db_type:
        db = MySQLDatabase(database_path)
    else:
        raise ValueError(f"db_type must be sqlite or mysql, but got {db_type}")
    
    User._meta.database = db
    DebugMessage._meta.database = db
    Dialogue._meta.database = db
    Generate_Config._meta.database = db
    Vote._meta.database = db
    db.connect()
    db.create_tables([User, DebugMessage, Dialogue, Generate_Config, Vote])
    return db

