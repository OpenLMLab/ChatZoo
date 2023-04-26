from .firefly import FireflyBOT

MODEL_DICT = {
    "firefly": FireflyBOT,
}

def choose_bot(config):
    if config.type not in MODEL_DICT:
        raise ValueError(
            f"Unsupported model type {config.type}. Should be one of: "
            f"{MODEL_DICT.keys()}"
        )
    return MODEL_DICT[config.type](config)