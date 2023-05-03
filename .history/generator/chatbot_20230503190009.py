import os
import traceback

import torch
from transformers import AutoTokenizer, AutoConfig
from accelerate import init_empty_weights #, load_checkpoint_and_dispatch
from .utils import find_free_network_port, load_checkpoint_and_dispatch

class ChatBOT:
    """
    ChatBOT for ``transformers`` models.
    """
    def __init__(self, config):
        self.config = config
        self.port = find_free_network_port()
        self.model_name = config.pretrained_path
        self.tokenizer = AutoTokenizer.from_pretrained(config.tokenizer_path, trust_remote_code=True)
        # TODO 
        # self.load_model()
        self.load_from_s3()
        self.set_generate_params()

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
            for key, value in input_dict.items():
                try:
                    if torch.cuda.device_count() >= 1:
                        input_dict[key] = value.cuda()
                except AttributeError:
                    pass

            output = self.model.generate(**input_dict, **self.gen_kwargs)
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
        return self.tokenizer(prompt, return_tensors="pt")
    
    def get_response(self, output, input_dict):
        """
        Get models's response of the dialog.
        
        For example, drop the instruction and history of the output. 

        :param output: Output from ``model.generate``.
        :param input_dict: Input returned from ``get_input``.
        :return: str
        """
        response = output.tolist()[0][len(input_dict["input_ids"][0]):]
        response = self.tokenizer.decode(response, skip_special_tokens=True)
        return response

    def process_response(self, response):
        """
        Post process, such as decode response to string.
        
        :param response: String decoded by tokenizer.
        :return: str. It will be passed to the frontend as the latest
            reply og the model
        """
        return response
    
    def load_model(self):
        config = AutoConfig.from_pretrained(
            self.model_name, trust_remote_code=True)
        
        if torch.cuda.device_count() >= 1:
            with init_empty_weights():
                self.model = self.model_cls._from_config(
                    config=config, torch_dtype=torch.float16
                )

            load_checkpoint_and_dispatch(
                self.model, self.config.pretrained_path, device_map="auto",
                no_split_module_classes=self.no_split_module_classes,
                dtype=self.config.dtype
            )
        else:
            self.model = self.model_cls._from_config(
                config=config, torch_dtype=self.config.dtype
            )
            load_checkpoint_and_dispatch(
                self.model, self.config.pretrained_path, device_map=None,
                no_split_module_classes=self.no_split_module_classes,
                dtype=self.config.dtype
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

        # get config
        config = AutoConfig.from_pretrained(
            self.model_name, trust_remote_code=True)
        
        if torch.cuda.device_count() >= 1:
            with init_empty_weights():
                self.model = self.model_cls._from_config(
                    config=config, torch_dtype=self.config.dtype
                )
            load_checkpoint_and_dispatch(
                self.model, model_list, device_map="auto",
                no_split_module_classes=self.no_split_module_classes,
                dtype=self.config.dtype
            )
        else:
            self.model = self.model_cls._from_config(
                config=config, torch_dtype=self.config.dtype
            )
            load_checkpoint_and_dispatch(
                self.model, model_list, device_map=None,
                no_split_module_classes=self.no_split_module_classes,
                dtype=self.config.dtype
            )

    @property
    def no_split_module_classes(self):
        return []