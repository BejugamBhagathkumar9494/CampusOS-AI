"""Food Demand Forecaster ML model.

Predicts mess attendance and food demand.
"""
from datetime import date


def forecast_food_demand(day: date, meal_type: str) -> int:
    """Forecasts expected student attendance for a meal to minimize food waste."""
    # Weekend mess attendance is generally lower.
    day_of_week = day.weekday()
    base_demand = 500
    if day_of_week >= 5:  # Saturday or Sunday
        return int(base_demand * 0.4)
    if meal_type.lower() == "breakfast":
        return int(base_demand * 0.7)
    return base_demand
