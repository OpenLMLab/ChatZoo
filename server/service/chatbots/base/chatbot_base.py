from typing import Dict
import traceback


class ChatBotBase:
    """
    所有 transformer_chatbot 的基类
    """
    def __init__(self, config):
        self.config = config
        self.generation_setting = {
            "max_length": 2048, "num_beams": 1, "do_sample": True,
            "top_p": 0.9, "top_k": 1, "temperature": 0.95,
            "repetition_penalty": 1.02
        }
        self.prompts = {"meta_prompt": None, "user_prompt": None, "bot_prompt": None}
    
    def load_tokenizer(self):
        raise NotImplementedError(
            "Every model should implement its own `load_tokenizer` method."
        )
        
    def load_model(self):
        raise NotImplementedError(
            "Every model should implement its own `load_model` method."
        )
        
    def get_generation_setting(self) -> Dict:
        """
        获取用于生成的配置参数
        """
        return self.generation_setting

    def set_generation_setting(self, new_setting: Dict):
        """
        用来更改默认的配置
        """
        self.generation_setting = new_setting
    
    def get_query_prompt(self, query):
        """
        Get different prompt for different model.

        :param query: list of dict
            [
                {"BOT": "hello"},
                {"HUMAN": "hello, bot"},
                ...
            ]
        :return: prompt string
        """
        raise NotImplementedError(
            "Every model should implement its own `prepost_generation` method."
        )
    
    def set_input_prompt(self, new_prompt):
        """
        更改模型的 input_sprompt
        """
        self.prompts = new_prompt
    
    def get_input_prompt(self):
        return self.prompts
    
    def get_query_tensor(self, prompt):
        raise NotImplementedError(  
        )
    
    def stream_generate(self, input_dict, gen_kwargs):
        """
        Generate a sentence from ``input_dict``

        :param input_dict: dict. It is from ``get_input``.
        :param gen_kwargs: dict. Parameters used for generating.
        :return:
        """
        raise NotImplementedError(
            "Every model should implemnt its own `generate` method."
        )
    
    def generate(self, input_dict, gen_kwargs):
        """
        Generate a sentence from ``input_dict``

        :param input_dict: dict. It is from ``get_input``.
        :param gen_kwargs: dict. Parameters used for generating.
        :return:
        """
        raise NotImplementedError(
            "Every model should implemnt its own `generate` method."
        )
    
    def get_response(self, output, input_dict):
        """
        Get models's response of the dialog.
        
        For example, drop the instruction and history of the output. 

        :param output: Output from ``generate``.
        :param input_dict: Input returned from ``get_input``.
        :return: str
        """
        raise NotImplementedError(
            "Every model should implement its own `get_response` method."
        )

    def process_response(self, response):
        """
        Post process, such as replace some
        special tokens.
        
        :param response: String decoded by tokenizer.
        :return: str. It will be passed to the frontend as the latest
            reply og the model
        """
        return response

    def chat(self, post):
        raise NotImplementedError()