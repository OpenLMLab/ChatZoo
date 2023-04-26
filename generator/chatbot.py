import torch
from transformers import AutoTokenizer, AutoConfig
from accelerate import init_empty_weights

from .utils import load_checkpoint_and_dispatch

class ChatBOT:
    """
    ChatBOT for ``transformers`` models.
    """
    def __init__(self, config):
        self.config = config
        self.model_name = config.pretrained_path
        self.tokenizer = AutoTokenizer.from_pretrained(config.tokenizer_path, trust_remote_code=True)
        # TODO 
        # self.model = self.model_cls.from_pretrianed(model_name, trust_remote_code=True)
        self.load_from_s3()

        self.gen_kwargs = {
            "max_length": config.max_length, "num_beams": config.num_beams,
            "do_sample": config.do_sample, "top_p": config.top_p,
            "top_k": config.top_k, "temperature": config.temperature,
            "repetition_penalty": config.repetition_penalty
        }

    @property
    def model_cls(self):
        raise NotImplementedError(
            "Every model should set its own model class."
        )

    def chat(self, query):
        """

        :param query: list of dict
            [
                {"BOT": "hello"},
                {"HUMAN": "hello, bot"},
                ...
            ]
        """
        prompt = self.get_prompt(query)
        input_dict = self.tokenizer(prompt, return_tensors="pt")
        for key, value in input_dict.items():
            try:
                input_dict[key] = value.cuda()
            except AttributeError:
                pass
        output = self.model.generate(**input_dict, **self.gen_kwargs)
        response = output.tolist()[0][len(input_dict["input_ids"][0]):]
        response = self.tokenizer.decode(response, skip_special_tokens=True)
        response = self.process_response(response)
        query.append({"BOT": response})

        return query
    
    def process_response(self, response):
        """
        Post process
        """
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
        """
        raise NotImplementedError(
            "Every model should implement its own `get_prompt` method."
        )

    def load_from_s3(self):
        """
        Load weights from hdd:s3
        """
        prefix = f"hdd:s3://opennlplab_hdd/models/{self.model_name}/"
        import io
        import json
        from petrel_client.client import Client
        from tqdm import tqdm
        client = Client()
        
        # get config
        config = AutoConfig.from_pretrained(
            self.model_name, trust_remote_code=True)
        with init_empty_weights():
            self.model = self.model_cls._from_config(
                config=config, torch_dtype=torch.float16
            )
        # get model_index
        model_list = []
        if client.contains(f"{prefix}pytorch_model.bin.index.json"):
            buffer = io.BytesIO()
            buffer.write(client.get(f"{prefix}pytorch_model.bin.index.json"))
            buffer.seek(0)
            model_index = json.load(buffer)
            buffer.close()
            for weight, filename in model_index["weight_map"].items():
                filepath = f"{prefix}{filename}"
                if filepath not in model_list:
                    model_list.append(filepath)
        else:
            model_list.append(f"{prefix}pytorch_model.bin")

        load_checkpoint_and_dispatch(
            self.model, model_list, device_map="auto",
            no_split_module_classes=self.no_split_module_classes,
            dtype=self.config.dtype
        )

    @property
    def no_split_module_classes(self):
        return []