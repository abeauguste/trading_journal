import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import NewsItem
from ..schemas import NewsResponse, NewsItemOut

logger = logging.getLogger("router.news")
router = APIRouter()


@router.get("/market-moving", response_model=NewsResponse)
def get_market_moving_news(
    hours_ago: int = Query(168, ge=1, le=336),   # default: full 7 days
    min_score: int = Query(7, ge=1, le=10),
    limit: int     = Query(50, ge=1, le=200),
    db: Session    = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
    rows = (
        db.query(NewsItem)
        .filter(NewsItem.score >= min_score)
        .filter(
            (NewsItem.published_at >= cutoff) |
            (NewsItem.published_at.is_(None) & (NewsItem.fetched_at >= cutoff))
        )
        .order_by(NewsItem.score.desc(), NewsItem.fetched_at.desc())
        .limit(limit)
        .all()
    )
    return NewsResponse(
        items=[NewsItemOut.model_validate(r) for r in rows],
        total=len(rows),
        as_of=datetime.now(timezone.utc),
    )


@router.post("/refresh")
async def refresh_news(db: Session = Depends(get_db)):
    """Manual trigger — useful for testing and first-run population."""
    from ..fetchers import fetch_and_score_news
    try:
        inserted = await fetch_and_score_news(db)
        return {"status": "ok", "inserted": inserted, "as_of": datetime.now(timezone.utc).isoformat()}
    except Exception as exc:
        logger.error("Manual news refresh failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
