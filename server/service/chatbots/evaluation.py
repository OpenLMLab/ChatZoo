import os
import json

from .base import ChatBotBase

def format_MD_Table_Prompt(inp:dict):
    md_text = ""
    md_content = ""
    md_title = "|prompt|"
    md_div = "|---|"
    for k, v in inp["origin_prediction"].items():
        if "gold" in k: continue
        if isinstance(v, dict):
            md_content += "|"+v["prompt"]+"|" + "\n"
    md_text = md_title + "\n" + md_div + "\n" + md_content
    print(md_text)
    return md_text

def foramt_MD_Table_Origin(inp: dict):
    md_text = ""
    md_content = ""
    md_title = "|列名|"
    md_div = "|---|"
    keyItems = None
    for key in inp["origin_prediction"].keys():
        if "gold" in key: continue
        keyItems = inp["origin_prediction"][key].keys()
        break
    for keyitem in keyItems:
        if "prompt" in keyitem: continue
        md_title += f"{keyitem}|"
        md_div += f"---|"
    md_title += "\n"
    md_div += "\n"
    for k,v in inp["origin_prediction"].items():
        if "gold" in k: continue
        if isinstance(v, dict):
            sub_text = f"|**{k}**|"
            for sub_k, sub_v in v.items():
                if "prompt" in sub_k: continue
                sub_text += f"**{sub_v}**|"
            md_content += sub_text + "\n"
    md_text = md_title + md_div + md_content
    print(md_text)
    return md_text

def format_MD_Table_Other(inp:dict):
    md_text = ""
    md_content = ""
    md_title = ""
    md_div = ""
    for k,v in inp.items():
        if "origin_prediction" in k: continue
        if len(md_title) == 0:
            md_title = f"|{k}|"
            md_div = "|---|"
            md_content = f"|{v}|"
        else:
            md_title += f"{k}|"
            md_div += f"---|"
            md_content += f"{v}|"
    md_text = md_title + "\n" + md_div + "\n" + md_content + "\n"
    print(md_text)
    return md_text

class EvaluationBOT(ChatBotBase):
    """用于evaluation数据的 chatbot
        1. 用于ppl数据集， 输出数据类型为 table
        2. 数据是取并集，如果没找对应的数据集就返回 None
    """
    def __init__(self, config):   
        super(EvaluationBOT, self).__init__(config)
        self.model = {}
        self.load_model()
    
    def load_model(self):
        file_names = os.listdir(self.config.tokenizer_path)
        for item in file_names:
            file_name = os.path.join(self.config.tokenizer_path, item)
            with open(file_name, "r", encoding="utf8") as fp:
                json_data = json.load(fp)
                self.model[item.replace(".json", "")] = json_data
    
    def get_overall_score(self, ds_name):
        new_dict = {key: value for key,value in self.model[ds_name].items() if key != "outputs"}
        return new_dict
    
    def get_ds_prompt(self, ds_name, idx):
        try:
            return format_MD_Table_Prompt(self.model[ds_name]["outputs"][str(idx)])
        except:
            # 不存在该数据集，返回None
            return None
    
    def get_ds_instance(self, ds_name, idx):
        try:
            response = foramt_MD_Table_Origin(self.model[ds_name]["outputs"][str(idx)]) + "\n表格2\n" +\
                format_MD_Table_Other(self.model[ds_name]["outputs"][str(idx)])
            prompt = "Prompt\n"+format_MD_Table_Prompt(self.model[ds_name]["outputs"][str(idx)])
            return {"prompt": prompt, "response": response, "exist": True}
        except:
            return {"prompt": None, "response": None, "exist": False}
        
        response_dict = self.model[ds_name]["outputs"][str(idx)]
        response = ""
        prompt = response_dict["prompt"]
        for key, value in response_dict.items():
            if "prompt" not in key:
                temp = f"{key}:\n{value}\n"
                response += temp
        return {"prompt": prompt, "response": response}
    
    def get_ds_chip(self, ds_name, start_idx, end_idx):
        ds_data = self.model[ds_name]["outputs"]
        rsp_list = []
        for idx in range(start_idx, end_idx):
            rsp_dict = {}
            response = ""
            response_dict = ds_data[str(idx)]
            rsp_dict["prompt"] = response_dict["prompt"]
            for key, value in response_dict.items():
                if "prompt" not in key:
                    temp = f"{key}:\n{value}\n"
                    response += temp
            rsp_dict["response"] = response
            rsp_list.append(rsp_dict)
        return rsp_list
            
    
    def get_ds_instance_num(self, ds_name):
        return {"number": len(self.model[ds_name]["outputs"])}
      
    def chat(self, post):
        """
        post 的格式为 {"prompt": str, "is_stream": bool, "params": dict, "query": dict}
        """
        print("Start generating...")
        try:
            idx = post["query_idx"]
            ds_name = post["ds_name"]
            response_dict = self.model[ds_name]["outputs"][idx]
            response = ""
            for key, value in response_dict.items():
                temp = f"{key} : {value}\n"
                response += temp
            yield response, True
        except Exception as e:
            response = None
            import traceback
            traceback.print_exc()