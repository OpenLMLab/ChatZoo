import os
import re
import json
import difflib

from .base import ChatBotBase


def find_diff_substrings(inp: dict):
    matcher = difflib.SequenceMatcher(
        None,
    )


def format_MD_Table_Prompt(inp: dict):
    md_text = ""
    md_content = ""
    md_title = "|**列名**|**prompt**|"
    md_div = "|---|---|"
    new_prompt = "<strong>Prompt:</strong>\n```\n{}\n```"
    # new_prompt = "<strong>Prompt:</strong>\n\n{}\n"
    for k, v in inp["origin_prediction"].items():
        if "gold" in k:
            continue
        new_prompt = new_prompt.format(v["prompt"])
        return new_prompt
        if isinstance(v, dict):
            prompt = replace_newline_to_br(v["prompt"], "\r\n", "<br>")
            prompt = replace_newline_to_br(prompt)
            prompt = replace_white_space_to_md(prompt)
            md_content += "|" + k + "|" + prompt + "|" + "\n"
            md_text += md_title + "\n" + md_div + "\n" + md_content + "\n"
            md_content = ""
            md_title = "|**列名**|**prompt**|"
            md_div = "|---|---|"
    return md_text


def foramt_MD_Table_Origin(inp: dict):
    md_text = ""
    md_content = ""
    md_title = "|选项|"
    md_div = "|:-:|"
    keyItems = None
    for key in inp["origin_prediction"].keys():
        if "gold" in key:
            continue
        keyItems = inp["origin_prediction"][key].keys()
        break
    for keyitem in keyItems:
        if "prompt" in keyitem:
            continue
        md_title += f"**{keyitem}**|"
        md_div += f":-:|"
    md_title += "\n"
    md_div += "\n"
    min_ppl = 10000
    min_key = None
    for k, v in inp["origin_prediction"].items():
        if "gold" in k:
            continue
        if isinstance(v, dict):
            if min_ppl > v["PPL"]:
                min_ppl = v["PPL"]
                min_key = k

    for k, v in inp["origin_prediction"].items():
        if "gold" in k:
            continue
        if isinstance(v, dict):
            sub_text = f"|{k}|"
            for sub_k, sub_v in v.items():
                if "prompt" in sub_k:
                    continue
                if isinstance(sub_v, str):
                    sub_v = replace_newline_to_br(sub_v, "\r\n")
                    sub_v = replace_newline_to_br(sub_v)
                elif isinstance(sub_v, float):
                    sub_v = round(sub_v, 6)
                if min_key == k:
                    sub_text += (
                        f"<font color='red' style='font-weight: 700' >{sub_v}</font>|"
                    )
                else:
                    sub_text += f"{sub_v}|"
                # sub_text += f"<font color='red'>{sub_v}</font>|"
            md_content += sub_text + "\n"
    md_text = md_title + md_div + md_content
    return md_text


def format_MD_Table_Other(inp: dict):
    md_text = ""
    md_content = ""
    md_title = ""
    md_div = ""
    for k, v in inp.items():
        if "origin_prediction" in k:
            continue
        if isinstance(v, str):
            v = replace_newline_to_br(v, "\r\n")
            v = replace_newline_to_br(v)
        if k == "right":
            v = f"<font color='red' style='font-weight: 900' >{v}</font>"
        if len(md_title) == 0:
            md_title = f"|**{k}**|"
            md_div = "|:-:|"
            md_content = f"|{v}|"
        else:
            md_title += f"**{k}**|"
            md_div += f":-:|"
            md_content += f"{v}|"
    md_text = md_title + "\n" + md_div + "\n" + md_content + "\n"
    print(md_text)
    return md_text


def replace_newline_to_br(text: str, replace_str="\n", new_str="<br>"):
    return text.replace(replace_str, new_str)


def foramt_MD_Table_Origin_GEN(inp: dict):
    md_title = "|**origin_prediction**|\n"
    md_div = "|---|\n"
    prompt = replace_newline_to_br(inp["origin_prediction"], "\r\n")
    prompt = replace_newline_to_br(prompt)
    prompt = replace_white_space_to_md(prompt)
    md_text = md_title + md_div + prompt
    return md_text


def format_MD_Table_Other_GEN(inp: dict):
    md_text = ""
    md_content = ""
    md_title = ""
    md_div = ""
    for k, v in inp.items():
        if "origin_prediction" in k:
            continue
        if "prompt" in k:
            continue
        if isinstance(v, str):
            v = replace_newline_to_br(v, "\r\n")
            v = replace_newline_to_br(v)
            v = replace_white_space_to_md(v)
        if len(md_title) == 0:
            md_title = f"|**{k}**|"
            md_div = "|---|"
            md_content = f"|{v}|"
        else:
            md_title += f"**{k}**|"
            md_div += f"---|"
            md_content += f"{v}|"
    md_text = md_title + "\n" + md_div + "\n" + md_content + "\n"
    return md_text


