"""
Configs of supported models.

contains generation configs and paths of a model.
"""
import os
from dataclasses import dataclass

import torch

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

    # for openai
    api_key: str = None
    api_key_file_path: str = None

    def __post_init__(self):
        if self.tokenizer_path is None:
            self.tokenizer_path = self.pretrained_path
        if self.type is None:
            try:
                self.type = MODEL_NAME_TO_MODEL_DICT[self.pretrained_path]
            except KeyError as e:
                raise ValueError(
                    f"Unknown pretrained model {self.pretrained_path}. Please "
                    "check `pretrained_path` in your config or set `type` as "
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

        if self.api_key_file_path is not None:
            if not os.path.exists(self.api_key_file_path):
                raise RuntimeError(f"Openai api key file path :{self.api_key_file_path} is not exists!"
                                    "Please check it again!")
            else:
                api_key_list = []
                with open(self.api_key_file_path, "r", encoding="utf8") as fp:
                    for item in fp:
                        api_key_list.append(item.strip().strip("\n"))
                self.api_key_file_path = api_key_list

    def __repr__(self) -> str:

        width = os.get_terminal_size().columns // 2 * 2
        single_side = (width - 8) // 2
        r = f"\n{'-' * single_side} CONFIG {'-' * single_side}\n"
        for k, v in self.__dict__.items():
            r += f"{k}: {v}\n"
        r += f"{'-' * width}\n"

        return r
