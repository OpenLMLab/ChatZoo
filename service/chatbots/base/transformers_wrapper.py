from typing import Optional, Callable
import copy

from loguru import logger
import torch
from transformers import GenerationConfig, LogitsProcessorList, StoppingCriteriaList


class transfomersWrapper:
    
    def __init__(self, transformers_model) -> None:
        self.model = transformers_model
    
    def stream_generate(self, input_ids, generation_config: Optional[GenerationConfig]=None,
                        logits_processor: Optional[LogitsProcessorList] = None,
                        stopping_criteria: Optional[StoppingCriteriaList] = None,
                        return_past_key_values=False,
                        **kwargs
                        ):
        batch_size, seq_len = input_ids.shape[0], input_ids.shape[1]
        if generation_config is None:
            generation_config = self.model.generation_config
        generation_config = copy.deepcopy(generation_config)
        model_kwargs = generation_config.update(**kwargs)
        if generation_config.pad_token_id is None and generation_config.eos_token_id is not None:
            if model_kwargs.get("attention_mask", None) is None:
                logger.warning(
                    "The attention mask and the pad token id were not set. As a consequence, you may observe "
                    "unexpected behavior. Please pass your input's `attention_mask` to obtain reliable results."
                )
            eos_token_id = generation_config.eos_token_id
            if isinstance(eos_token_id, list):
                eos_token_id = eos_token_id[0]
            logger.warning(f"Setting `pad_token_id` to `eos_token_id`:{eos_token_id} for open-end generation.")
            generation_config.pad_token_id = eos_token_id
        
        logits_processor = logits_processor if logits_processor is not None else LogitsProcessorList()
        stopping_criteria = stopping_criteria if stopping_criteria is not None else StoppingCriteriaList()

        
    def __getattribute__(self, name: str):
        try:
            return object.__getattribute__(self, name)
        except:
            return getattr(self.model, name)
