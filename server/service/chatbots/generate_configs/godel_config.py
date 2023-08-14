from dataclasses import dataclass


@dataclass
class GODELConfig:
    
    max_length: int = 2048
    top_p: float = 0.9
    top_k: float = 1
    temperature: float = 0.95
    repetition_penalty: float = 1.02