def format_MD_Table_Prompt_GEN(inp: dict):
    md_title = "|**prompt**|\n"
    md_div = "|---|\n"
    prompt = replace_newline_to_br(inp["prompt"], "\r\n")
    prompt = replace_newline_to_br(prompt)
    prompt = replace_white_space_to_md(prompt)
    # prompt = "|<pre>" + inp["prompt"] + "</pre>"
    md_text = md_title + md_div + prompt
    return md_text


def replace_white_space_to_md(text, replace_str="\s{2,}", new_str="&nbsp;"):
    matches = list(re.finditer(replace_str, text))

    # 获取空格符的起始位置和结束位置
    spaces = [(match.start(), match.end()) for match in matches]

    # 替换空格符为相应数量的&nbsp;
    merged_string = text
    for start, end in reversed(spaces):
        space_count = end - start
        nbsp = new_str * space_count
        merged_string = merged_string[:start] + nbsp + merged_string[end:]

    return merged_string


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

    def get_overall_score(self, ds_name: str):
        new_dict = {
            key: value for key, value in self.model[ds_name].items() if key != "outputs"
        }
        return new_dict

    def get_ds_prompt(self, ds_name, idx):
        try:
            if self.model[ds_name]["type"] == "PPL":
                return format_MD_Table_Prompt(self.model[ds_name]["outputs"][str(idx)])
            elif self.model[ds_name]["type"] == "GEN":
                return format_MD_Table_Prompt_GEN(
                    self.model[ds_name]["outputs"][str(idx)]
                )
        except:
            # 不存在该数据集，返回None
            return None

    def get_ds_instance(self, ds_name, idx):
        try:
            if self.model[ds_name]["type"] == "PPL":
                response = (
                    foramt_MD_Table_Origin(self.model[ds_name]["outputs"][str(idx)])
                    + "\n"
                    + format_MD_Table_Other(self.model[ds_name]["outputs"][str(idx)])
                )
                prompt = format_MD_Table_Prompt(
                    self.model[ds_name]["outputs"][str(idx)]
                )
                return {"prompt": prompt, "response": response, "exist": True}
            elif self.model[ds_name]["type"] == "GEN":
                origin_prediction = self.model[ds_name]["outputs"][str(idx)][
                    "origin_prediction"
                ]
                # origin_prediction = replace_newline_to_br(origin_prediction, "\r\n")
                # origin_prediction = replace_newline_to_br(origin_prediction)
                # origin_prediction = replace_white_space_to_md(origin_prediction)
                # origin_prediction = (
                #     f"|**origin_prediction**|\n|---|\n|{origin_prediction}|\n"
                # )
                origin_prediction = (
                    "<strong>1. Origin Prediction:</strong>\n```\n"
                    + origin_prediction.strip().strip("\n")
                    + "\n```\n\n"
                )

                prediction = (
                    "<strong>2. Predictions:</strong>\n```\n"
                    + self.model[ds_name]["outputs"][str(idx)]["predictions"]
                    .strip()
                    .strip("\n")
                    + "\n```\n\n"
                )
                ref = self.model[ds_name]["outputs"][str(idx)]["references"]
                if isinstance(ref, list):
                    new_ref = "[{}]"
                    content = ", ".join(list(map(lambda x: str(x), ref)))
                    ref = new_ref.format(content)

                ref = (
                    "<strong>3. References:</strong>\n```\n"
                    + ref.strip().strip("\n")
                    + "\n```\n\n"
                )
                ans = (
                    "<strong>4. Answer:</strong>\n ```\n"
                    + str(self.model[ds_name]["outputs"][str(idx)]["right"])
                    .strip()
                    .strip("\n")
                    + "\n```\n"
                )
                response = (
                    origin_prediction + "\n" + prediction + "\n" + ref + "\n" + ans
                )
                # response = (
                #     origin_prediction
                #     + "\n"
                #     + format_MD_Table_Other_GEN(
                #         self.model[ds_name]["outputs"][str(idx)]
                #     )
                # )
                # prompt = format_MD_Table_Prompt_GEN(
                #     self.model[ds_name]["outputs"][str(idx)]
                # )
                prompt = (
                    "Prompt: \n```\n"
                    + self.model[ds_name]["outputs"][str(idx)]["prompt"]
                    + "\n```\n"
                )
                return {"prompt": prompt, "response": response, "exist": True}
        except:
            import traceback

            traceback.print_exc()
            return {"prompt": None, "response": None, "exist": False}

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
