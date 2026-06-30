import os
import requests
import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import datetime
from dotenv import load_dotenv
from scipy import stats
import yfinance as yf

# Load environment variables
load_dotenv()
API_KEY = os.getenv('FRED_API_KEY')

# File path handling
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, "us_dollar_value.csv")

# FRED API configuration
FRED_URL = "https://api.stlouisfed.org/fred/series/observations"
SERIES_ID = "CPIAUCSL"  # Consumer Price Index for All Urban Consumers
OUTPUT_FILE = "us_dollar_value.csv"

def calculate_recent_trend(historical_data, years_back=5):
    """Calculate trend parameters from recent historical data using CAGR."""
    # Get recent data
    recent_data = historical_data.copy()
    end_date = recent_data['date'].max()
    start_date = end_date - pd.DateOffset(years=years_back)
    mask = (recent_data['date'] >= start_date)
    recent_data = recent_data[mask]

    # Calculate CAGR of purchasing power
    start_pp = recent_data.iloc[0]['purchasing_power']
    end_pp = recent_data.iloc[-1]['purchasing_power']
    cagr = (end_pp / start_pp) ** (1/years_back) - 1

    # Calculate average real GDP growth
    recent_data['gdp_proxy'] = recent_data['purchasing_power'].pct_change(12)
    avg_gdp = recent_data['gdp_proxy'].mean() * 100

    # Calculate average inflation (year-over-year)
    recent_data['cpi_yoy'] = recent_data['cpi'].pct_change(12) * 100
    avg_inflation = recent_data['cpi_yoy'].mean()

    return {
        "inflation": round(avg_inflation, 1),
        "interest": 5.25,  # Current Federal Funds Rate
        "gdp": round(max(avg_gdp, 0.5), 1),  # Floor of 0.5% growth
        "debt": 120.0,    # Current approximate debt/GDP
        "trade": 3.0,     # Current approximate trade deficit
        "description": f"""Extrapolates current economic conditions based on the last {years_back} years:
        - Historical CAGR: {cagr*100:.1f}% per year
        - Average inflation: {avg_inflation:.1f}%
        - Estimated GDP growth: {max(avg_gdp, 0.5):.1f}%
        - Current Federal Funds Rate: 5.25%
        - Uses actual trend from {start_date.year} to {end_date.year}"""
    }

# Scenario presets
SCENARIOS = {
    "Current Trend": {},  # Will be populated with actual data
    "Custom": {
        "inflation": 3.0,
        "interest": 5.25,
        "gdp": 2.0,
        "debt": 120.0,
        "trade": 3.0,
        "description": "Custom scenario with user-defined parameters"
    },
    "Mild Devaluation": {
        "inflation": 5.5,
        "interest": 4.0,
        "gdp": 1.0,
        "debt": 130.0,
        "trade": 4.5,
        "description": """Scenario 1 (30% probability):
        - Moderate policy changes weaken dollar on purpose
        - Fed allows higher inflation for economic growth
        - 3-5% annual dollar value decline
        - Stock market volatility but no crash"""
    },
    "Moderate Devaluation": {
        "inflation": 8.0,
        "interest": 6.0,
        "gdp": 0.5,
        "debt": 135.0,
        "trade": 5.0,
        "description": """Scenario 2 (40% probability):
        - 6-10% yearly inflation
        - Heavy government intervention
        - Aggressive export-focused policy
        - Large government spending"""
    },
    "Severe Crisis": {
        "inflation": 15.0,
        "interest": 12.0,
        "gdp": -2.0,
        "debt": 150.0,
        "trade": 7.0,
        "description": """Scenario 3 (20% probability):
        - 10-20% inflation per year
        - Possible debt-ceiling scares
        - Sharp loss of dollar credibility
        - Global investors dump Treasuries"""
    },
    "Hyperinflation": {
        "inflation": 50.0,
        "interest": 45.0,
        "gdp": -5.0,
        "debt": 180.0,
        "trade": 10.0,
        "description": """Scenario 4 (<10% probability):
        - Inflation beyond 20% per year
        - Complete loss of confidence
        - Emergency measures likely
        - Similar to post-Soviet Russian crisis"""
    }
}

