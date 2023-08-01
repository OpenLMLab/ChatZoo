from transformers import T5ForConditionalGeneration

from .base import TransformersChatBotBase

class GODELBOT(TransformersChatBotBase):
    def __init__(self, config):
        super(GODELBOT, self).__init__(config)

    @property
    def model_cls(self):
        return T5ForConditionalGeneration
    
    def get_query_prompt(self, query):
        """
        Get prompt for GODEL.

        Instruction: ... [CONTEXT] ... [DIALOG] .. ([KNOWLEDGE] ...)

        :param query: list of dict
            [
                {"role": "BOT", "content": "hello"}
                {"role": "HUMAN", "content": "hello, bot"},
                ...
            ]
        """
        # TODO: set instructions by user
        instruction = "Instruction: given a dialog context, you need to response empathically."
        # TODO: Knowledge
        # knowledge = '[KNOWLEDGE] ' + knowledge
        dialog = []
        for q in query:
            dialog.append(q["content"])
        dialog_prompt = " EOS ".join(dialog)
        # f"{instruction} [CONTEXT] {dialog_prompt} {knowledge}"
        prompt = f"{instruction} [CONTEXT] {dialog_prompt}"
        return prompt
    
    def get_response(self, output, input_dict):
        response = output.tolist()[0]
        response = self.tokenizer.decode(response, skip_special_tokens=True)
        return response
    
    def process_response(self, response):
        """
        response: <pad> ... </s>
        """
        response = response.replace("<pad>", "")
        response = response.replace("</s>", "")
        return response.strip()
    
    @property
    def no_split_module_classes(self):
        return ["T5Block"]
