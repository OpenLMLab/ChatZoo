import re

import torch

from .models import ChatGLM2ForConditionalGeneration
from .transformersbot import TransformersChatBOT

class ChatGLMBOT(TransformersChatBOT):
    def __init__(self, config):
        assert config.dtype != torch.float32, \
            "`float32` is invalid for ChatGLM due to its structure."
        super(ChatGLMBOT, self).__init__(config)

    @property
    def model_cls(self):
        return ChatGLM2ForConditionalGeneration

    def get_prompt(self, query):
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
    
    # def generate(self, input_dict, gen_kwargs):
    #     # from transformers import TextIteratorStreamer
    #     from transformers.generation.streamers import TextStreamer
    #     from threading import Thread
    #     import threading
    #     from queue import Queue
    #     class TextIteratorStreamer(TextStreamer):  
    #         def __init__(
    #             self, tokenizer, skip_prompt: bool = False, timeout = None, **decode_kwargs
    #         ):
    #             super().__init__(tokenizer, skip_prompt, **decode_kwargs)
    #             self.text_queue = Queue()
    #             self.stop_signal = None
    #             self.timeout = timeout
    #             self.loack = threading.Lock()

    #         def on_finalized_text(self, text: str, stream_end: bool = False):
    #             """Put the new text in the queue. If the stream is ending, also put a stop signal in the queue."""
    #             self.text_queue.put(text, timeout=self.timeout)
    #             if stream_end:
    #                 self.text_queue.put(self.stop_signal, timeout=self.timeout)

    #         def __iter__(self):
    #             return self

    #         def __next__(self):
    #             if self.loack:
    #                 value = self.text_queue.get(timeout=self.timeout)
    #                 if value == self.stop_signal:
    #                     raise StopIteration()
    #                 else:
    #                     return value
    #     streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True)
    #     generation_kwargs = dict(input_dict, streamer=streamer, **gen_kwargs)
    #     thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
    #     thread.start()
        
    #     return streamer
    
    def chat(self, post):
        print("Start generating...")
        try:
            if "prompt" in post:
                self.set_prompt(post.pop("prompt"))
            query = post["query"]
            gen_kwargs = self.default_settings()
            gen_kwargs.update(post["params"])
            gen_kwargs.update(self.extra_settings())
            prompt = self.get_prompt(query)
            input_dict = self.get_input(prompt)
            response = ''
            for output in self.generate(input_dict, gen_kwargs):
                # response = self.get_response(output, input_dict)
                print(output)
                response += output
                response = self.process_response(response)
                print(response)
                yield response
        except Exception as e:
            response = None
            import traceback
            traceback.print_exc()
    
        
    
    @property
    def no_split_module_classes(self):
        return ["GLMBlock"]