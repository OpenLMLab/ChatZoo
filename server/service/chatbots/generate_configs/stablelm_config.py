from dataclasses import dataclass
from transformers import StoppingCriteria, StoppingCriteriaList


class StopOnTokens(StoppingCriteria):
    def __call__(self, input_ids, scores, **kwargs) -> bool:
        stop_ids = [50278, 50279, 50277, 1, 0]
        for stop_id in stop_ids:
            if input_ids[0][-1] == stop_id:
                return True
        return False


@dataclass
class StableLMConfig:
    
    max_length: int = 2048
    top_p: float = 0.9
    top_k: float = 1
    temperature: float = 0.95
    repetition_penalty: float = 1.02
    stopping_criteria = StoppingCriteriaList([StopOnTokens()])
    

