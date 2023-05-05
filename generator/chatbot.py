import traceback

class ChatBOT:
    """
    Parent class of all ChatBOT.
    """
    def __init__(self, config):
        self.config = config
        self.model_name = config.pretrained_path
        self.load_tokenizer()
        if config.from_s3:
            self.load_from_s3()
        else:
            self.load_model()

    def load_tokenizer(self):
        raise NotImplementedError(
            "Every model should implement its own `load_tokenizer` method."
        )

    def default_settings(self):
        """
        Parameters for generation such as ``top_k``, ``top+p``.

        :return: dict. The website will set different components according to
            this dict.
        """
        return {}
    
    def extra_settings(self):
        """
        Extra settings for generation such as ``eos_token_id``.

        :return: dict. It will be passed to ``generate`` together with
            ``gen_kwargs``.
        """
        return {}

    def chat(self, post):
        """

        :param post: dict
            {
                "query": [
                    {"role": "BOT", "content": "hello"}
                    {"role": "HUMAN", "content": "hello, bot"},
                    ...
                ],
                "params": {
                    "top_p": 0.9,
                    "top_k": 1,
                    ...
                }
            }
        """
        print("Start generating...")
        try:
            query = post["query"]
            gen_kwargs = self.default_settings()
            gen_kwargs.update(post["params"])
            gen_kwargs.update(self.extra_settings())
            gen_kwargs.update(self.extra_settings())
            prompt = self.get_prompt(query)
            input_dict = self.get_input(prompt)
            output = self.generate(input_dict, gen_kwargs)
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
    
    def load_model(self):
        raise NotImplementedError(
            "Every model should implement its own `load_model` method."
        )
