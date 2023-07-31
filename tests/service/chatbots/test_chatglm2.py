import sys
sys.path.append("../../")

import pytest

from service.chatbots.chatglm2 import ChatGLM2ChatBot
from tests.service.chatbots.config import ModelConfig

class TestChatGLM2:
    
    query = {"prompt": "test prompt", "is_stream": True, "query": [{"HUMAN": "你是谁"}], "query": {"max_length": 2048,
            "top_p": 0.9, "temperature": 0.95}}
    
    def test_chat(self):
        config = ModelConfig(
            pretrained_path=""
        )
        ChatGLM2ChatBot()