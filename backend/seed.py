"""
Seed the database from es_plan_data.json.
Run from project root: python -m backend.seed
"""
import json
import os
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use absolute path relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'backend', 'trading.db')}"
JSON_PATH = os.path.join(BASE_DIR, "backend", "es_plan_data.json")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

FIELD_MAP = {
    "ES Open Price":                ("es_open_price", "es_open_price_note"),
    "ES Weekly H1":                 ("es_weekly_h1", "es_weekly_h1_note"),
    "ES Weekly H2":                 ("es_weekly_h2", "es_weekly_h2_note"),
    "ES Weekly L1":                 ("es_weekly_l1", "es_weekly_l1_note"),
    "ES Weekly L2":                 ("es_weekly_l2", "es_weekly_l2_note"),
    "VWAP Daily":                   ("vwap_daily", None),
    "VWAP Weekly":                  ("vwap_weekly", None),
    "VWAP Monthly":                 ("vwap_monthly", "vwap_monthly_note"),
    "VWAP Quarterly":               ("vwap_quarterly", "vwap_quarterly_note"),
    "VWAP Yearly":                  ("vwap_yearly", "vwap_yearly_note"),
    "Buy Level of Interest":        ("buy_level", "buy_level_note"),
    "Sell Level of Interest":       ("sell_level", "sell_level_note"),
    "ES Monthly Posture":           ("es_monthly_posture", "es_monthly_posture_note"),
    "ES Weekly Posture":            ("es_weekly_posture", "es_weekly_posture_note"),
    "ES Daily Posture":             ("es_daily_posture", "es_daily_posture_note"),
    "ES Monthly Projected Price":   ("es_monthly_proj_price", "es_monthly_proj_note"),
    "ES Weekly Projected Price":    ("es_weekly_proj_price", "es_weekly_proj_note"),
    "ES Daily Projected Price":     ("es_daily_proj_price", "es_daily_proj_note"),
    "ES 15-30-45-1H Green Push":    ("es_green_push", "es_green_push_note"),
    "ES Squeeze <=1hrs":            ("es_squeeze", "es_squeeze_note"),
    "ES Bear Trap Zone":            ("es_bear_trap_zone", "es_bear_trap_zone_note"),
    "ES Bull Trap Zone":            ("es_bull_trap_zone", "es_bull_trap_zone_note"),
    "VIX Monthly Posture":          ("vix_monthly_posture", "vix_monthly_posture_note"),
    "VIX Weekly Posture":           ("vix_weekly_posture", "vix_weekly_posture_note"),
    "VIX Daily Posture":            ("vix_daily_posture", "vix_daily_posture_note"),
    "VIX Monthly Projected Price":  ("vix_monthly_proj_price", "vix_monthly_proj_note"),
    "VIX Weekly Projected Price":   ("vix_weekly_proj_price", "vix_weekly_proj_note"),
    "VIX Daily Projected Price":    ("vix_daily_proj_price", "vix_daily_proj_note"),
    "Major Economic Event":         ("major_economic_event", "major_economic_event_note"),
    "Plan of Action":               ("plan_of_action", "plan_of_action_note"),
}


