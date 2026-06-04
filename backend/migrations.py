import json
import logging
from datetime import timezone
from sqlalchemy import text

logger = logging.getLogger("migrations")


def run_migrations():
    from .database import engine, SessionLocal

    # Add archived column to plan_weeks if missing
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(plan_weeks)"))
            columns = [row[1] for row in result]
            if "archived" not in columns:
                conn.execute(text(
                    "ALTER TABLE plan_weeks ADD COLUMN archived BOOLEAN NOT NULL DEFAULT 0"
                ))
                conn.commit()
                logger.info("Migrations: added 'archived' column to plan_weeks")
        except Exception as exc:
            logger.error("Migration – add archived column failed: %s", exc)

    # Add ttm_wave_a / ttm_wave_b columns to webhook_events if missing
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(webhook_events)"))
            cols = [row[1] for row in result]
            if "ttm_wave_a" not in cols:
                conn.execute(text("ALTER TABLE webhook_events ADD COLUMN ttm_wave_a REAL"))
                conn.commit()
                logger.info("Migrations: added 'ttm_wave_a' column to webhook_events")
            if "ttm_wave_b" not in cols:
                conn.execute(text("ALTER TABLE webhook_events ADD COLUMN ttm_wave_b REAL"))
                conn.commit()
                logger.info("Migrations: added 'ttm_wave_b' column to webhook_events")
        except Exception as exc:
            logger.error("Migration – add ttm_wave columns failed: %s", exc)

    # Add forecast-sourced columns to historical_snapshots if missing
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(historical_snapshots)"))
            cols = [row[1] for row in result]
            new_cols = {
                "week_label":     "TEXT",
                "weekly_bias":    "TEXT",
                "atr_current":    "REAL",
                "vwap_quarterly": "REAL",
                "vwap_yearly":    "REAL",
                "bull_entry":     "REAL",
                "bull_target":    "REAL",
                "bull_stop":      "REAL",
                "bear_entry":     "REAL",
                "bear_target":    "REAL",
                "bear_stop":      "REAL",
                "source":         "TEXT",
            }
            for col_name, col_type in new_cols.items():
                if col_name not in cols:
                    conn.execute(text(
                        f"ALTER TABLE historical_snapshots ADD COLUMN {col_name} {col_type}"
                    ))
                    conn.commit()
                    logger.info("Migrations: added '%s' to historical_snapshots", col_name)
        except Exception as exc:
            logger.error("Migration – historical_snapshots new columns failed: %s", exc)

    # Create trades table if not present
    with engine.connect() as conn:
        try:
            result = conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='trades'")
            )
            if result.fetchone() is None:
                conn.execute(text("""
                    CREATE TABLE trades (
                        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                        entry_order_id      TEXT    NOT NULL,
                        exit_order_id       TEXT    NOT NULL,
                        trade_id_label      TEXT,
                        entry_date          TEXT    NOT NULL,
                        entry_time          TEXT    NOT NULL,
                        exit_date           TEXT    NOT NULL,
                        exit_time           TEXT    NOT NULL,
                        symbol              TEXT    NOT NULL,
                        contract            TEXT,
                        asset_class         TEXT,
                        position_type       TEXT    NOT NULL,
                        entry_price         REAL    NOT NULL,
                        exit_price          REAL    NOT NULL,
                        stop_loss           REAL,
                        take_profit         REAL,
                        position_size       REAL,
                        risk_dollars        REAL,
                        risk_pct            REAL,
                        fees_commission     REAL,
                        slippage            REAL,
                        points              REAL,
                        gross_pnl           REAL,
                        net_pnl             REAL,
                        r_multiple          REAL,
                        duration_min        REAL,
                        duration_hrs        REAL,
                        day_of_week         TEXT,
                        entry_hour          INTEGER,
                        strategy_tag        TEXT,
                        setup_quality       TEXT,
                        trade_quality_score INTEGER,
                        tags                TEXT,
                        week_label          TEXT,
                        notes               TEXT,
                        vwap_posture_at_entry TEXT,
                        atr_regime_at_entry   TEXT,
                        vix_regime_at_entry   TEXT,
                        created_at          DATETIME,
                        updated_at          DATETIME,
                        CONSTRAINT uq_trades_entry_exit_order
                            UNIQUE (entry_order_id, exit_order_id)
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_trades_symbol ON trades (symbol)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_trades_entry_order_id ON trades (entry_order_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_trades_exit_order_id ON trades (exit_order_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_trades_week_label ON trades (week_label)"))
                conn.commit()
                logger.info("Migrations: created 'trades' table")
        except Exception as exc:
            logger.error("Migration – create trades table failed: %s", exc)

    # Archive all existing PlanWeek rows (the old seeded data)
    db = SessionLocal()
    try:
        from .models import PlanWeek
        updated = db.query(PlanWeek).filter(PlanWeek.archived == False).update({"archived": True})
        db.commit()
        if updated:
            logger.info("Migrations: archived %d old PlanWeek rows", updated)
    except Exception as exc:
        logger.error("Migrations – archive rows failed: %s", exc)
    finally:
        db.close()

    # Block 1: Create daily_bars table if missing
    with engine.connect() as conn:
        try:
            result = conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='daily_bars'")
            )
            if result.fetchone() is None:
                conn.execute(text("""
                    CREATE TABLE daily_bars (
                        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                        trade_date          TEXT    NOT NULL UNIQUE,
                        rth_open            REAL,
                        rth_high            REAL,
                        rth_low             REAL,
                        rth_close           REAL,
                        rth_open_time       TEXT,
                        rth_sealed          BOOLEAN DEFAULT 0,
                        globex_high         REAL,
                        globex_low          REAL,
                        globex_open         REAL,
                        is_week_first_day   BOOLEAN DEFAULT 0,
                        is_month_first_day  BOOLEAN DEFAULT 0,
                        weekly_open         REAL,
                        monthly_open        REAL,
                        created_at          DATETIME,
                        updated_at          DATETIME
                    )
                """))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_daily_bars_trade_date ON daily_bars (trade_date)"
                ))
                conn.commit()
                logger.info("Migrations: created 'daily_bars' table")
        except Exception as exc:
            logger.error("Migration – create daily_bars table failed: %s", exc)

    # Block 2: IntelligenceReport new columns
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(intelligence_reports)"))
            cols = [row[1] for row in result]
            new_cols = {
                "day_type":             "TEXT",
                "day_type_confidence":  "REAL",
                "day_type_implication": "TEXT",
                "gap_pts":              "REAL",
                "gap_pct":              "REAL",
            }
            for col_name, col_type in new_cols.items():
                if col_name not in cols:
                    conn.execute(text(
                        f"ALTER TABLE intelligence_reports ADD COLUMN {col_name} {col_type}"
                    ))
                    conn.commit()
                    logger.info("Migrations: added '%s' to intelligence_reports", col_name)
        except Exception as exc:
            logger.error("Migration – intelligence_reports new columns failed: %s", exc)

    # Block 3: Trade new columns
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(trades)"))
            cols = [row[1] for row in result]
            new_cols = {
                "vwap_posture_at_entry": "TEXT",
                "atr_regime_at_entry":   "TEXT",
                "vix_regime_at_entry":   "TEXT",
            }
            for col_name, col_type in new_cols.items():
                if col_name not in cols:
                    conn.execute(text(
                        f"ALTER TABLE trades ADD COLUMN {col_name} {col_type}"
                    ))
                    conn.commit()
                    logger.info("Migrations: added '%s' to trades", col_name)
        except Exception as exc:
            logger.error("Migration – trades new columns failed: %s", exc)

    # Block 4: Back-fill existing trades with market condition data
    db = SessionLocal()
    try:
        from .models import Trade, IntelligenceReport as IR
        un_enriched = db.query(Trade).filter(Trade.vwap_posture_at_entry == None).all()
        if un_enriched:
            for t in un_enriched:
                try:
                    from datetime import datetime as _dt
                    entry_str = f"{t.entry_date} {t.entry_time}"
                    entry_dt = _dt.fromisoformat(entry_str.replace(' ', 'T'))
                    entry_dt_utc = entry_dt.replace(tzinfo=timezone.utc) if entry_dt.tzinfo is None else entry_dt
                    ir = db.query(IR).filter(IR.generated_at <= entry_dt_utc).order_by(IR.generated_at.desc()).first()
                    if ir and ir.report_json and (entry_dt_utc - ir.generated_at.replace(tzinfo=timezone.utc)).total_seconds() <= 86400:
                        rj = json.loads(ir.report_json)
                        summary = rj.get('vwap_posture', {}).get('summary', '')
                        t.vwap_posture_at_entry = summary.split(' — ')[0] if summary else None
                        t.atr_regime_at_entry = ir.atr_regime
                        t.vix_regime_at_entry = ir.vix_regime
                except Exception:
                    pass
            db.commit()
            logger.info("Migrations: back-filled %d trades with market condition data", len(un_enriched))
    except Exception as exc:
        logger.error("Migrations – trade back-fill failed: %s", exc)
    finally:
        db.close()

    # Block 5: daily_bars Opening Range + Prior Week columns
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(daily_bars)"))
            cols = [row[1] for row in result]
            new_cols = {
                "or5_high": "REAL", "or5_low": "REAL", "or5_sealed": "BOOLEAN DEFAULT 0",
                "or15_high": "REAL", "or15_low": "REAL", "or15_sealed": "BOOLEAN DEFAULT 0",
                "pwh": "REAL", "pwl": "REAL",
            }
            for col_name, col_type in new_cols.items():
                if col_name not in cols:
                    conn.execute(text(f"ALTER TABLE daily_bars ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    logger.info("Migrations: added '%s' to daily_bars", col_name)
        except Exception as exc:
            logger.error("Migration – daily_bars OR/PW columns failed: %s", exc)

    # =====================================================================
    # MULTI-SYMBOL (NQ) MIGRATIONS — additive, idempotent. ORDER MATTERS.
    # =====================================================================

    # Block 6: simple ADD COLUMN symbol='ES' on tables that only need a column.
    for table in ["atr_snapshots", "intelligence_reports", "daily_forecasts", "historical_snapshots"]:
        with engine.connect() as conn:
            try:
                result = conn.execute(text(f"PRAGMA table_info({table})"))
                cols = [row[1] for row in result]
                if "symbol" not in cols:
                    conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN symbol TEXT NOT NULL DEFAULT 'ES'"
                    ))
                    conn.commit()
                    logger.info("Migrations: added 'symbol' column to %s", table)
            except Exception as exc:
                logger.error("Migration – add symbol to %s failed: %s", table, exc)

    # Crash-recovery guard for the table-rebuild blocks below. If a prior run died
    # between DROP <table> and RENAME <table>_new, the real table is missing and the
    # _new table holds the migrated data — finish the rename rather than re-running
    # (which would otherwise drop the only surviving copy). If a partial _new orphan
    # exists while the real table is still intact, discard the orphan before rebuilding.
    def _rebuild_recover(conn, table):
        def _exists(t):
            return conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
                {"n": t},
            ).fetchone() is not None
        new = f"{table}_new"
        if not _exists(table) and _exists(new):
            conn.execute(text(f"ALTER TABLE {new} RENAME TO {table}"))
            conn.commit()
            logger.warning("Migrations: recovered %s from interrupted rebuild", table)
        elif _exists(table) and _exists(new):
            conn.execute(text(f"DROP TABLE {new}"))
            conn.commit()
            logger.warning("Migrations: dropped orphan %s before rebuild", new)

    # Block 7: live_data — rebuild to composite PK (symbol, key); VIX → GLOBAL.
    with engine.connect() as conn:
        try:
            _rebuild_recover(conn, "live_data")
            result = conn.execute(text("PRAGMA table_info(live_data)"))
            cols = [row[1] for row in result]
            if "symbol" not in cols:
                conn.execute(text("""
                    CREATE TABLE live_data_new (
                        symbol TEXT NOT NULL DEFAULT 'ES',
                        key TEXT NOT NULL,
                        value REAL,
                        source TEXT,
                        updated_at DATETIME,
                        PRIMARY KEY (symbol, key)
                    )
                """))
                conn.execute(text(
                    "INSERT INTO live_data_new (symbol, key, value, source, updated_at) "
                    "SELECT 'ES', key, value, source, updated_at FROM live_data"
                ))
                conn.execute(text("UPDATE live_data_new SET symbol='GLOBAL' WHERE key='vix'"))
                conn.execute(text("DROP TABLE live_data"))
                conn.execute(text("ALTER TABLE live_data_new RENAME TO live_data"))
                conn.commit()
                logger.info("Migrations: rebuilt live_data with composite (symbol, key) PK")
        except Exception as exc:
            logger.error("Migration – live_data composite PK rebuild failed: %s", exc)

    # Block 8: daily_bars — rebuild adding symbol + UNIQUE(symbol, trade_date).
    with engine.connect() as conn:
        try:
            _rebuild_recover(conn, "daily_bars")
            result = conn.execute(text("PRAGMA table_info(daily_bars)"))
            info = list(result)
            cols = [row[1] for row in info]
            if "symbol" not in cols:
                # Build column definitions dynamically, preserving every existing column.
                type_map = {col[1]: col[2] for col in info}
                col_defs = []
                for name in cols:
                    if name == "id":
                        col_defs.append("id INTEGER PRIMARY KEY AUTOINCREMENT")
                    else:
                        col_defs.append(f"{name} {type_map.get(name) or 'REAL'}")
                col_defs.insert(1, "symbol TEXT NOT NULL DEFAULT 'ES'")
                col_list = ", ".join(col_defs)
                copy_cols = ", ".join(cols)
                conn.execute(text(
                    f"CREATE TABLE daily_bars_new ({col_list}, "
                    f"UNIQUE (symbol, trade_date))"
                ))
                conn.execute(text(
                    f"INSERT INTO daily_bars_new (symbol, {copy_cols}) "
                    f"SELECT 'ES', {copy_cols} FROM daily_bars"
                ))
                conn.execute(text("DROP TABLE daily_bars"))
                conn.execute(text("ALTER TABLE daily_bars_new RENAME TO daily_bars"))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_daily_bars_trade_date ON daily_bars (trade_date)"
                ))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_daily_bars_symbol ON daily_bars (symbol)"
                ))
                conn.commit()
                logger.info("Migrations: rebuilt daily_bars with symbol + UNIQUE(symbol, trade_date)")
        except Exception as exc:
            logger.error("Migration – daily_bars symbol rebuild failed: %s", exc)

    # Block 9: weekly_forecasts — rebuild adding symbol + UNIQUE(symbol, week_label).
    with engine.connect() as conn:
        try:
            _rebuild_recover(conn, "weekly_forecasts")
            result = conn.execute(text("PRAGMA table_info(weekly_forecasts)"))
            info = list(result)
            cols = [row[1] for row in info]
            if "symbol" not in cols:
                type_map = {col[1]: col[2] for col in info}
                col_defs = []
                for name in cols:
                    if name == "id":
                        col_defs.append("id INTEGER PRIMARY KEY AUTOINCREMENT")
                    elif name == "week_label":
                        # drop the old standalone UNIQUE on week_label
                        col_defs.append("week_label TEXT NOT NULL")
                    else:
                        col_defs.append(f"{name} {type_map.get(name) or 'REAL'}")
                col_defs.insert(1, "symbol TEXT NOT NULL DEFAULT 'ES'")
                col_list = ", ".join(col_defs)
                copy_cols = ", ".join(cols)
                conn.execute(text(
                    f"CREATE TABLE weekly_forecasts_new ({col_list}, "
                    f"UNIQUE (symbol, week_label))"
                ))
                conn.execute(text(
                    f"INSERT INTO weekly_forecasts_new (symbol, {copy_cols}) "
                    f"SELECT 'ES', {copy_cols} FROM weekly_forecasts"
                ))
                conn.execute(text("DROP TABLE weekly_forecasts"))
                conn.execute(text("ALTER TABLE weekly_forecasts_new RENAME TO weekly_forecasts"))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_weekly_forecasts_symbol ON weekly_forecasts (symbol)"
                ))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_weekly_forecasts_week_label ON weekly_forecasts (week_label)"
                ))
                conn.commit()
                logger.info("Migrations: rebuilt weekly_forecasts with symbol + UNIQUE(symbol, week_label)")
        except Exception as exc:
            logger.error("Migration – weekly_forecasts symbol rebuild failed: %s", exc)
