from typing import List

import random
import openai

from .transformersbot import TransformersChatBOT


class ChatGPT35BOT(TransformersChatBOT):

    def __init(self, config):
        super(self, TransformersChatBOT).__init__(config)
        # openai.api_key = config.openai_api_key
        
    
    def default_settings(self):
        temp = getattr(self, "single_turn", None)
        print(temp)
        if temp is None:
            self.single_turn = []
            self.max_tokens = 3800
            self.cur_tokens = 0
            api_key = None

            if isinstance(self.config.api_key_file_path, List):
                api_key = random.choice(self.config.api_key_file_path)
            elif self.config.api_key is not None:
                api_key = self.config.api_key
            else:
                raise RuntimeError(f"ChatGPT api key is not init, please use --api_key or --api_key_file_path to init!")
            openai.api_key = api_key
        return {
            "top_p": 1.0, "temperature": 1.0,
            "frequency_penalty": 0, "n": 1, "max_tokens": 1600
        }

    
    def get_prompt(self, query):
        """
        Get prompt for chatgpt3.5

        """

        prompt_query = []
        self.single_turn.append(query[-1])
        for q in self.single_turn:
            item = {"role": "user" if q['role']=='HUMAN' else "assistant",
                    "content": q['content']}
            prompt_query.append(item)
        return prompt_query
        
    def load_tokenizer(self):
        return

    def get_input(self, prompt):
        return prompt
    
    def generate(self, input_dict, gen_kwargs):
        
        # 检测当前对话轮次 token 是否溢出
        if self.cur_tokens >= self.max_tokens:
            self.cur_tokens = 0
            self.single_turn = []
            res = ("当前对话字数已经超过限制, 将开启新一轮对话。请重新输入。", 0)
        else:
            res = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=input_dict,
                **gen_kwargs
                )
            res = (res, 1)
        return res
    
    def get_response(self, output, input_dict):
        out_msg = output[0]
        if output[1] == 1: 
            # 计算当前对话的 token 数量
            total_tokens = out_msg["usage"]["total_tokens"]
            self.cur_tokens += total_tokens
            
            out_msg = out_msg["choices"][0]["message"]
            dialog = {'role': out_msg['role'], "content": out_msg['content']}
            out_msg = dialog
            self.single_turn.append(out_msg)
            out_msg = out_msg['content']
        
        return out_msg
    
    def process_response(self, response):
        return response
    
    def load_model(self):
        return