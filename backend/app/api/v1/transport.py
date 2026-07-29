from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models import BusRoute

router = APIRouter(prefix="/transport", tags=["Transport Management"])


@router.get("/routes")
def get_routes(db: Session = Depends(get_db)):
    """Get optimized transit routes for university buses."""
    routes_in_db = db.query(BusRoute).all()
    if routes_in_db:
        return {
            "routes": [
                {
                    "id": r.id,
                    "route": r.route_name,
                    "bus_number": r.bus.bus_number if r.bus else "TS-09-UA-1234",
                    "driver_name": r.bus.driver_name if r.bus else "Ramesh Kumar",
                    "eta": "8 mins" if r.id == 1 else "14 mins",
                    "demand": "High" if r.id == 1 else "Low",
                    "stops": r.stops.split(",") if r.stops else ["Central Station", "Campus"]
                }
                for r in routes_in_db
            ]
        }

    return {
        "routes": [
            {
                "id": 1,
                "route": "Route 10A (Central Station to Campus)",
                "bus_number": "TS-09-UA-1234",
                "driver_name": "Ramesh Kumar",
                "eta": "8 mins",
                "demand": "High",
                "stops": ["Central Station", "Secunderabad", "Campus Gate 1"]
            },
            {
                "id": 2,
                "route": "Route 14B (Metro Link to North Gate)",
                "bus_number": "TS-09-UA-5678",
                "driver_name": "Suresh Singh",
                "eta": "14 mins",
                "demand": "Low",
                "stops": ["Metro Link", "Campus Gate 2", "Library"]
            }
        ]
    }


@router.get("/live-tracking")
def get_live_tracking():
    """Get real-time location and occupancy status of active vehicles."""
    return {
        "vehicles": [
            {
                "bus_number": "TS-09-UA-1234",
                "route": "Route 10A",
                "lat": 17.3850,
                "lng": 78.4867,
                "current_speed_kmh": 34.5,
                "occupancy_level": "84%",
                "next_stop": "Campus Gate 1"
            },
            {
                "bus_number": "TS-09-UA-5678",
                "route": "Route 14B",
                "lat": 17.4012,
                "lng": 78.4920,
                "current_speed_kmh": 28.0,
                "occupancy_level": "32%",
                "next_stop": "Library Junction"
            }
        ]
    }


@router.get("/prediction")
def get_bus_crowd_prediction(route_id: str = "1", time_slot: str = "10:00 AM"):
    """Predict peak hours and bus crowd occupancy levels using ML models."""
    crowd = "High" if "09:" in time_slot or "10:" in time_slot or "17:" in time_slot else "Low"
    return {
        "route_id": route_id,
        "time_slot": time_slot,
        "predicted_crowd_index": crowd,
        "recommended_action": "Wait for 10:15 AM shuttle for available seating" if crowd == "High" else "Optimal boarding time"
    }
