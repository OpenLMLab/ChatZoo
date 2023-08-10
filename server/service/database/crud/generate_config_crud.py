import traceback

from ..models.generate_config import Generate_Config


def create_generate_config(nickname: str, generate_kwargs: dict, model_name_or_path: str, prompts: dict):
    try:
        return Generate_Config.create(nickname=nickname, generate_kwargs=generate_kwargs,
                                      model_name_or_path=model_name_or_path, prompts=prompts)
    except:
        traceback.print_exc()
        return None

