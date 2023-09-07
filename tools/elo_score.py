import os
import argparse
import importlib

import numpy as np
import pandas as pd
import plotly.express as px
from tqdm import tqdm
pd.options.display.float_format = '{:.2f}'.format

from server.service.utils import initial_database
from server.service.database.crud.vote_crud import read_all_votes 
from tools.utils import vote_data_to_df, visualize_battle_count, compute_elo, preety_print_elo_ratings, predict_win_rate, get_bootstrap_result, get_user_mark_num

parser = argparse.ArgumentParser()
parse = argparse.ArgumentParser()
parse.add_argument("--config", type=str, required=True, help="Configuration file")
args = parse.parse_args()

if not os.path.exists(args.config):
    raise ValueError(f"config: {args.config} could not find! Please check if the file : {args.config} exists")

# 导入配置文件
spec = importlib.util.spec_from_file_location("config", args.config)
config_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config_module)

# 初始化数据库
db = initial_database(database_path=config_module.database_path,db_type=config_module.database_dtype)
all_vote_list = read_all_votes()
print(all_vote_list)


df_single, df_overall = vote_data_to_df(vote_list=all_vote_list)
print(df_single)
print(df_overall)

df_all = pd.concat([df_single, df_overall], ignore_index=True)

# 模型比较的次数
all_model_times = px.bar(pd.concat([df_all["model_a"], df_all["model_b"]]).value_counts(),
             title="Battle Count for Each Model", text_auto=True)
all_model_times.update_layout(xaxis_title="model", yaxis_title="Battle Count", height=400,
                  showlegend=False)
# all_model_times.show()
all_model_times.write_image("times.png")
fig = visualize_battle_count(df_all, title="Battle Count of Each Combination of Models")

elo_ratings = compute_elo(df_all)
df_ratings = preety_print_elo_ratings(elo_ratings)

# 计算bootstrap 的 el_score
BOOTSTRAP_ROUNDS = 1000

np.random.seed(42)
bootstrap_elo_lu = get_bootstrap_result(df_all, compute_elo, BOOTSTRAP_ROUNDS)
bootstrap_lu_median = bootstrap_elo_lu.median().reset_index().set_axis(["model", "Elo rating"], axis=1)
bootstrap_lu_median["Elo rating"] = (bootstrap_lu_median["Elo rating"] + 0.5).astype(int)


# 在 bootstrap 的基础上计算胜率
win_rate = predict_win_rate(dict(bootstrap_elo_lu.quantile(0.5)))
ordered_models = win_rate.mean(axis=1).sort_values(ascending=False).index
win_rate_fig = px.imshow(win_rate.loc[ordered_models, ordered_models],
                color_continuous_scale='RdBu', text_auto=".2f",
                title="Predicted Win Rate Using Elo Ratings for Model A in an A vs. B Battle")
win_rate_fig.update_layout(xaxis_title="Model B",
                  yaxis_title="Model A",
                  xaxis_side="top", height=600, width=600,
                  title_y=0.07, title_x=0.5)
win_rate_fig.update_traces(hovertemplate=
                  "Model A: %{y}<br>Model B: %{x}<br>Win Rate: %{z}<extra></extra>")

# 计算用户标注的数量
df_count = get_user_mark_num(vote_list=all_vote_list)

html_times = all_model_times.to_html(full_html=False)
html_battle_count = fig.to_html(full_html=False)
html_table = df_ratings.to_html(index=False)
html_bootstrap_el = bootstrap_lu_median.to_html(index=False)
html_win_rate = win_rate_fig.to_html(full_html=False)
html_user_count = df_count.to_html(index=False)
# 创建HTML文件并嵌入表格和图表
html_content = f"""
<html>
<head>
  <title>Pandas Data and Plotly Express Charts</title>
  <style>
    .image-container {{
      display: inline-block;
      width: 100%;
      height: 100%;
      border: 1px solid black;
    }}
    .container {{
        display:flex;
        flex-direction: column
    }}
    table {{
        border-collapse: collapse;
        width: 100%;
    }}
    
    th, td {{
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }}
    
    th {{
        background-color: #f2f2f2;
    }}
  </style>
</head>
<body>
  <h1>Elo rating</h1>
  {html_table}

  <h1>BOOTSTRAP Elo rating</h1>
  {html_bootstrap_el}
  <h1>USER MARK TABLE</h1>
  {html_user_count}
  <h1>Charts</h1>
  <div class="container">
    <div class="image-container">
        {html_times}
    </div>
    <div class="image-container">
        {html_battle_count}
    </div>
    <div class="image-container">
    {html_win_rate}
    </div>
  </div>
</body>
</html>
"""

# 将HTML内容保存为文件
with open('data_and_chart.html', 'w') as f:
    f.write(html_content)