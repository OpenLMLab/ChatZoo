"""
Configs of supported models.

contains generation configs and paths of a model.
"""
from typing import List
from dataclasses import dataclass, field

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
    dtype: str = "float16"
    # generation
    max_length: int = 2048
    num_beams: int = 1
    do_sample: bool = True
    top_k: int = 1
    top_p: float = 0.7
    temperature: float = 0.95
    repetition_penalty: float = 1.02
    # for lora-finetuned model such as baize
    base_model: str = "decapoda-research/llama-7b-hf"

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
