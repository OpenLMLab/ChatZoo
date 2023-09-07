import psutil
import subprocess
import json
import os
from collections import defaultdict

from rich.progress import track
import pandas as pd

def find_free_port(used_port: list):
    # 获取当前正在使用的端口号列表
    used_ports = [conn.laddr.port for conn in psutil.net_connections()]
    used_ports.extend(used_port)
    
    # 遍历端口号范围，找到未被使用的端口
    for port in range(1024, 65536):
        if port not in used_ports:
            return port

    raise RuntimeError("No free port available.")

def run_subprocess_server(model_info: dict, database_path: str, database_dtype: str, host_name: str, mode: str, stream: bool):
    """将配置参数注入，用subprocess拉起开启后端服务

    Args:
        model_info (dict): 模型的信息
        database_path (str): _description_
        database_dtype (str): _description_
        host_name (str): _description_
        mode (str): _description_
        stream (bool): _description_

    Returns:
        _type_: _description_
    """
    server_kwargs = ["--port", str(model_info['port']), "--host", host_name, "--devices",  model_info['devices'],  "--nickname", model_info['nickname'], 
                     "--model_name_or_path", model_info['model_name_or_path'],  "--dtype", model_info['dtype'], "--tokenizer_path", model_info['tokenizer_path'], 
                     "--model_config", json.dumps(model_info['generate_kwargs']), "--db_type", database_dtype, 
                     "--db_path", database_path, "--mode", mode]
    if model_info['base_model']:
        server_kwargs.append("--base_model")
        server_kwargs.append(model_info['base_model'])
    if "prompts" in model_info:
        server_kwargs.append("--prompts")
        server_kwargs.append(json.dumps(model_info['prompts']))
    if stream:
        server_kwargs.append("--stream")
        # server_kwargs += f" --prompts {model_info['prompts']}"
    # print(f"server_kwargs {server_kwargs}")
    command = ["python", "server/server.py"]
    command.extend(server_kwargs)
    process = subprocess.Popen(command)
    return process

def run_suprocess_ui(host_name, main_port, port, main_host):
    """将配置参数注入，用subprocess拉起前端服务

    Args:
        host_name (_type_): _description_
        main_port (_type_): _description_
        port (_type_): _description_

    Returns:
        _type_: _description_
    """
    base_path = "ui/dist/"
    html_file = os.path.join(base_path, "index.html")
    with open(html_file, 'rt') as f:
        html_content = f.read()

    # 动态插入的 script 行
    script_line = f'<script>window.VITE_REACT_APP_PORT = "{main_port}";window.VITE_REACT_APP_HOST="{main_host}"</script>'
    print(script_line)
    # 在 </body> 标签之前插入 script 行
    modified_content = html_content.replace('</body>', script_line + '</body>')

    # 创建临时 HTML 文件
    temp_html_file = os.path.join(base_path,'index.html')
    with open(temp_html_file, 'wt') as f:
        f.write(modified_content)
    
    command = ["python", "-m", "http.server", str(port), "--b", host_name, "--d", base_path]
    process = subprocess.Popen(command)
    return process

