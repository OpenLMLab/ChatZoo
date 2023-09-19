import os
import argparse
import importlib

import dash
from dash import html, dash_table, callback, Output, Input, State, dcc
import dash_bootstrap_components as dbc
import pandas as pd

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
db = initial_database(database_path=config_module.database_path,db_type=config_module.database_dtype)
all_vote_list = read_all_votes()
df_single, df_overall = vote_data_to_df(vote_list=all_vote_list)
df_all = pd.concat([df_single, df_overall], ignore_index=True)
print(df_single)
print(df_overall)

def load_elo_rating() -> pd.DataFrame:
    elo_ratings = compute_elo(df_all)
    df_ratings = preety_print_elo_ratings(elo_ratings)
    return df_ratings
df_rating = load_elo_rating()
print(df_rating)

# 计算用户标注的数量
df_count = get_user_mark_num(vote_list=all_vote_list)


app = dash.Dash(
    external_stylesheets=[dbc.themes.BOOTSTRAP]
)

PLOTLY_LOGO = "../docs/pics/logo.png"
header_bar =  dbc.Navbar(
    dbc.Nav(
        [
            html.A(
                # Use row and col to control vertical alignment of logo / brand
                dbc.Row(
                    [
                        # dbc.Col(html.Img(src=PLOTLY_LOGO, height="30px")),
                        dbc.Col(dbc.NavbarBrand("ChatZoo", className="ms-2",
                            style={"fontSize": "25px", "fontFamily": '.New York',
                                   "fontWeight": "400", "lineHeight": "40px", "color": "#ffffffd9"})),
                    ],
                    align="center",
                    className="g-0",
                ),
                href="https://plotly.com",
                style={"textDecoration": "none"},
            ),
            dbc.NavItem(dbc.NavLink("ELO_RATING", href="/", id="elo_rating"), style={ "lineHeight": "30px","color": "#ffffffd9"}),
            dbc.NavItem(dbc.NavLink("USER_INFO", href="/", id="user_info"), style={ "lineHeight": "30px","color": "#ffffffd9"})
        ],
        style={"justifyContent": "flexStart", "columnGap": "2rem"},
    ),
    color="dark",
    dark=True,
)

elo_rating = dbc.Container([
    html.Div(id="content"),
    html.H1(id="current-time", style={"display": "none"}),
    dcc.Interval(id="interval-component", interval=10000, n_intervals=0)
],
fluid=True,
style={"paddingRight": "0","paddingLeft": "0", "paddingTop": "2rem"}
)

app.layout = dbc.Container(
    [
        dbc.Row(header_bar),
        dbc.Row(elo_rating)
    ]
)

@callback(
    [Output("content", "children"), Output("elo_rating", "n_clicks"), Output("user_info", "n_clicks")],
    [Input("elo_rating", "n_clicks"), Input("user_info", "n_clicks")]
)
def change_show_content(elo_clicks, rating_clicks):
    print(elo_clicks, rating_clicks, "activate_tab")
    if elo_clicks:
        elo_clicks = 0
        return dash_table.DataTable(data=df_rating.to_dict('records'),
                         columns=[{"name": i, "id": i} for i in df_rating.columns],
                         page_action='none',
                         style_cell_conditional=[
                            {'if': {'column_id': 'Model'},
                            'width': '50%'},
                            {'if': {'column_id': 'Elo rating'},
                            'width': '50%'},
                         ],
                         fixed_rows={'headers': True},
                         style_table={'height': '500px', 'overflowY': 'auto'}, id='tbl1'), elo_clicks, rating_clicks
    elif rating_clicks:
        rating_clicks = 0
        return dash_table.DataTable(data=df_count.to_dict('records'),
                         columns=[{"name": i, "id": i} for i in df_count.columns],
                         page_action='none',
                         style_cell_conditional=[
                            {'if': {'column_id': 'username'},
                            'width': '33%'},
                            {'if': {'column_id': 'dialogue_id_len'},
                            'width': '33%'},
                         ],
                         fixed_rows={'headers': True},
                         style_table={'height': '500px', 'overflowY': 'auto'}, id='tbl2'), elo_clicks, rating_clicks
    else:
        elo_clicks = 0
        return dash_table.DataTable(data=df_rating.to_dict('records'),
                         columns=[{"name": i, "id": i} for i in df_rating.columns],
                         page_action='none',
                         style_cell_conditional=[
                            {'if': {'column_id': 'Model'},
                            'width': '50%'},
                            {'if': {'column_id': 'Elo rating'},
                            'width': '50%'},
                         ],
                         fixed_rows={'headers': True},
                         style_table={'height': '500px', 'overflowY': 'auto'}, id='tbl1'), elo_clicks, rating_clicks

# 定义回调函数，用于更新当前时间
@app.callback(
    Output("current-time", "children"),
    Input("interval-component", "n_intervals")
)
def update_current_time(n):
    global df_rating, df_count
    df_rating = load_elo_rating()
    all_vote_list = read_all_votes()
    df_count = get_user_mark_num(vote_list=all_vote_list)
    return f"Current time: {n}"

if __name__ == "__main__":
    app.run_server(debug=True, host="10.140.0.240")