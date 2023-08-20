from dataclasses import dataclass

import torch

DTYPE_DICT = {
    "float16": torch.float16,
    "float32": torch.float32,
    "bfloat16": torch.bfloat16
}

@dataclass
class ModelConfig:
    pretrained_path: str
    tokenizer_path: str
    type: str = None
    dtype: str = "float32"
    base_model: str = None
    from_s3: bool = False
    
    def __post_init__(self):
        if self.tokenizer_path is None:
            self.tokenizer_path = self.pretrained_path
        
        if self.type is None:
            pass
        
        self.dtype = DTYPE_DICT[self.dtype]
    