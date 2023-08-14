import re

import torch

from .models import ChatGLMForConditionalGeneration
from .base import TransformersChatBotBase

class ChatGLMBOT(TransformersChatBotBase):
    def __init__(self, config):
        assert config.dtype != torch.float32, \
            "`float32` is invalid for ChatGLM due to its structure."
        super(ChatGLMBOT, self).__init__(config)
        self.prompts = {
            "meta_prompt": "",
            "user_prompt": "[Round {}]\n答：{}\n",
            "bot_prompt": "问：{}\n"
        }
        
    @property
    def model_cls(self):
        return ChatGLMForConditionalGeneration

    def get_query_prompt(self, query):
        """
        Get prompt for ChatGLM.

        :param query: list of dict
            [
                {"role": "BOT", "content": "hello"}
                {"role": "HUMAN", "content": "hello, bot"},
                ...
            ]
        """
        prompt_dict = {
            "BOT": "答：{}\n",
            "HUMAN": "问：{}\n",
        }
        prompt = ""
        for i, q in enumerate(query):
            if q["role"] == "HUMAN":
                prompt += f"[Round {i}]\n"
            prompt += prompt_dict[q["role"]].format(q["content"])
        prompt += "答："

        return prompt
    
    def process_response(self, response):
        response = response.strip()
        response = response.replace("[[训练时间]]", "2023年")
        punkts = [
            [",", "，"],
            ["!", "！"],
            [":", "："],
            [";", "；"],
            ["\?", "？"],
        ]
        for item in punkts:
            response = re.sub(r"([\u4e00-\u9fff])%s" % item[0], r"\1%s" % item[1], response)
            response = re.sub(r"%s([\u4e00-\u9fff])" % item[0], r"%s\1" % item[1], response)

        return response
    
    @property
    def no_split_module_classes(self):
        return ["GLMBlock"]