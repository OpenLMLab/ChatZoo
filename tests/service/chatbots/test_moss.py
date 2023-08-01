import pytest
import sys
sys.path.append("../../..")

from server.service.chatbots.moss import MOOSBOT
from tests.service.chatbots.config import ModelConfig


class TestMOSSBOT:
    
    query = {"prompt": "test prompt", "is_stream": True, "query": [{"content": "你是谁", "role": "HUMAN"}], "params": {"max_length": 2048,
            "top_p": 0.9, "temperature": 0.95}}
    config = ModelConfig(
            pretrained_path="fnlp/moss-moon-003-sft", from_s3=True,
            type="chatglm2", tokenizer_path="fnlp/moss-moon-003-sft", dtype="float16",
        )
    mossModel = MOOSBOT(config)
    
    def test_get_query_prompt(self):
        query_out=self.mossModel.get_query_prompt(query=self.query["query"])
        # assert query_out=="[Round 1]\n\n问：你是谁\n\n答：", query_out
    
    def test_stream_chat(self):
        response = self.mossModel.chat(self.query)
        for item in response:
            print(item)
    
    def test_no_stream_chat(self):
        query = {"prompt": "test prompt", "is_stream": False, "query": [{"content": "你是谁", "role": "HUMAN"}], "params": {"max_length": 2048,
            "top_p": 0.9, "temperature": 0.95}}
        response = self.mossModel.chat(query)
        for item in response:
            print(item)
    