def calculate_dollar_value(params, years, start_value, scenario_name="Custom"):
    """Calculate projected dollar value based on economic parameters."""
    # Initial value from the last historical point
    base_value = start_value

    # Monthly timesteps
    months = years * 12

    # Calculate monthly compound rates
    monthly_inflation = (1 + params['inflation'] / 100) ** (1/12) - 1
    monthly_interest = (1 + params['interest'] / 100) ** (1/12) - 1
    monthly_gdp = (1 + params['gdp'] / 100) ** (1/12) - 1

    # Base inflation impact (Fisher equation: real rate = nominal rate - inflation)
    real_rate = monthly_interest - monthly_inflation

    # Crisis dynamics based on scenario
    if scenario_name == "Hyperinflation":
        # Hyperinflation dynamics:
        inflation_multiplier = 2.0 * (1 + params['debt'] / 150)  # Severe debt impact
        growth_impact = 0.8  # Strong negative feedback
        volatility_base = 0.04  # High volatility
        crisis_acceleration = np.exp(np.linspace(0, 0.5, months))  # Exponential crisis deepening
    elif scenario_name == "Severe Crisis":
        inflation_multiplier = 1.5 * (1 + params['debt'] / 175)
        growth_impact = 0.6
        volatility_base = 0.03
        crisis_acceleration = np.linspace(1, 1.3, months)
    elif scenario_name == "Moderate Devaluation":
        inflation_multiplier = 1.2 * (1 + params['debt'] / 200)
        growth_impact = 0.4
        volatility_base = 0.02
        crisis_acceleration = np.linspace(1, 1.1, months)
    else:
        inflation_multiplier = 1.0 + params['debt'] / 400
        growth_impact = 0.3
        volatility_base = 0.01
        crisis_acceleration = np.ones(months)

    # Calculate month-by-month values using compound effects
    values = np.zeros(months)
    values[0] = base_value

    for i in range(1, months):
        # Real economic growth effect (GDP adjusted for trade deficit)
        growth_effect = (1 + monthly_gdp * (1 - params['trade'] / 100)) ** growth_impact

        # Inflation effect (adjusted for debt burden)
        inflation_effect = (1 + monthly_inflation * inflation_multiplier)

        # Real interest rate effect (diminishing in high inflation)
        interest_effect = (1 + real_rate * max(0, 1 - monthly_inflation * 5))

        # Debt burden effect (increases with inflation)
        debt_effect = 1 - (params['debt'] / 1000) * monthly_inflation

        # Combined monthly effect with crisis acceleration
        monthly_change = (growth_effect * interest_effect * debt_effect / inflation_effect) ** crisis_acceleration[i]

        values[i] = values[i-1] * monthly_change

    # Add increasing volatility based on scenario severity
    volatility = np.random.normal(0, volatility_base * crisis_acceleration, months)
    values = values * (1 + volatility)

    timeline = np.array([START_YEAR + i/12 for i in range(months)])
    return timeline, values

# Set page config
st.set_page_config(
    page_title="USD Value Analysis",
    page_icon="💵",
    layout="wide"
)

# Add notification for sidebar
st.caption("👆 Click the arrow icon in the top-left to open analysis settings")

# Title and description
st.title("💵 US Dollar Value Analysis & Projection")
st.markdown("""
This tool shows the historical purchasing power of the US dollar and projects potential future scenarios based on economic parameters.
Values are normalized to 100 at the selected start year, showing the relative change in purchasing power over time.
""")

# Load historical data
@st.cache_data
def load_historical_data():
    try:
        data = pd.read_csv(DATA_FILE)
        data['date'] = pd.to_datetime(data['date'])
        return data
    except Exception as e:
        st.error(f"Error loading data: {str(e)}")
        return None

@st.cache_data
def load_asset_data(start_date, cpi_data, adjust_for_inflation=False):
    """Load historical price data for gold and bitcoin, with optional CPI adjustment."""
    try:
        # Get gold data (GLD ETF as proxy)
        gold = yf.download('GLD', start=start_date, progress=False)
        gold = gold[['Adj Close']].rename(columns={'Adj Close': 'gold'})
        gold.index.name = 'date'

        # Get Bitcoin data
        btc = yf.download('BTC-USD', start=start_date, progress=False)
        btc = btc[['Adj Close']].rename(columns={'Adj Close': 'bitcoin'})
        btc.index.name = 'date'

        # Combine and normalize
        assets = pd.merge(gold, btc, how='outer', left_index=True, right_index=True)

        # Forward fill missing values (for dates before Bitcoin existed)
        assets = assets.ffill()

        # Resample to month-end to match USD data
        assets = assets.resample('ME').last()

        if adjust_for_inflation:
            # Merge with CPI data to adjust for inflation
            cpi_monthly = cpi_data.set_index('date').resample('ME').last()
            assets = pd.merge(assets, cpi_monthly[['cpi']],
                            left_index=True, right_index=True,
                            how='left')
            assets['cpi'] = assets['cpi'].ffill()

            # Calculate real values adjusted for inflation
            base_cpi = assets['cpi'].iloc[0]
            for col in ['gold', 'bitcoin']:
                if col in assets.columns:
                    # Adjust for inflation: multiply by (base_cpi / current_cpi)
                    assets[col] = assets[col] * (base_cpi / assets['cpi'])

        # Normalize to 100 at start for both nominal and real values
        for col in ['gold', 'bitcoin']:
            if col in assets.columns:
                first_valid = assets[col].first_valid_index()
                if first_valid:
                    start_value = assets[col].loc[first_valid]
                    if start_value > 0:
                        assets[col] = assets[col] * (100 / start_value)
                    else:
                        assets[col] = 100

        return assets[['gold', 'bitcoin']]
    except Exception as e:
        st.warning(f"Could not load asset data: {str(e)}")
        return None

