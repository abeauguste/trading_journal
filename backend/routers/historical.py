from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import HistoricalSnapshot
from ..schemas import HistoricalResponse, HistoricalSnapshotOut
from ..symbols import validate_symbol

router = APIRouter()


@router.get("", response_model=HistoricalResponse)
def get_historical(symbol: str = "ES", db: Session = Depends(get_db)):
    sym = validate_symbol(symbol)
    if sym is None:
        raise HTTPException(status_code=400, detail=f"Unknown symbol: {symbol}")
    snaps = db.query(HistoricalSnapshot).filter(HistoricalSnapshot.symbol == sym).order_by(HistoricalSnapshot.date.asc(), HistoricalSnapshot.id.asc()).all()
    return HistoricalResponse(historical=[HistoricalSnapshotOut.model_validate(s) for s in snaps])
