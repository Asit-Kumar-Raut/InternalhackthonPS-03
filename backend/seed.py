"""
Database seeding script for SmartSignal AI.
Populates demo users, vehicles, 2x2 grid junctions, roads, sensors, and configs.
"""
import os
import sys
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
from app.models.junction import Junction, JunctionStatus
from app.models.road import Road
from app.models.signal import Signal, SignalPhase, SignalState
from app.models.sensor import Sensor, SensorType, SensorStatus
from app.models.config_model import Config
from app.auth.jwt import get_password_hash


def seed_database():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Users
    users_data = [
        ("admin@demo.com", "Admin@123", UserRole.ADMIN),
        ("operator@demo.com", "Operator@123", UserRole.OPERATOR),
        ("viewer@demo.com", "Viewer@123", UserRole.VIEWER),
        ("ambulance@demo.com", "Driver@123", UserRole.DRIVER),
        ("pending@demo.com", "Driver@123", UserRole.DRIVER),
        ("rejected@demo.com", "Driver@123", UserRole.DRIVER),
    ]

    user_map = {}
    for email, pwd, role in users_data:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            u = User(
                email=email,
                password_hash=get_password_hash(pwd),
                role=role,
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            user_map[email] = u
        else:
            user_map[email] = existing

    print(f"Users seeded: {len(user_map)}")

    # 2. Vehicles
    vehicles_data = [
        {
            "user": "ambulance@demo.com",
            "number": "OD02AB1234",
            "type": VehicleType.AMBULANCE,
            "org": "AIIMS Emergency Care",
            "org_type": "HOSPITAL",
            "reg": "HOSP-2024-991",
            "driver": "Rajesh Kumar",
            "phone": "+91 9876543210",
            "status": VehicleStatus.APPROVED,
            "trust": 85,
            "plate_match": True,
            "veh_class": "AMBULANCE",
            "conf": 0.96,
        },
        {
            "user": "pending@demo.com",
            "number": "OD02CD5678",
            "type": VehicleType.AMBULANCE,
            "org": "Apollo Lifeline",
            "org_type": "AMBULANCE_SERVICE",
            "reg": "AMB-2024-412",
            "driver": "Suresh Patel",
            "phone": "+91 9123456780",
            "status": VehicleStatus.PENDING,
            "trust": 70,
            "plate_match": True,
            "veh_class": "AMBULANCE",
            "conf": 0.91,
        },
        {
            "user": "rejected@demo.com",
            "number": "OD02EF9999",
            "type": VehicleType.AMBULANCE,
            "org": "City Private Health",
            "org_type": "HOSPITAL",
            "reg": "PVT-2023-102",
            "driver": "Amit Verma",
            "phone": "+91 9988776655",
            "status": VehicleStatus.REJECTED,
            "trust": 40,
            "plate_match": False,
            "veh_class": "CAR",
            "conf": 0.45,
            "reason": "Vehicle photo does not match ambulance type and plate OCR mismatch.",
        },
    ]

    for v in vehicles_data:
        existing = db.query(Vehicle).filter(Vehicle.vehicle_number == v["number"]).first()
        if not existing:
            u = user_map.get(v["user"])
            veh = Vehicle(
                user_id=u.id if u else 1,
                vehicle_number=v["number"],
                vehicle_type=v["type"],
                org_name=v["org"],
                org_type=v["org_type"],
                org_reg_no=v["reg"],
                driver_name=v["driver"],
                phone=v["phone"],
                email=v["user"],
                vehicle_photo_path="uploads/placeholder_ambulance.jpg",
                driver_photo_path="uploads/placeholder_driver.jpg",
                rc_photo_path="uploads/placeholder_rc.jpg",
                status=v["status"],
                trust_score=v["trust"],
                reject_reason=v.get("reason"),
                ai_vehicle_class=v["veh_class"],
                ai_plate_text=v["number"],
                ai_plate_match=v["plate_match"],
                ai_confidence=v["conf"],
            )
            db.add(veh)
    db.commit()
    print("Vehicles seeded.")

    # 3. Junctions across Odisha highway network
    junctions_data = [
        (1, "Rasulgarh Square (Bhubaneswar)", 85.8560, 20.3015),
        (2, "Vani Vihar Square (Bhubaneswar)", 85.8340, 20.2980),
        (3, "Master Canteen Square (Bhubaneswar)", 85.8420, 20.2670),
        (4, "Khandagiri Square (Bhubaneswar)", 85.7870, 20.2600),
        (5, "Badambadi Junction (Cuttack)", 85.8750, 20.4625),
        (6, "AIIMS Healthcare Hub (Bhubaneswar)", 85.7750, 20.2310),
    ]
    for j_id, name, x, y in junctions_data:
        existing = db.query(Junction).filter(Junction.id == j_id).first()
        if not existing:
            j = Junction(id=j_id, name=name, x=x, y=y, status=JunctionStatus.ACTIVE)
            db.add(j)
        else:
            existing.name = name
            existing.x = x
            existing.y = y
    db.commit()

    # 4. Roads connecting Odisha junctions
    roads_data = [
        (1, 2, 350.0, "NH-16: Rasulgarh ↔ Vani Vihar"),
        (2, 3, 400.0, "Janpath: Vani Vihar ↔ Master Canteen"),
        (3, 4, 600.0, "Khandagiri Link: Master Canteen ↔ Khandagiri"),
        (4, 6, 250.0, "Hospital Expressway: Khandagiri ↔ AIIMS"),
        (1, 5, 800.0, "Mahanadi Highway: Rasulgarh ↔ Badambadi (Cuttack)"),
        (1, 4, 700.0, "Bypass Road: Rasulgarh ↔ Khandagiri"),
    ]
    for u, v, length, name in roads_data:
        if not db.query(Road).filter(Road.from_junction_id == u, Road.to_junction_id == v).first():
            r1 = Road(from_junction_id=u, to_junction_id=v, length_m=length, lanes=2, capacity=100, name=name)
            r2 = Road(from_junction_id=v, to_junction_id=u, length_m=length, lanes=2, capacity=100, name=f"{name} (Rev)")
            db.add(r1)
            db.add(r2)
    db.commit()

    # 5. Config defaults
    configs = [
        ("min_green", "8.0", "Minimum green duration in seconds"),
        ("max_green", "40.0", "Maximum green duration in seconds"),
        ("gap_time", "3.0", "Vehicle gap-out threshold in seconds"),
        ("yellow_time", "3.0", "Yellow transition duration in seconds"),
        ("all_red_time", "2.0", "All-red clearance duration in seconds"),
        ("ema_beta", "0.4", "EMA smoothing factor"),
        ("alpha", "0.6", "Webster prediction fusion factor"),
        ("aging_k", "0.1", "Aging queue weight per waiting second"),
        ("aging_cap_s", "90.0", "Maximum red starvation cap in seconds"),
        ("ai_enabled", "true", "AI predictive forecasting toggle"),
    ]
    for k, val, desc in configs:
        if not db.query(Config).filter(Config.key == k).first():
            db.add(Config(key=k, value=val, description=desc))
    db.commit()

    db.close()
    print("Database seeding completed successfully.")


if __name__ == "__main__":
    seed_database()
