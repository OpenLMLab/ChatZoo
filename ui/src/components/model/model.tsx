/**
 * ModelConfig
 */

interface Prompts {
    meta_prompt: string;
    user_prompt: string;
    bot_prompt: string;
}

class ModelConfig {
    model_name_or_path: string;
    nickname: string;
    tokenizer_path: string;
    generate_kwargs: { max_length: number };
    device: string;
    prompts: Prompts;
    url: string;
    stream: boolean;
    model_id: string;
    start: boolean;

    constructor(
        model_name_or_path: string,
        nickname: string,
        tokenizer_path: string,
        generate_kwargs: { max_length: number },
        device: string,
        prompts: Prompts,
        url: string,
        stream: boolean,
        model_id: string,
        start: boolean,
    ) {
        this.model_name_or_path = model_name_or_path;
        this.nickname = nickname;
        this.tokenizer_path = tokenizer_path;
        this.generate_kwargs = generate_kwargs;
        this.device = device;
        this.url = url;
        this.prompts = prompts;
        this.stream = stream;
        this.model_id = model_id;
        this.start = start;
    }
}

export default ModelConfig;
