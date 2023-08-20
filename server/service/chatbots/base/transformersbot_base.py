import torch
from transformers import AutoTokenizer, AutoConfig, AutoModel, AutoModelForCausalLM
from transformers.models.auto.modeling_auto import _BaseAutoModelClass
from transformers.generation.streamers import TextIteratorStreamer
from threading import Thread
from .chatbot_base import ChatBotBase


class TransformersChatBotBase(ChatBotBase):
    def __init__(self, config):
        super().__init__(config)
        self.load_tokenizer()
        if config.from_s3:
            self.load_model_from_s3()
        else:
            self.load_model()
    
    @property
    def model_cls(self):
        return AutoModelForCausalLM
        raise NotImplementedError(
            "Every model should set its own model class."
        )
    
    def get_generation_setting(self):
        return self.generation_setting

    def load_tokenizer(self):
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.config.tokenizer_path, trust_remote_code=True)
    
    def load_model(self):
        # mute warning
        trust_remote_code = issubclass(
            self.model_cls, _BaseAutoModelClass
        )
        self.model = self.model_cls.from_pretrained(
            self.config.pretrained_path, torch_dtype=self.config.dtype,
            device_map="auto", trust_remote_code=trust_remote_code
        )
    
    def load_model_from_s3(self):
        """for testing"""
        prefix = f"hdd:s3://opennlplab_hdd/models/{self.config.pretrained_path}/"
        print(prefix)
        import io
        import json
        from petrel_client.client import Client
        from accelerate import init_empty_weights
        from ..utils import load_checkpoint_and_dispatch_from_s3, no_proxy
        
        # get config
        config = AutoConfig.from_pretrained(
            self.config.pretrained_path, trust_remote_code=True)
        with no_proxy():
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
            
        if torch.cuda.device_count() >= 1:
            with init_empty_weights():
                self.model = self.model_cls._from_config(
                    config=config, torch_dtype=self.config.dtype
                )
            with no_proxy():
                load_checkpoint_and_dispatch_from_s3(
                    self.model, model_list, device_map="auto",
                    no_split_module_classes=self.no_split_module_classes,
                    dtype=self.config.dtype
                )
        else:
            self.model = self.model_cls._from_config(
                config=config, torch_dtype=self.config.dtype
            )
            with no_proxy():
                load_checkpoint_and_dispatch_from_s3(
                    self.model, model_list, device_map=None,
                    no_split_module_classes=self.no_split_module_classes,
                    dtype=self.config.dtype
                )
    
    def get_query_tensor(self, prompt):
        """
        Get input dict of model.generate.

        :param prompt: str. The prompt string.
        :return: dict. Later it will be passed to ``model.generate``.
        """
        input_dict = self.tokenizer(prompt, return_tensors="pt")
        for key, value in input_dict.items():
            try:
                if torch.cuda.device_count() >= 1:
                    input_dict[key] = value.cuda()
            except AttributeError:
                pass

        return input_dict
    
    def get_query_prompt(self, query):
        meta_prompt = self.prompts['meta_prompt']
        bot_prompt = self.prompts['bot_prompt']
        user_prompt = self.prompts['user_prompt']
        query_prompt = meta_prompt
        for q in query:
            if q['role'] == 'BOT':
                query_prompt = query_prompt + bot_prompt.format(q['content'])
            
            if q['role'] == 'HUMAN':
                query_prompt = query_prompt + user_prompt.format(q['content'])
        query_prompt += bot_prompt.split("{}")[0]
        return query_prompt
    
    def generate(self, input_dict, gen_kwargs):
        return self.model.generate(**input_dict, **gen_kwargs)
    
    def stream_generate(self, input_dict, gen_kwargs):
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True)
        generation_kwargs = dict(input_dict, streamer=streamer, **gen_kwargs)
        thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
        thread.start()
        return streamer
    
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

    def chat(self, post):
        """
        post 的格式为 {"prompt": str, "is_stream": bool, "params": dict, "query": dict}
        """
        print("Start generating...")
        try:
            is_stream = False
            cur_length = 0
            if "prompt" in post:
                self.set_input_prompt(post.pop("prompt"))
            if "is_stream" in post:
                is_stream = post.pop("is_stream")
            query = post["query"]
            gen_kwargs = self.get_generation_setting()
            gen_kwargs.update(post["params"])
            prompt = self.get_query_prompt(query)
            input_dict = self.get_query_tensor(prompt)
            cur_length = input_dict["input_ids"].shape[1]
            if is_stream:
                response = ''
                streamer = self.stream_generate(input_dict, gen_kwargs)
                for output in streamer:
                    response += output
                    cur_length += 1
                    response = self.process_response(response)
                    if cur_length >= self.get_generation_setting()["max_length"]:
                        yield response, True
                    else:
                        yield response, False
            else:
                output = self.generate(input_dict, gen_kwargs)
                response = self.get_response(output, input_dict)
                response = self.process_response(response)
                if output.shape[1] >= self.get_generation_setting()["max_length"]:
                    yield response, True
                else:
                    yield response, False
        except Exception as e:
            response = None
            import traceback
            traceback.print_exc()