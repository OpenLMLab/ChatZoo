import torch
from transformers import LlamaForCausalLM
try:
    from peft import PeftModel
except:
    PeftModel = None

from .base import TransformersChatBotBase
from .utils import OVERLENGTH

class BaizeBOT(TransformersChatBotBase):
    def __init__(self, config):
        if PeftModel is None:
            raise ModuleNotFoundError(
                "To run Baize chat bot, package `peft` is required."
            )
        if config.base_model is None:
            raise ValueError(
                "Base model(llama)'s path of Baize should be set."
            )
        super(BaizeBOT, self).__init__(config)
        
        prompt = "The following is a conversation between a human and an " \
                 "AI assistant named Baize (named after a mythical creature " \
                 "in Chinese folklore). "
        prompt += "Baize is an open-source AI assistant developed by UCSD " \
                  "and Sun Yat-Sen University. The human and the AI " \
                  "assistant take turns chatting. Human statements start " \
                  "with [|Human|] and AI assistant statements start with " \
                  "[|AI|]. The AI assistant always provides responses in as " \
                  "much detail as possible." #, and in Markdown format. "
        prompt += "The AI assistant always declines to engage with topics, " \
                  "questions and instructions related to unethical, " \
                  "controversial, or sensitive issues. Complete the " \
                  "transcript in exactly that format.\n"
        self.set_input_prompt(prompt)

    @property
    def model_cls(self):
        return LlamaForCausalLM
    
    def default_settings(self):
        return {
            "max_length": 2048, "top_p": 0.9, "top_k": 1, "temperature": 0.95,
        }
    
    def get_query_prompt(self, query):
        """
        Get prompt of Baize.
        
        Reference to https://github.com/project-baize/baize-chatbot/blob/main/demo/
        """
    
        prompt = self.get_input_prompt()
        
        prompt_dict = {
            "HUMAN": "[|Human|]{}\n",
            "BOT": "[|AI|]{}\n",
        }
        for i, q in enumerate(query):
            prompt += prompt_dict[q["role"]].format(q["content"])
        prompt += "[|AI|]"
        
        return prompt
    
    def generate(self, input_dict, gen_kwargs):

        generated_tokens = []
        past_key_values = None
        input_ids = input_dict["input_ids"]
        if input_ids.shape[1] > gen_kwargs["max_length"]:
            return None
        stop_words=["[|Human|]", "[|AI|]"]
        for i in range(gen_kwargs["max_length"]):
            with torch.no_grad():
                if past_key_values is None:
                    outputs = self.model(input_ids)
                else:
                    outputs = self.model(
                        input_ids[:, -1:], past_key_values=past_key_values
                    )
                logits = outputs.logits[:, -1, :]
                past_key_values = outputs.past_key_values

            # apply temperature
            logits /= gen_kwargs["temperature"]

            probs = torch.softmax(logits, dim=-1)
            # apply top_p
            probs_sort, probs_idx = torch.sort(probs, dim=-1, descending=True)
            probs_sum = torch.cumsum(probs_sort, dim=-1)
            mask = probs_sum - probs_sort > gen_kwargs["top_p"]
            probs_sort[mask] = 0.0

            # apply top_k
            probs_sort1, _ = torch.topk(probs_sort, gen_kwargs["top_k"])
            min_top_probs_sort = torch.min(probs_sort1, dim=-1, keepdim=True).values
            probs_sort = torch.where(probs_sort < min_top_probs_sort, torch.full_like(probs_sort, float(0.0)), probs_sort)

            probs_sort.div_(probs_sort.sum(dim=-1, keepdim=True))
            next_token = torch.multinomial(probs_sort, num_samples=1)
            next_token = torch.gather(probs_idx, -1, next_token)

            input_ids = torch.cat((input_ids, next_token), dim=-1)

            generated_tokens.append(next_token[0].item())
            text = self.tokenizer.decode(generated_tokens)

            if any([x in text for x in stop_words]):
                return generated_tokens
            
        return generated_tokens
    
    def get_response(self, output, input_dict):
        return self.tokenizer.decode(output)
    
    def process_response(self, response):
        if "[|Human|]" in response:
            response = response[: response.index("[|Human|]")].strip()
        if "[|AI|]" in response:
            response = response[: response.index("[|AI|]")].strip()
        return response.strip(" ")

    def load_model(self):
        
        llama = self.model_cls.from_pretrained(
            self.config.base_model, device_map="auto",
            torch_dtype=self.config.dtype
        )
        self.model = PeftModel.from_pretrained(
            llama, self.model_name, device_map="auto"
        )
        self.model.to(self.config.dtype)

    def load_from_s3(self):
        prefix = f"hdd:s3://opennlplab_hdd/models/{self.config.base_model}/"
        import io
        import json
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

        self.model = PeftModel.from_pretrained(
            llama, self.model_name, device_map="auto"
        )
        self.model.to(self.config.dtype)