def vote_data_to_df(vote_list: list):
    """将投票数据转为 dataframe 格式， 分为单轮投票和会话投票。而且全输或者全赢为特殊标签 tie 和 tie(both are bad)

    Args:
        vote_list (list): _description_
        df_single (pd.DataFrame): _description_
        df_overall (pd.DataFrame): _description_
    """
    df_single = pd.DataFrame(columns=['model_a', 'model_b', 'winner', 'username', 'tstamp'])
    df_overall = pd.DataFrame(columns=['model_a', 'model_b', 'winner', 'username', 'tstamp'])   
    df_single_data, df_overall_data = [], []
    for vote_dict in track(vote_list, description="Covert_to_DF", total=len(vote_list)):
        try:
            vote_result = json.loads(vote_dict['vote_result'])
        except:
            print(vote_dict)
            raise ValueError('error')
            continue
        vote_model = [item for item in vote_dict['vote_model'].keys()]
        label = None
        if len(vote_result) == 0:
            # 全输了
            label = "tie(both are bad)"
        elif len(vote_result) == len(vote_dict['vote_model']):
            # 打平了
            label = "tie"
        elif len(vote_result) == 1:
            # 正常的输赢情况，暂时只有单选
            label = vote_result[0]
        else:
            raise ValueError()
        
        if vote_dict['dialogue_id']:
            if "tie" in label:
                for i in range(0, len(vote_model)):
                    for j in range(i+1, len(vote_model)):
                        new_row = {'model_a': vote_model[i], 'model_b':  vote_model[j], 'winner': label, 
                                  'username': vote_dict["username"]['username'], 'tstamp': vote_dict["created_time"]}
                        # df_single = df_single.append(new_row, ignore_index=True)
                        df_single_data.append(new_row)
            else:
                for model_name in vote_model:
                    if label == model_name: continue
                    new_row = {'model_a': label, 'model_b':  model_name, 'winner': "model_a", 
                                'username': vote_dict["username"]['username'], 'tstamp': vote_dict["created_time"]}
                    # df_single = df_single.append(new_row, ignore_index=True)
                    df_single_data.append(new_row)
            
        elif vote_dict['turn_id']:
            if "tie" in label:
                for i in range(0, len(vote_model)):
                    for j in range(i+1, len(vote_model)):
                        new_row = {'model_a': vote_model[i], 'model_b':  vote_model[j], 'winner': label, 
                                  'username': vote_dict["username"]['username'], 'tstamp': vote_dict["created_time"]}
                        # df_overall = df_overall.append(new_row, ignore_index=True)
                        df_overall_data.append(new_row)
            else:
                for model_name in vote_model:
                    if label == model_name: continue
                    new_row = {'model_a': label, 'model_b':  model_name, 'winner': "model_a", 
                                'username': vote_dict["username"]['username'], 'tstamp': vote_dict["created_time"]}
                    # df_overall = df_overall.append(new_row, ignore_index=True)
                    df_overall_data.append(new_row)
        else:
            raise ValueError(f"Error in vote_dict: {vote_dict}")        
    df_single = pd.DataFrame(df_single_data)
    df_overall = pd.DataFrame(df_overall_data)
    return df_single, df_overall

def visualize_battle_count(battles, title):
    import plotly.express as px
    print(battles)
    ptbl = pd.pivot_table(battles, index="model_a", columns="model_b", aggfunc="size",
                          fill_value=0)
    print(ptbl)
    battle_counts = ptbl + ptbl.T
    ordering = battle_counts.sum().sort_values(ascending=False).index
    fig = px.imshow(battle_counts.loc[ordering, ordering],
                    title=title, text_auto=True, width=600)
    fig.update_layout(xaxis_title="Model B",
                      yaxis_title="Model A",
                      xaxis_side="top", height=600, width=600,
                      title_y=0.07, title_x=0.5)
    fig.update_traces(hovertemplate=
                      "Model A: %{y}<br>Model B: %{x}<br>Count: %{z}<extra></extra>")
    return fig

def compute_pairwise_win_fraction(battles):
    # Times each model wins as Model A
    a_win_ptbl = pd.pivot_table(
        battles[battles['winner'] == "model_a"],
        index="model_a", columns="model_b", aggfunc="size", fill_value=0)

    # Table counting times each model wins as Model B
    b_win_ptbl = pd.pivot_table(
        battles[battles['winner'] == "model_b"],
        index="model_a", columns="model_b", aggfunc="size", fill_value=0)

    # Table counting number of A-B pairs
    num_battles_ptbl = pd.pivot_table(battles,
        index="model_a", columns="model_b", aggfunc="size", fill_value=0)

    # Computing the proportion of wins for each model as A and as B
    # against all other models
    row_beats_col_freq = (
        (a_win_ptbl + b_win_ptbl.T) /
        (num_battles_ptbl + num_battles_ptbl.T)
    )

    # Arrange ordering according to proprition of wins
    prop_wins = row_beats_col_freq.mean(axis=1).sort_values(ascending=False)
    model_names = list(prop_wins.keys())
    row_beats_col = row_beats_col_freq.loc[model_names, model_names]
    return row_beats_col

