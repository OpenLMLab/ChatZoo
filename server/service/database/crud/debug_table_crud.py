import traceback

from ..models.debug_table import DebugMessage


def create_debugmessage(nickname: str, message: dict, generate_config: dict, model_name_or_path: str):
    try:
        DebugMessage.create(nickname=nickname, message=message, generate_config=generate_config,
                            model_name_or_path=model_name_or_path)
        return True
    except:
        traceback.print_exc()
        return False