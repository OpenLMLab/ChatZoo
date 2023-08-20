import sys
sys.path.append("../../..")

import pytest

from server.service.chatbots.chatglm2 import ChatGLM2ChatBot
from tests.service.chatbots.config import ModelConfig

class TestChatGLM2:
    
    query = {"prompt": "test prompt", "is_stream": True, "query": [{"content": "你是谁", "role": "HUMAN"}], "params": {"max_length": 2048,
            "top_p": 0.9, "temperature": 0.95}}
    config = ModelConfig(
            pretrained_path="THUDM/chatglm2-6b", from_s3=False,
            type="chatglm2", tokenizer_path="THUDM/chatglm2-6b", dtype="float16"
        )
    chatGLMModel = ChatGLM2ChatBot(config)
    def test_get_query_prompt(self):
        query_out = self.chatGLMModel.get_query_prompt(query=self.query["query"])
        assert query_out=="[Round 1]\n\n问：你是谁\n\n答：", query_out
    
    def test_chat(self):
        response = self.chatGLMModel.chat(self.query)
        for item in response:
            print(item)

    def test_chat_without_stream(self):
        query = {"prompt": "test prompt", "is_stream": False, "query": [{"content": "你是谁", "role": "HUMAN"}], "params": {"max_length": 2048,
            "top_p": 0.9, "temperature": 0.95}}
        response = self.chatGLMModel.chat(query)
        for i in response:
            print(i)
