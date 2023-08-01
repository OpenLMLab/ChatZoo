from transformers import T5ForConditionalGeneration

from .fastchat import FastChatBOT

class FastChatT5BOT(FastChatBOT):
    def __init__(self, config):
        super(FastChatT5BOT, self).__init__(config)
        self.stop_str = "###"
        self.decoder_start_token_id = 0
        
        prompt = "A chat between a curious human and an artificial " \
                 "intelligence assistant. " \
                 "The assistant gives helpful, detailed, and polite answers " \
                 "to the human's questions.\n###"
        self.set_input_prompt(prompt)

    @property
    def model_cls(self):
        return T5ForConditionalGeneration

    def default_settings(self):
        return {
            "temperature": 0.7, "max_new_tokens": 512, "context_len": 2048,
        }
    
    def get_query_prompt(self, query):
        prompt = self.get_input_prompt()
        prompt_dict = {
            "BOT": "Assistant: {}\n###",
            "HUMAN": "Human: {}\n###"
        }
        for q in query:
            prompt += prompt_dict[q["role"]].format(q["content"])
        prompt += "Assistant:"

        return prompt
    
    @property
    def no_split_module_classes(self):
        return ["T5Block"]