def visualize_pairwise_win_fraction(battles, title):
    import plotly.express as px
    row_beats_col = compute_pairwise_win_fraction(battles)
    fig = px.imshow(row_beats_col, color_continuous_scale='RdBu',
                    text_auto=".2f", title=title)
    fig.update_layout(xaxis_title=" Model B: Loser",
                  yaxis_title="Model A: Winner",
                  xaxis_side="top", height=600, width=600,
                  title_y=0.07, title_x=0.5)
    fig.update_traces(hovertemplate=
                  "Model A: %{y}<br>Model B: %{x}<br>Fraction of A Wins: %{z}<extra></extra>")

    return fig

def compute_elo(battles, K=4, SCALE=400, BASE=10, INIT_RATING=1000):
    rating = defaultdict(lambda: INIT_RATING)

    for rd, model_a, model_b, winner in battles[['model_a', 'model_b', 'winner']].itertuples():
        ra = rating[model_a]
        rb = rating[model_b]
        ea = 1 / (1 + BASE ** ((rb - ra) / SCALE))
        eb = 1 / (1 + BASE ** ((ra - rb) / SCALE))
        if winner == "model_a":
            sa = 1
        elif winner == "model_b":
            sa = 0
        elif winner == "tie" or winner == "tie(both are bad)":
            sa = 0.5
        else:
            raise Exception(f"unexpected vote {winner}")
        rating[model_a] += K * (sa - ea)
        rating[model_b] += K * (1 - sa - eb)

    return rating

def preety_print_elo_ratings(elo_ratings):
    df = pd.DataFrame([
        [n, elo_ratings[n]] for n in elo_ratings.keys()
    ], columns=["Model", "Elo rating"]).sort_values("Elo rating", ascending=False).reset_index(drop=True)
    df["Elo rating"] = (df["Elo rating"] + 0.5).astype(int)
    df.index = df.index + 1
    return df

def predict_win_rate(elo_ratings, SCALE=400, BASE=10, INIT_RATING=1000):
    import numpy as np
    names = sorted(list(elo_ratings.keys()))
    wins = defaultdict(lambda: defaultdict(lambda: 0))
    for a in names:
        for b in names:
            ea = 1 / (1 + BASE ** ((elo_ratings[b] - elo_ratings[a]) / SCALE))
            wins[a][b] = ea
            wins[b][a] = 1 - ea

    data = {
        a: [wins[a][b] if a != b else np.NAN for b in names]
        for a in names
    }

    df = pd.DataFrame(data, index=names)
    df.index.name = "model_a"
    df.columns.name = "model_b"
    return df.T

def get_bootstrap_result(battles, func_compute_elo, num_round):
    from tqdm import tqdm
    rows = []
    for i in tqdm(range(num_round), desc="bootstrap"):
        rows.append(func_compute_elo(battles.sample(frac=1.0, replace=True)))
    df = pd.DataFrame(rows)
    return df[df.median().sort_values(ascending=False).index]

def get_user_mark_num(vote_list):
    df = pd.DataFrame(vote_list)
    print(df)
    df['username'] = df["username"].apply(lambda x: x.get("username"))
    # 根据用户名分组，并计算不为 None 的数量
    grouped = df.groupby('username').agg(
        dialogue_id_len=('dialogue_id', lambda x: x.notna().sum()),
        turn_id_len=('turn_id', lambda x: x.notna().sum())
    ).reset_index()
    return grouped
    # grouped_single = df_single.groupby('username').size().reset_index(name='dialogue_count')
    # grouped_overall = df_overall.groupby('username').size().reset_index(name='overall_count')
    # df = grouped_single.merge(grouped_overall[['username', 'overall_count']], on='username', how='left').fillna(0)
    # return df
    