def to_float(v):
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def seed():
    # Import models here to ensure tables are defined
    from .database import Base
    from .models import PlanWeek, DailyPlan, WebhookEvent, LiveData, HistoricalSnapshot

    # Drop and recreate all tables for idempotency
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print(f"Loading data from {JSON_PATH}")
    with open(JSON_PATH, "r") as f:
        data = json.load(f)

    db = SessionLocal()
    try:
        weeks_data = data.get("weeks", [])
        historical_data = data.get("historical", [])

        # Build a map of sheet -> week_id after insertion
        sheet_to_week_id = {}

        for week_json in weeks_data:
            weekly = week_json.get("weekly", {})

            kwargs = {
                "contract": week_json.get("contract"),
                "sheet": week_json.get("sheet"),
                "week_date": week_json.get("week_date"),
            }

            for field_name, (col, note_col) in FIELD_MAP.items():
                field_data = weekly.get(field_name, {}) or {}
                val = field_data.get("value") if isinstance(field_data, dict) else None
                note = field_data.get("note") if isinstance(field_data, dict) else None

                # Try numeric conversion for numeric columns
                numeric_cols = {
                    "es_open_price", "es_weekly_h1", "es_weekly_h2",
                    "es_weekly_l1", "es_weekly_l2", "vwap_daily", "vwap_weekly",
                    "vwap_monthly", "vwap_quarterly", "vwap_yearly",
                    "buy_level", "sell_level",
                    "es_monthly_proj_price", "es_weekly_proj_price", "es_daily_proj_price",
                    "es_bear_trap_zone", "es_bull_trap_zone",
                    "vix_monthly_proj_price", "vix_weekly_proj_price", "vix_daily_proj_price",
                }
                if col in numeric_cols:
                    kwargs[col] = to_float(val)
                else:
                    kwargs[col] = str(val) if val is not None else None

                if note_col:
                    kwargs[note_col] = str(note) if note is not None else None

            plan_week = PlanWeek(**kwargs)
            db.add(plan_week)
            db.flush()  # get the id

            sheet_to_week_id[week_json.get("sheet")] = plan_week.id

            # Insert daily plans
            daily_list = week_json.get("daily", [])
            for idx, day in enumerate(daily_list):
                levels = day.get("levels", {}) or {}
                momentum = day.get("momentum", {}) or {}
                triggers = day.get("triggers", {}) or {}

                daily_plan = DailyPlan(
                    week_id=plan_week.id,
                    day_date=str(day.get("date")) if day.get("date") else None,
                    day_index=idx,
                    level_4h=str(levels.get("4H")) if levels.get("4H") is not None else None,
                    level_daily=str(levels.get("Daily")) if levels.get("Daily") is not None else None,
                    level_weekly=str(levels.get("Weekly")) if levels.get("Weekly") is not None else None,
                    level_monthly=str(levels.get("Monthly")) if levels.get("Monthly") is not None else None,
                    momentum_4h=str(momentum.get("4H")) if momentum.get("4H") is not None else None,
                    momentum_daily=str(momentum.get("Daily")) if momentum.get("Daily") is not None else None,
                    momentum_weekly=str(momentum.get("Weekly")) if momentum.get("Weekly") is not None else None,
                    momentum_monthly=str(momentum.get("Monthly")) if momentum.get("Monthly") is not None else None,
                    trigger_vscore=str(triggers.get("VScore")) if triggers.get("VScore") is not None else None,
                    trigger_level=to_float(triggers.get("Level")),
                    trigger_vix=to_float(triggers.get("VIX")),
                    trigger_ai_pivot=str(triggers.get("AIPivot")) if triggers.get("AIPivot") is not None else None,
                    event=str(day.get("event")) if day.get("event") is not None else None,
                )
                db.add(daily_plan)

        db.flush()

        # Insert historical snapshots
        for hist in historical_data:
            sheet = hist.get("sheet")
            week_id = sheet_to_week_id.get(sheet)

            snap = HistoricalSnapshot(
                week_id=week_id,
                date=str(hist.get("date")) if hist.get("date") else None,
                sheet=hist.get("sheet"),
                contract=hist.get("contract"),
                open=to_float(hist.get("open")),
                h1=to_float(hist.get("h1")),
                h2=to_float(hist.get("h2")),
                l1=to_float(hist.get("l1")),
                l2=to_float(hist.get("l2")),
                vwap_d=to_float(hist.get("vwap_d")),
                vwap_w=to_float(hist.get("vwap_w")),
                vwap_m=to_float(hist.get("vwap_m")),
                posture=hist.get("posture"),
                plan=hist.get("plan"),
            )
            db.add(snap)

        # Seed live_data with null rows. VIX is a market-wide signal stored under the
        # GLOBAL namespace (read via symbols.get_vix); es_price stays under ES.
        db.add(LiveData(symbol="ES", key="es_price", value=None, source=None,
                        updated_at=datetime.now(timezone.utc)))
        db.add(LiveData(symbol="GLOBAL", key="vix", value=None, source=None,
                        updated_at=datetime.now(timezone.utc)))

        db.commit()
        print(f"Seeded {len(weeks_data)} weeks, {sum(len(w.get('daily',[])) for w in weeks_data)} daily plans, {len(historical_data)} historical snapshots")
        print("Database ready at backend/trading.db")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()
