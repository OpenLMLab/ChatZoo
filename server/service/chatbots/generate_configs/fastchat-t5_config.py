from dataclasses import dataclass


@dataclass
class FastChatT5Config:
    
    context_len: int = 2048
    temperature: float = 0.7
    max_new_tokens: int = 512

    stop_str: str = "###"
    stop_token_ids = []
    decoder_start_token_id: int = 0
    
    prompt = "A chat between a curious human and an artificial " \
             "intelligence assistant. " \
             "The assistant gives helpful, detailed, and polite answers " \
             "to the human's questions.\n###"