import traceback

from .utils import find_free_network_port

class ChatBOT:
    """
    Parent class of all ChatBOT.
    """
    def __init__(self, config):
        self.config = config
        self.port = find_free_network_port()
        self.model_name = config.pretrained_path
        self.load_tokenizer()
        if config.from_s3:
            self.load_from_s3()
        else:
            self.load_model()
        self.set_generate_params()

    def load_tokenizer(self):
        raise NotImplementedError(
            "Every model should implement its own `load_tokenizer` method."
        )

    def set_generate_params(self):

        self.gen_kwargs = {
            "max_length": self.config.max_length,
            "num_beams": self.config.num_beams,
            "do_sample": self.config.do_sample, "top_p": self.config.top_p,
            "top_k": self.config.top_k, "temperature": self.config.temperature,
            "repetition_penalty": self.config.repetition_penalty
        }

    @property
    def model_cls(self):
        raise NotImplementedError(
            "Every model should set its own model class."
        )
    
    def generate(self, input_dict):
        """
        Generate a sentence from ``input_dict``

        :param input_dict: dict. It is from ``get_input``.
        :return:
        """
        raise NotImplementedError(
            "Every model should implemnt its own `generate` method."
        )

    def chat(self, query):
        """

        :param query: list of dict
            [
                {"role": "BOT", "content": "hello"}
                {"role": "HUMAN", "content": "hello, bot"},
                ...
            ]
        """
        print("Start generating...")
        try:
            prompt = self.get_prompt(query)
            input_dict = self.get_input(prompt)
            output = self.generate(input_dict)
            response = self.get_response(output, input_dict)
            response = self.process_response(response)
        except Exception as e:
            response = None
            traceback.print_exc()
    
        return response
    
    def get_prompt(self, query):
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
            "Every model should implement its own `get_prompt` method."
        )

    def get_input(self, prompt):
        """
        Get input dict of model.generate.

        :param prompt: str. The prompt string.
        :return: dict. Later it will be passed to ``model.generate``.
        """
        raise NotImplementedError(
            "Every model should implement its own `get_input` method."
        )
    
    def get_response(self, output, input_dict):
        """
        Get models's response of the dialog.
        
        For example, drop the instruction and history of the output. 

        :param output: Output from ``model.generate``.
        :param input_dict: Input returned from ``get_input``.
        :return: str
        """
        raise NotImplementedError(
            "Every model should implement its own `get_response` method."
        )

    def process_response(self, response):
        """
        Post process, such as decode response to string.
        
        :param response: String decoded by tokenizer.
        :return: str. It will be passed to the frontend as the latest
            reply og the model
        """
<<<<<<< HEAD
        raise NotImplementedError(
            "Every model should implement its own `process_response` method."
        )
=======
        return response
>>>>>>> 69f15275c519f57c499567b12bc0ce9a7598d102
    
    def load_model(self):
        raise NotImplementedError(
            "Every model should implement its own `load_model` method."
        )
