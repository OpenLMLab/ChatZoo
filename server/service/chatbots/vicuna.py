from transformers import LlamaForCausalLM

from .fastchat import FastChatBOT

class VicunaBOT(FastChatBOT):
    """
    Vicuna ChatBOT.
    
    If `config.base_model` is not None, then we will merge it with
    `config.pretrained_path`. Otherwise we will load `pretrained_path`
    directly
    """
    def __init__(self, config):
        super(VicunaBOT, self).__init__(config)
        prompt = "A chat between a curious user and an artificial " \
                 "intelligence assistant. " \
                 "The assistant gives helpful, detailed, and polite " \
                 "answers to the user's questions. "
        self.set_input_prompt(prompt)

    @property
    def model_cls(self):
        return LlamaForCausalLM
    
    def get_query_prompt(self, query):
        prompt = self.get_input_prompt()
        prompt_dict = {
            "BOT": "ASSISTANT: {}",
            "HUMAN": "USER: {}"
        }
        seps = [" ", "</s>"]
        for i, q in enumerate(query):
            prompt += prompt_dict[q["role"]].format(q["content"])
            prompt += seps[i % 2]
        prompt += "ASSISTANT:"

        return prompt
    
    @property
    def no_split_module_classes(self):
        return ["LlamaDecoderLayer"]
    
    def load_model(self):
        super().load_model()
        if self.config.base_model is not None:
            # merge
            base = LlamaForCausalLM.from_pretrained(
                self.config.base_model, torch_dtype=self.config.dtype,
                device_map="auto"
            )
            for name, param in self.model.state_dict().items():
                assert name in base.state_dict()
                param.data += base.state_dict()[name].to(param)
    
    def load_from_s3(self):
        super().load_from_s3()
        if self.config.base_model is None:
            return
        # merge
        # download llama form s3
        prefix = f"hdd:s3://opennlplab_hdd/models/{self.config.base_model}/"
        import io
        import json
        import torch
        from petrel_client.client import Client
        from accelerate import init_empty_weights
        from transformers import LlamaConfig
        from .utils import load_checkpoint_and_dispatch_from_s3
        client = Client()

        # get config
        buffer = io.BytesIO()
        buffer.write(client.get(f"{prefix}config.json"))
        buffer.seek(0)
        config = LlamaConfig.from_dict(json.load(buffer))
        # model checkpoints
        model_list = [f"{prefix}{weight}" for weight in client.list(prefix) 
                      if weight.endswith(".bin")]
        
        if torch.cuda.device_count() >= 1:
            with init_empty_weights():
                llama = self.model_cls._from_config(
                    config=config, torch_dtype=self.config.dtype
                )
            load_checkpoint_and_dispatch_from_s3(
                llama, model_list, device_map="auto",
                no_split_module_classes=self.no_split_module_classes,
                dtype=self.config.dtype
            )
        else:
            llama = self.model_cls._from_config(
                config=config, torch_dtype=self.config.dtype
            )
            load_checkpoint_and_dispatch_from_s3(
                llama, model_list, device_map=None,
                no_split_module_classes=self.no_split_module_classes,
                dtype=self.config.dtype
            )

        for name, param in self.model.state_dict().items():
            assert name in llama.state_dict()
            param.data += llama.state_dict()[name].to(param)
