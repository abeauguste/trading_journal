from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import PlanWeek
from ..schemas import WeekOut, WeeklyFields, FieldValue, WeeksResponse, DailyPlanOut

router = APIRouter()


def build_weekly_fields(week: PlanWeek) -> WeeklyFields:
    def fv(val, note=None):
        return FieldValue(value=val, note=note)

    return WeeklyFields(
        es_open_price=fv(week.es_open_price, week.es_open_price_note),
        es_weekly_h1=fv(week.es_weekly_h1, week.es_weekly_h1_note),
        es_weekly_h2=fv(week.es_weekly_h2, week.es_weekly_h2_note),
        es_weekly_l1=fv(week.es_weekly_l1, week.es_weekly_l1_note),
        es_weekly_l2=fv(week.es_weekly_l2, week.es_weekly_l2_note),
        vwap_daily=fv(week.vwap_daily),
        vwap_weekly=fv(week.vwap_weekly),
        vwap_monthly=fv(week.vwap_monthly, week.vwap_monthly_note),
        vwap_quarterly=fv(week.vwap_quarterly, week.vwap_quarterly_note),
        vwap_yearly=fv(week.vwap_yearly, week.vwap_yearly_note),
        buy_level=fv(week.buy_level, week.buy_level_note),
        sell_level=fv(week.sell_level, week.sell_level_note),
        es_monthly_posture=fv(week.es_monthly_posture, week.es_monthly_posture_note),
        es_weekly_posture=fv(week.es_weekly_posture, week.es_weekly_posture_note),
        es_daily_posture=fv(week.es_daily_posture, week.es_daily_posture_note),
        es_monthly_proj_price=fv(week.es_monthly_proj_price, week.es_monthly_proj_note),
        es_weekly_proj_price=fv(week.es_weekly_proj_price, week.es_weekly_proj_note),
        es_daily_proj_price=fv(week.es_daily_proj_price, week.es_daily_proj_note),
        es_green_push=fv(week.es_green_push, week.es_green_push_note),
        es_squeeze=fv(week.es_squeeze, week.es_squeeze_note),
        es_bear_trap_zone=fv(week.es_bear_trap_zone, week.es_bear_trap_zone_note),
        es_bull_trap_zone=fv(week.es_bull_trap_zone, week.es_bull_trap_zone_note),
        vix_monthly_posture=fv(week.vix_monthly_posture, week.vix_monthly_posture_note),
        vix_weekly_posture=fv(week.vix_weekly_posture, week.vix_weekly_posture_note),
        vix_daily_posture=fv(week.vix_daily_posture, week.vix_daily_posture_note),
        vix_monthly_proj_price=fv(week.vix_monthly_proj_price, week.vix_monthly_proj_note),
        vix_weekly_proj_price=fv(week.vix_weekly_proj_price, week.vix_weekly_proj_note),
        vix_daily_proj_price=fv(week.vix_daily_proj_price, week.vix_daily_proj_note),
        major_economic_event=fv(week.major_economic_event, week.major_economic_event_note),
        plan_of_action=fv(week.plan_of_action, week.plan_of_action_note),
    )


def week_to_out(week: PlanWeek) -> WeekOut:
    return WeekOut(
        id=week.id,
        contract=week.contract,
        sheet=week.sheet,
        week_date=week.week_date,
        weekly=build_weekly_fields(week),
        daily=[DailyPlanOut.model_validate(d) for d in sorted(week.daily_plans, key=lambda x: x.day_index)],
    )


@router.get("", response_model=WeeksResponse)
def get_weeks(db: Session = Depends(get_db)):
    weeks = db.query(PlanWeek).filter(PlanWeek.archived == False).order_by(PlanWeek.week_date.asc()).all()
    return WeeksResponse(weeks=[week_to_out(w) for w in weeks])


@router.get("/latest", response_model=WeekOut)
def get_latest_week(db: Session = Depends(get_db)):
    week = db.query(PlanWeek).filter(PlanWeek.archived == False).order_by(PlanWeek.week_date.desc()).first()
    if not week:
        raise HTTPException(status_code=404, detail="No weeks found")
    return week_to_out(week)


@router.get("/{week_id}", response_model=WeekOut)
def get_week(week_id: int, db: Session = Depends(get_db)):
    week = db.query(PlanWeek).filter(PlanWeek.id == week_id, PlanWeek.archived == False).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    return week_to_out(week)
