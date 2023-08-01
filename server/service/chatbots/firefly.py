from transformers import BloomForCausalLM

from .base import TransformersChatBotBase

class FireflyBOT(TransformersChatBotBase):
    def __init__(self, config):
        super(FireflyBOT, self).__init__(config)

    @property
    def model_cls(self):
        return BloomForCausalLM
    
    def extra_settings(self):
        return {"eos_token_id": self.tokenizer.eos_token_id}
    
    def get_query_prompt(self, query):
        """
        Get prompt for Firefly.

        <s>input</s></s>target</s>

        :param query: list of dict
            [
                {"role": "BOT", "content": "hello"}
                {"role": "HUMAN", "content": "hello, bot"},
                ...
            ]
        """
        prompt_dict = {
            "BOT": "</s>{}</s>",
            "HUMAN": "<s>{}</s>",
        }
        prompt = ""
        for i, q in enumerate(query):
            prompt += prompt_dict[q["role"]].format(q["content"])
        prompt += "</s>"

        return prompt
    
    def process_response(self, response):
        return response.replace("</s>", "")
    
    @property
    def no_split_module_classes(self):
        return ["BloomBlock"]