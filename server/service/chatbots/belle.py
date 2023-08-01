import torch
from transformers import BloomForCausalLM

from .base import TransformersChatBotBase

class BELLEBOT(TransformersChatBotBase):
    def __init__(self, config):
        super(BELLEBOT, self).__init__(config)

    @property
    def model_cls(self):
        return BloomForCausalLM
    
    @property
    def no_split_module_classes(self):
        return ["BloomBlock"]
    
    def get_query_prompt(self, query):
        """
        Get prompt for BELLE

        Human:{input}\\n\\nAssistant:{output}
        """
        prompt_dict = {
            "BOT": "\nAssistant: {}\n",
            "HUMAN": "Human: {}\n",
        }
        prompt = ""
        for i, q in enumerate(query):
            prompt += prompt_dict[q["role"]].format(q["content"])
        prompt += "Assistant: "

        return prompt
    
    def load_from_s3(self):
        """
        Load weights from hdd:s3
        """
        prefix = f"hdd:s3://opennlplab_hdd/models/{self.model_name}/"
        import io
        import json
        from petrel_client.client import Client
        from accelerate import init_empty_weights
        from transformers import AutoConfig
        from .utils import load_checkpoint_and_dispatch_from_s3
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

            load_checkpoint_and_dispatch_from_s3(
                self.model.transformer, model_list, device_map="auto",
                no_split_module_classes=self.no_split_module_classes,
                dtype=self.config.dtype
            )
        else:
            self.model = self.model_cls._from_config(
                config=config, torch_dtype=self.config.dtype
            )
            load_checkpoint_and_dispatch_from_s3(
                self.model.transformer, model_list, device_map=None,
                no_split_module_classes=self.no_split_module_classes,
                dtype=self.config.dtype
            )
        # initialize lm_head
        self.model.tie_weights()
