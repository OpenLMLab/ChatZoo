from transformers import BloomForCausalLM

from .chatbot import ChatBOT

class FireflyBOT(ChatBOT):
    def __init__(self, config):
        super(FireflyBOT, self).__init__(config)

    @property
    def model_cls(self):
        return BloomForCausalLM
    
    def get_prompt(self, query):
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