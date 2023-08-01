import gc

import torch
from transformers import T5ForConditionalGeneration

from .base import TransformersChatBotBase

class FastChatBOT(TransformersChatBotBase):
    """
    Parent class for FastChat(https://github.com/lm-sys/FastChat)
    """
    def __init__(self, config):
        super(FastChatBOT, self).__init__(config)
        self.stop_str = None
        self.stop_token_ids = []
        self.decoder_start_token_id = 0

    def default_settings(self):
        return {
            "temperature": 1.0, "max_new_tokens": 256, "context_len": 2048,
        }
    
    def extra_settings(self):
        # stop_str: ###
        return {
            "stop_str": self.stop_str, "stop_token_ids": self.stop_token_ids,
            "decoder_start_token_id": self.decoder_start_token_id
        }
    
    def generate(self, input_dict, gen_kwargs):
        stream_interval = 2
        context_len = gen_kwargs["context_len"]
        temperature = gen_kwargs["temperature"]
        max_new_tokens = gen_kwargs["max_new_tokens"]
        stop_str = gen_kwargs["stop_str"]
        stop_token_ids = gen_kwargs["stop_token_ids"]
        stop_token_ids.append(self.tokenizer.eos_token_id)
        decoder_start_token_id = gen_kwargs["decoder_start_token_id"]

        input_ids = input_dict["input_ids"]
        input_echo_len = len(input_ids)
        output_ids = list(input_ids)
        if torch.cuda.device_count() >= 1:
            device = torch.cuda.current_device()
        else:
            device = "cpu"

        if self.model.config.is_encoder_decoder:
            max_src_len = context_len
        else:
            max_src_len = context_len - max_new_tokens - 8
        if input_echo_len >= max_src_len:
            return None
        input_ids = input_ids[:, -max_src_len:]

        if self.model.config.is_encoder_decoder:
            encoder_output = self.model.encoder(input_ids=input_ids)[0]
            start_ids = torch.as_tensor(
                [[decoder_start_token_id]], dtype=torch.int64, device=device
            )

        for i in range(max_new_tokens):
            if i == 0:
                if self.model.config.is_encoder_decoder:
                    out = self.model.decoder(input_ids=start_ids,
                                        encoder_hidden_states=encoder_output,
                                        use_cache=True)
                    logits = self.model.lm_head(out[0])
                else:
                    out = self.model(input_ids, use_cache=True)
                    logits = out.logits
                past_key_values = out.past_key_values
            else:
                if self.model.config.is_encoder_decoder:
                    out = self.model.decoder(
                        input_ids=torch.as_tensor([[token]], device=device),
                        encoder_hidden_states=encoder_output, use_cache=True,
                        past_key_values=past_key_values
                    )

                    logits = self.model.lm_head(out[0])
                else:
                    out = self.model(
                        input_ids=torch.as_tensor([[token]], device=device),
                        use_cache=True, past_key_values=past_key_values,
                    )
                    logits = out.logits
                past_key_values = out.past_key_values

            last_token_logits = logits[0][-1]

            if temperature < 1e-4:
                token = int(torch.argmax(last_token_logits))
            else:
                probs = torch.softmax(last_token_logits / temperature, dim=-1)
                token = int(torch.multinomial(probs, num_samples=1))

            output_ids.append(token)

            if token in stop_token_ids:
                stopped = True
            else:
                stopped = False

            if i % stream_interval == 0 or i == max_new_tokens - 1 or stopped:
                tmp_output_ids = output_ids[input_echo_len:]

                output = self.tokenizer.decode(
                    tmp_output_ids, skip_special_tokens=True,
                    spaces_between_special_tokens=False
                )
                if stop_str:
                    pos = output.rfind(stop_str, 0)
                    if pos != -1:
                        output = output[:pos]
                        stopped = True
                yield output

            if stopped:
                break

        del past_key_values, out
        gc.collect()
        torch.cuda.empty_cache()
        # TODO
        return output
    
    def get_response(self, output, input_dict):
        return output
