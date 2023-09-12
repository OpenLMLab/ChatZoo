import dash
from dash import html
import dash_bootstrap_components as dbc

app = dash.Dash(
    external_stylesheets=[dbc.themes.BOOTSTRAP]
)

PLOTLY_LOGO = "https://images.plot.ly/logo/new-branding/plotly-logomark.png"
header_bar =  dbc.Navbar(
    dbc.Container(
        [
            html.A(
                # Use row and col to control vertical alignment of logo / brand
                dbc.Row(
                    [
                        dbc.Col(html.Img(src=PLOTLY_LOGO, height="30px")),
                        dbc.Col(dbc.NavbarBrand("ChatZoo", className="ms-2",
                            style={"font-size": "30px", "font-family": '.New York',
                                   "font-weight": "400", "line-height": "47px", "color": "#ffffffd9"})),
                    ],
                    align="center",
                    className="g-0",
                ),
                href="https://plotly.com",
                style={"textDecoration": "none"},
            ),
            dbc.NavbarToggler(id="navbar-toggler", n_clicks=0),
            # dbc.Collapse(
            #     search_bar,
            #     id="navbar-collapse",
            #     is_open=False,
            #     navbar=True,
            # ),
        ]
    ),
    color="dark",
    dark=True,
)

app.layout = dbc.Container(
    dbc.Row(header_bar)
)

if __name__ == "__main__":
    app.run_server(debug=True, host="10.140.0.240")