from transformers import GPTNeoXForCausalLM, StoppingCriteria, StoppingCriteriaList

from .base import TransformersChatBotBase

class StableLMBOT(TransformersChatBotBase):
    def __init__(self, config):
        super(StableLMBOT, self).__init__(config)
        prompt = """<|SYSTEM|># StableLM Tuned (Alpha version)
- StableLM is a helpful and harmless open-source AI language model developed by StabilityAI.
- StableLM is excited to be able to help the user, but will refuse to do anything that could be considered harmful to the user.
- StableLM is more than just an information source, StableLM is also able to write poetry, short stories, and make jokes.
- StableLM will refuse to participate in anything that could harm a human.
"""
        self.set_input_prompt(prompt)
        
    @property
    def model_cls(self):
        return GPTNeoXForCausalLM
    
    def extra_settings(self):
        return {
            "stopping_criteria": StoppingCriteriaList([StopOnTokens()])
        }
    
    def get_query_prompt(self, query):
        prompt = self.get_input_prompt()
        prompt_dict = {
            "BOT": "<|ASSISTANT|>{}",
            "HUMAN": "<|USER|>{}"
        }
        for q in query:
            prompt += prompt_dict[q["role"]].format(q["content"])
        prompt += "<|ASSISTANT|>"

        return prompt
    
    @property
    def no_split_module_classes(self):
        return ["GPTNeoXLayer"]
    
class StopOnTokens(StoppingCriteria):
    def __call__(self, input_ids, scores, **kwargs) -> bool:
        stop_ids = [50278, 50279, 50277, 1, 0]
        for stop_id in stop_ids:
            if input_ids[0][-1] == stop_id:
                return True
        return False