historical_data = load_historical_data()

if historical_data is not None:
    # Calculate Current Trend scenario from recent data
    SCENARIOS["Current Trend"] = calculate_recent_trend(historical_data)

    # Constants
    CURRENT_YEAR = datetime.now().year
    MIN_YEAR = historical_data['date'].dt.year.min()

    # Sidebar controls
    st.sidebar.header("Analysis Parameters")

    # Asset comparison toggles
    st.sidebar.header("Asset Comparison")
    show_gold = st.sidebar.checkbox(
        "Show Gold (GLD ETF)",
        value=True,  # Default to showing gold
        help="Compare USD purchasing power with gold"
    )

    show_bitcoin = st.sidebar.checkbox(
        "Show Bitcoin",
        value=True,  # Default to showing bitcoin
        help="Compare USD purchasing power with bitcoin"
    )

    # Add CPI adjustment toggle
    adjust_for_inflation = st.sidebar.checkbox(
        "Adjust Asset Prices for Inflation",
        value=False,
        help="Convert asset prices to real values by adjusting for inflation"
    )

    # Scale toggle
    use_log_scale = st.sidebar.checkbox(
        "Use Logarithmic Scale",
        value=False,
        help="Switch between linear and logarithmic scale"
    )

    st.sidebar.header("Scenario Selection")

    # Scenario selection
    selected_scenario = st.sidebar.selectbox(
        "Choose a Scenario",
        options=list(SCENARIOS.keys()),
        help="Select a predefined scenario or customize your own"
    )

    # Show scenario description
    st.sidebar.markdown(f"**Scenario Description:**\n{SCENARIOS[selected_scenario]['description']}")

    st.sidebar.header("Economic Parameters")

    # Economic parameters with preset values
    inflation_rate = st.sidebar.slider(
        "Annual Inflation Rate (%)",
        min_value=0.0,
        max_value=200.0,  # Increased for crisis scenarios
        value=SCENARIOS[selected_scenario]['inflation'],
        step=0.1,
        help="Expected annual inflation rate"
    )

    interest_rate = st.sidebar.slider(
        "Federal Funds Rate (%)",
        min_value=0.0,
        max_value=200.0,  # Increased for crisis scenarios
        value=SCENARIOS[selected_scenario]['interest'],
        step=0.25,
        help="Federal Reserve's target interest rate"
    )

    gdp_growth = st.sidebar.slider(
        "GDP Growth Rate (%)",
        min_value=-10.0,
        max_value=10.0,
        value=SCENARIOS[selected_scenario]['gdp'],
        step=0.1,
        help="Expected annual GDP growth rate"
    )

    debt_gdp = st.sidebar.slider(
        "Debt to GDP Ratio (%)",
        min_value=50.0,
        max_value=200.0,
        value=SCENARIOS[selected_scenario]['debt'],
        step=5.0,
        help="Government debt as percentage of GDP"
    )

    trade_deficit = st.sidebar.slider(
        "Trade Deficit (% of GDP)",
        min_value=0.0,
        max_value=20.0,  # Increased for crisis scenarios
        value=SCENARIOS[selected_scenario]['trade'],
        step=0.1,
        help="Trade deficit as percentage of GDP"
    )

    # Run simulation
    params = {
        'inflation': inflation_rate,
        'interest': interest_rate,
        'gdp': gdp_growth,
        'debt': debt_gdp,
        'trade': trade_deficit
    }

    # Year range selection
    years_range = st.slider(
        "Select Year Range",
        min_value=max(MIN_YEAR, 2004),  # GLD ETF started in 2004
        max_value=CURRENT_YEAR + 30,
        value=(2021, 2035),  # Default range
        step=1,
        help="Select the start and end years for the analysis",
        key="year_range_slider"  # Add a unique key
    )
    START_YEAR, end_year = years_range

    # Calculate number of years for projection
    years = end_year - CURRENT_YEAR
    if years <= 0:
        st.error("Select an end year after the current year to show projections.")
        st.stop()

    # Filter and normalize historical data
    mask = historical_data['date'].dt.year >= START_YEAR
    filtered_data = historical_data[mask].copy()
    if filtered_data.empty:
        st.error("No historical data is available for that start year. Choose an earlier start year.")
        st.stop()

    # Find the first value to normalize against
    start_value = filtered_data.iloc[0]['purchasing_power']
    filtered_data['normalized_power'] = filtered_data['purchasing_power'] * (100 / start_value)

    # Get the last historical value to start projections from
    last_historical = filtered_data.iloc[-1]
    current_value = last_historical['normalized_power']
    timeline, values = calculate_dollar_value(params, years, current_value, selected_scenario)

    # Create plot
    fig = go.Figure()

    # Add historical data
    fig.add_trace(go.Scatter(
        x=filtered_data['date'],
        y=filtered_data['normalized_power'],
        mode='lines',
        name='USD Purchasing Power',
        line=dict(color='#2ecc71', width=2)
    ))

    # Create dates for projected values
    projection_dates = pd.date_range(
        start=last_historical['date'],
        periods=len(values),
        freq='ME'  # Using 'ME' (month end) instead of deprecated 'M'
    )

    # Add projected values
    fig.add_trace(go.Scatter(
        x=projection_dates,
        y=values,
        mode='lines',
        name=f'USD Projected ({selected_scenario})',
        line=dict(color='#1f77b4', width=2, dash='dash')
    ))

    # Initialize max_value with current data
    max_value = max(max(filtered_data['normalized_power']), max(values))

    # Add gold and bitcoin comparison if selected
    start_date = f"{START_YEAR}-01-01"
    asset_data = load_asset_data(start_date, historical_data, adjust_for_inflation)

    if asset_data is not None:
        # Add gold trace if selected
        if show_gold and 'gold' in asset_data.columns:
            gold_data = asset_data['gold'].dropna()
            if not gold_data.empty:
                name_suffix = " (CPI Adjusted)" if adjust_for_inflation else " (Nominal Price)"
                fig.add_trace(go.Scatter(
                    x=gold_data.index,
                    y=gold_data,
                    mode='lines',
                    name=f'Gold{name_suffix}',
                    line=dict(color='#ffd700', width=2)
                ))
                max_value = max(max_value, gold_data.max())

        # Add bitcoin trace if selected
        if show_bitcoin and 'bitcoin' in asset_data.columns:
            bitcoin_data = asset_data['bitcoin'].dropna()
            if not bitcoin_data.empty:
                name_suffix = " (CPI Adjusted)" if adjust_for_inflation else " (Nominal Price)"
                fig.add_trace(go.Scatter(
                    x=bitcoin_data.index,
                    y=bitcoin_data,
                    mode='lines',
                    name=f'Bitcoin{name_suffix}',
                    line=dict(color='#f39c12', width=2)
                ))
                max_value = max(max_value, bitcoin_data.max())

    # Customize layout with proper y-axis range
    fig.update_layout(
        title=f'Asset Value Comparison ({START_YEAR}-Present) with {selected_scenario} USD Scenario',
        xaxis_title='Year',
        yaxis_title=f'Percent of {START_YEAR} Value (Starting Value = 100%)',
        yaxis_type='log' if use_log_scale else 'linear',
        yaxis=dict(
            range=[0, max_value * 1.1] if not use_log_scale else [1, np.log10(max_value) * 1.1],
            tickformat='.1f' if not use_log_scale else '',
            ticksuffix='%',  # Add percent symbol to tick labels
            gridcolor='rgba(128, 128, 128, 0.2)',
            showgrid=True,
        ),
        xaxis=dict(
            gridcolor='rgba(128, 128, 128, 0.2)',
            showgrid=True,
        ),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        hovermode='x unified',
        height=600,
        showlegend=True,
        legend=dict(
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01,
            bgcolor='rgba(255, 255, 255, 0)'  # Fully transparent background
        )
    )

    # Add reference line for start year baseline with better positioning
    fig.add_hline(
        y=100,
        line_dash="dot",
        line_color="rgba(128, 128, 128, 0.5)",
        opacity=0.5
    )

    # Add baseline annotation separately
    fig.add_annotation(
        text=f"{START_YEAR} Starting Value (100%)",
        xref="paper",
        yref="y",
        x=1,
        y=100,
        showarrow=False,
        yshift=10,
        xshift=-10,
        font=dict(size=10, color="rgba(128, 128, 128, 0.8)")
    )

    # Display plot
    st.plotly_chart(fig, use_container_width=True)

    # Calculate final value and other metrics
    final_value = values[-1]  # Get the last value from projections
    total_change = ((final_value - current_value) / current_value) * 100
    annual_change = ((final_value / current_value) ** (1/years) - 1) * 100

    # Display key metrics with full text
    st.markdown("### Key Metrics")

    # Create three columns with more space
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        st.metric(
            "Current USD Purchasing Power",
            f"{current_value:.1f}%",
            ""  # Remove delta text from metric
        )
        st.markdown(f"💵 A dollar buys {current_value:.1f}% of what it bought in {START_YEAR}")
        st.markdown("*Compared to baseline value of 100%*")

    with col2:
        loss_in_value = 100 - final_value
        st.metric(
            f"Projected Purchasing Power Loss",
            f"-{loss_in_value:.1f}%",
            ""  # Remove delta text from metric
        )
        st.markdown(f"📉 By {end_year}, a dollar will buy {final_value:.1f}% of what it bought in {START_YEAR}")
        st.markdown("*Total projected decline in value*")

    with col3:
        st.metric(
            "Annual Rate of Decline",
            f"{annual_change:+.1f}%",
            ""  # Remove delta text from metric
        )
        st.markdown(f"📊 Average yearly loss from {CURRENT_YEAR} to {end_year}")
        st.markdown("*Compound annual rate of decline*")

    # Add explanatory notes in collapsible sections
    st.markdown("### 📊 Analysis Details")

    with st.expander("🎯 Understanding the Scenarios"):
        st.markdown("""
        This model simulates four potential scenarios for the US dollar's future, based on historical precedents and economic theory:

        **1. Mild Devaluation (30% probability)**
        - Controlled weakening of the dollar
        - Moderate inflation of 3-5%
        - Limited market impact
        - Recommended hedges: 20-30% foreign assets, 10-15% real assets

        **2. Moderate Devaluation (40% probability)**
        - More aggressive currency intervention
        - 6-10% yearly inflation
        - Notable market volatility
        - Recommended hedges: 15-20% hard assets, 20% foreign currencies

        **3. Severe Crisis (20% probability)**
        - Sharp loss of dollar credibility
        - 10-20% annual inflation
        - Potential debt ceiling crisis
        - Recommended hedges: 25%+ hard assets, 25% foreign holdings

        **4. Hyperinflation (<10% probability)**
        - Complete loss of confidence
        - Inflation exceeding 20% annually
        - Similar to post-Soviet Russian crisis
        - Recommended hedges: 40%+ tangible assets, multiple foreign currencies
        """)

    with st.expander("⚙️ Model Factors"):
        st.markdown("""
        The projection considers these key economic relationships:

        - **Debt Impact**: Higher debt levels amplify inflation effects
        - **Interest Rate Effectiveness**: Diminishes during high inflation
        - **Growth Dynamics**: Negative growth has stronger impact in crises
        - **Trade Effects**: Deficits reduce effectiveness of growth
        - **Crisis Acceleration**: Problems compound faster in severe scenarios
        """)

    with st.expander("📚 Historical Context & Risk Factors"):
        col1, col2 = st.columns(2)

        with col1:
            st.markdown("**Historical Context**")
            st.markdown("""
            - Model incorporates lessons from historical currency crises
            - Particular attention to post-Soviet Russian experience
            - Considers both gradual decline and sudden crisis scenarios
            """)

        with col2:
            st.markdown("**Risk Factors**")
            st.markdown("""
            - Political stability and policy decisions
            - Global confidence in US institutions
            - Debt ceiling and fiscal policy
            - International relations and trade policy
            - Monetary policy effectiveness
            """)

    with st.expander("⚠️ Model Limitations"):
        st.markdown("""
        - Model is simplified for educational purposes
        - Cannot predict exact timing of crises
        - Does not capture all possible scenarios
        - Past crises may not perfectly predict future ones
        """)
else:
    st.error("Unable to load historical data. Please check the data file.")
