import re

from threading import Thread
import torch
from transformers.generation.streamers import TextIteratorStreamer

from .models import ChatGLM2ForConditionalGeneration
from .base import TransformersChatBotBase


class ChatGLM2ChatBot(TransformersChatBotBase):
    
    def __init__(self, config):
        assert config.dtype != torch.float32, \
            "`float32` is invalid for ChatGLM due to its structure."
        super().__init__(config)
        prompt = {"meta_prompt": "", "user_prompt": "问：{}\n\n", "bot_prompt": "答：{}\n\n"}
        self.set_input_prompt(prompt)
        
    @property
    def model_cls(self):
        return ChatGLM2ForConditionalGeneration
    
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
            "BOT": "答：{}\n\n",
            "HUMAN": "问：{}\n\n",
        }
        prompt = ""
        for idx, his_query in enumerate(query):
            if his_query["role"] == "HUMAN":
                prompt += f"[Round {idx+1}]\n\n"
            prompt += prompt_dict[his_query["role"]].format(his_query["content"])
                    
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

    # def generate(self, input_dict, gen_kwargs):
    #     streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True)
    #     generation_kwargs = dict(input_dict, streamer=streamer, **gen_kwargs)
    #     thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
    #     thread.start()
    #     return streamer
    
    # def chat(self, post):
    #     """
    #     post 的格式为 {"prompt": str, "is_stream": bool, "query": dict, "query": dict}
    #     """
    #     print("Start generating...")
    #     try:
    #         is_stream = False
    #         if "prompt" in post:
    #             self.set_input_prompt(post.pop("prompt"))
    #         if "is_stream" in post:
    #             is_stream = post.pop("is_stream")
    #         query = post["query"]
    #         gen_kwargs = self.get_generation_setting()
    #         gen_kwargs.update(post["params"])
    #         prompt = self.get_query_prompt(query)
    #         input_dict = self.get_query_tensor(prompt)
    #         if is_stream:
    #             response = ''
    #             for output in self.stream_generate(input_dict, gen_kwargs):
    #                 response += output
    #                 response = self.process_response(response)
    #                 yield response
    #         else:
    #             output = self.generate(input_dict, gen_kwargs)
    #             response = self.get_response(output, input_dict)
    #             response = self.process_response(response)
    #             yield response
    #     except Exception as e:
    #         response = None
    #         import traceback
    #         traceback.print_exc()

    @property
    def no_split_module_classes(self):
        return ["GLMBlock"]