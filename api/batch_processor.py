"""
Batch CSV Processing, Validation, and Storage Service for Streamly.
Handles CSV validation, vectorized KMeans inference, segment mapping,
rule-based recommendations, and spreadsheet-safe exports.
"""

import os
import io
import csv
import json
import uuid
import time
import re
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

from preprocessing import OTTFeaturePreprocessor, GENRE_LIST, NUMERICAL_FEATURES
from recommendations import generate_recommendations

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_ROW_COUNT = 100_000

# Base directory for storing processed batches
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
BATCH_STORAGE_DIR = os.environ.get(
    "BATCH_STORAGE_DIR",
    os.path.join(PROJECT_ROOT, "data", "batches")
)
os.makedirs(BATCH_STORAGE_DIR, exist_ok=True)


def sanitize_csv_formula(val: Any) -> Any:
    """
    Prevent CSV / Spreadsheet formula injection (CWE-1236).
    If a cell value starts with dangerous characters (=, +, -, @, tab, cr),
    prefix it with an apostrophe.
    """
    if isinstance(val, str):
        if val.startswith(("=", "+", "-", "@", "\t", "\r")):
            return "'" + val
    return val


def parse_genres_field(raw_val: Any) -> List[str]:
    """
    Robustly parse top_genres from various CSV formats:
    - Pipe-separated: 'Action|Sci-Fi|Thriller'
    - Comma-separated: 'Action, Sci-Fi, Thriller'
    - JSON array: '["Action", "Sci-Fi"]'
    - Single genre: 'Action'
    """
    if raw_val is None or pd.isna(raw_val):
        return []
    s = str(raw_val).strip()
    if not s:
        return []
    
    # Try parsing as JSON array
    if s.startswith("[") and s.endswith("]"):
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list):
                return [str(g).strip() for g in parsed if str(g).strip()]
        except Exception:
            pass

    # Split by pipe if present, else comma
    if "|" in s:
        tokens = [t.strip() for t in s.split("|") if t.strip()]
    elif "," in s and not any(f in s for f in ["{", "}"]):
        tokens = [t.strip() for t in s.split(",") if t.strip()]
    else:
        tokens = [s]

    return tokens


class CSVValidationError:
    def __init__(self, row_index: int, user_id: Optional[str], column: str, error: str):
        self.row_index = row_index
        self.user_id = user_id or "UNKNOWN"
        self.column = column
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        return {
            "row_index": self.row_index,
            "user_id": self.user_id,
            "column": self.column,
            "error": self.error,
        }


def validate_and_parse_csv(
    file_bytes: bytes,
    duplicate_policy: str = "keep_first"  # "keep_first" or "reject_duplicates"
) -> Tuple[List[Dict[str, Any]], List[CSVValidationError], Dict[str, int]]:
    """
    Validates CSV content according to Streamly telemetry schema.
    Returns:
      - valid_rows: List of cleaned dicts ready for feature transformation
      - errors: List of CSVValidationError objects
      - counts: Dict of total, valid, invalid, duplicate rows
    """
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"Uploaded file exceeds maximum size limit of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB.")

    # Try utf-8 decoding, fallback to latin-1
    try:
        content = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content = file_bytes.decode("latin-1")

    if not content.strip():
        raise ValueError("The uploaded CSV file is completely empty.")

    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise ValueError("CSV header missing or unreadable.")

    # Check required minimum columns
    fieldnames_lower = {f.strip().lower(): f.strip() for f in reader.fieldnames if f}
    if "user_id" not in fieldnames_lower:
        raise ValueError("CSV must contain a 'user_id' column.")
    if "watch_time_hours" not in fieldnames_lower:
        raise ValueError("CSV must contain a 'watch_time_hours' column.")
    if "avg_session_mins" not in fieldnames_lower:
        raise ValueError("CSV must contain an 'avg_session_mins' column.")

    col_map = {
        "user_id": fieldnames_lower.get("user_id"),
        "watch_time_hours": fieldnames_lower.get("watch_time_hours"),
        "avg_session_mins": fieldnames_lower.get("avg_session_mins"),
        "sessions_per_week": fieldnames_lower.get("sessions_per_week"),
        "completion_rate": fieldnames_lower.get("completion_rate"),
        "weekend_usage_ratio": fieldnames_lower.get("weekend_usage_ratio"),
        "genre_diversity": fieldnames_lower.get("genre_diversity"),
        "top_genres": fieldnames_lower.get("top_genres"),
    }

    valid_rows: List[Dict[str, Any]] = []
    errors: List[CSVValidationError] = []
    seen_user_ids: Dict[str, int] = {}
    total_rows = 0
    duplicate_count = 0

    for idx, row in enumerate(reader, start=2):  # 1-indexed, line 1 is header
        total_rows += 1
        if total_rows > MAX_ROW_COUNT:
            raise ValueError(f"CSV exceeds maximum row limit of {MAX_ROW_COUNT:,} rows.")

        row_errors = []
        user_id_raw = row.get(col_map["user_id"], "")
        user_id = str(user_id_raw).strip() if user_id_raw is not None else ""

        if not user_id:
            row_errors.append(CSVValidationError(idx, "EMPTY", "user_id", "user_id is required and cannot be empty"))

        # Check duplicate user_id
        if user_id:
            if user_id in seen_user_ids:
                duplicate_count += 1
                if duplicate_policy == "reject_duplicates":
                    row_errors.append(CSVValidationError(
                        idx, user_id, "user_id",
                        f"Duplicate user_id detected (first seen at row {seen_user_ids[user_id]})"
                    ))
                # If keep_first, we skip adding this row as valid
                else:
                    errors.append(CSVValidationError(
                        idx, user_id, "user_id",
                        f"Duplicate user_id skipped (retaining first occurrence from row {seen_user_ids[user_id]})"
                    ))
                    continue
            else:
                seen_user_ids[user_id] = idx

        # Parse watch_time_hours
        watch_time = None
        watch_raw = row.get(col_map["watch_time_hours"])
        try:
            if watch_raw is None or str(watch_raw).strip() == "":
                row_errors.append(CSVValidationError(idx, user_id, "watch_time_hours", "watch_time_hours is required"))
            else:
                watch_time = float(watch_raw)
                if watch_time < 0.0:
                    row_errors.append(CSVValidationError(idx, user_id, "watch_time_hours", f"Watch time cannot be negative: {watch_time}"))
                elif watch_time > 1000.0:
                    row_errors.append(CSVValidationError(idx, user_id, "watch_time_hours", f"Watch time exceeds plausible bounds (>1000h): {watch_time}"))
        except (ValueError, TypeError):
            row_errors.append(CSVValidationError(idx, user_id, "watch_time_hours", f"Invalid numeric value for watch_time_hours: '{watch_raw}'"))

        # Parse avg_session_mins
        avg_session = None
        sess_raw = row.get(col_map["avg_session_mins"])
        try:
            if sess_raw is None or str(sess_raw).strip() == "":
                row_errors.append(CSVValidationError(idx, user_id, "avg_session_mins", "avg_session_mins is required"))
            else:
                avg_session = float(sess_raw)
                if avg_session < 0.0:
                    row_errors.append(CSVValidationError(idx, user_id, "avg_session_mins", f"Average session duration cannot be negative: {avg_session}"))
                elif avg_session > 1440.0:
                    row_errors.append(CSVValidationError(idx, user_id, "avg_session_mins", f"Average session duration exceeds 24 hours: {avg_session}"))
        except (ValueError, TypeError):
            row_errors.append(CSVValidationError(idx, user_id, "avg_session_mins", f"Invalid numeric value for avg_session_mins: '{sess_raw}'"))

        # Parse optional sessions_per_week
        sessions_per_wk = None
        spw_col = col_map.get("sessions_per_week")
        if spw_col and spw_col in row and row[spw_col] is not None and str(row[spw_col]).strip() != "":
            try:
                spw_val = float(row[spw_col])
                if spw_val < 0.0 or spw_val > 100.0:
                    row_errors.append(CSVValidationError(idx, user_id, "sessions_per_week", f"sessions_per_week out of valid range [0, 100]: {spw_val}"))
                else:
                    sessions_per_wk = spw_val
            except (ValueError, TypeError):
                row_errors.append(CSVValidationError(idx, user_id, "sessions_per_week", f"Invalid numeric value for sessions_per_week: '{row[spw_col]}'"))

        # Parse optional completion_rate
        completion_rate = None
        cr_col = col_map.get("completion_rate")
        if cr_col and cr_col in row and row[cr_col] is not None and str(row[cr_col]).strip() != "":
            try:
                cr_val = float(row[cr_col])
                if cr_val < 0.0 or cr_val > 1.0:
                    row_errors.append(CSVValidationError(idx, user_id, "completion_rate", f"completion_rate must be between 0.0 and 1.0: {cr_val}"))
                else:
                    completion_rate = cr_val
            except (ValueError, TypeError):
                row_errors.append(CSVValidationError(idx, user_id, "completion_rate", f"Invalid numeric value for completion_rate: '{row[cr_col]}'"))

        # Parse optional weekend_usage_ratio
        weekend_usage_ratio = None
        wur_col = col_map.get("weekend_usage_ratio")
        if wur_col and wur_col in row and row[wur_col] is not None and str(row[wur_col]).strip() != "":
            try:
                wur_val = float(row[wur_col])
                if wur_val < 0.0 or wur_val > 1.0:
                    row_errors.append(CSVValidationError(idx, user_id, "weekend_usage_ratio", f"weekend_usage_ratio must be between 0.0 and 1.0: {wur_val}"))
                else:
                    weekend_usage_ratio = wur_val
            except (ValueError, TypeError):
                row_errors.append(CSVValidationError(idx, user_id, "weekend_usage_ratio", f"Invalid numeric value for weekend_usage_ratio: '{row[wur_col]}'"))

        # Parse optional genre_diversity
        genre_diversity = None
        gd_col = col_map.get("genre_diversity")
        if gd_col and gd_col in row and row[gd_col] is not None and str(row[gd_col]).strip() != "":
            try:
                gd_val = float(row[gd_col])
                if gd_val < 0.0 or gd_val > 20.0:
                    row_errors.append(CSVValidationError(idx, user_id, "genre_diversity", f"genre_diversity must be >= 0: {gd_val}"))
                else:
                    genre_diversity = gd_val
            except (ValueError, TypeError):
                row_errors.append(CSVValidationError(idx, user_id, "genre_diversity", f"Invalid numeric value for genre_diversity: '{row[gd_col]}'"))

        # Parse top_genres
        top_genres = []
        tg_col = col_map.get("top_genres")
        if tg_col and tg_col in row:
            top_genres = parse_genres_field(row[tg_col])

        if row_errors:
            errors.extend(row_errors)
        else:
            # Impute or infer optional attributes consistently with single inference
            if sessions_per_wk is None:
                if avg_session and avg_session > 0:
                    estimated = (watch_time * 60.0) / avg_session / 4.0
                    sessions_per_wk = max(1.0, min(14.0, estimated))
                else:
                    sessions_per_wk = 3.0

            valid_rows.append({
                "row_index": idx,
                "user_id": user_id,
                "watch_time_hours": watch_time,
                "avg_session_mins": avg_session,
                "sessions_per_week": round(sessions_per_wk, 2),
                "completion_rate": completion_rate,  # None will be imputed by preprocessor
                "weekend_usage_ratio": weekend_usage_ratio if weekend_usage_ratio is not None else 0.48,
                "genre_diversity": genre_diversity if genre_diversity is not None else max(1.0, float(len(top_genres))),
                "top_genres": top_genres,
                "top_genres_str": "|".join(top_genres),
            })

    counts = {
        "total_rows": total_rows,
        "valid_rows": len(valid_rows),
        "invalid_rows": len({e.row_index for e in errors}),
        "duplicate_rows": duplicate_count,
    }
    return valid_rows, errors, counts


def process_batch(
    valid_rows: List[Dict[str, Any]],
    preprocessor: OTTFeaturePreprocessor,
    kmeans_model: Any,
    segment_metadata: Dict[str, Any],
    batch_id: Optional[str] = None,
    filename: str = "uploaded_audience.csv",
    validation_errors: Optional[List[CSVValidationError]] = None,
    total_csv_rows: int = 0,
    duplicate_rows: int = 0,
) -> Dict[str, Any]:
    """
    Executes vectorized batch inference using the persisted preprocessor and KMeans model.
    Generates recommendations for each user and organizes users by segment.
    Saves batch artifacts to BATCH_STORAGE_DIR.
    """
    start_time = time.time()
    batch_id = batch_id or f"batch_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    batch_dir = os.path.join(BATCH_STORAGE_DIR, batch_id)
    os.makedirs(batch_dir, exist_ok=True)

    if not valid_rows:
        summary = {
            "batch_id": batch_id,
            "filename": filename,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_rows": total_csv_rows,
            "valid_rows": 0,
            "invalid_rows": len({e.row_index for e in (validation_errors or [])}),
            "duplicate_rows": duplicate_rows,
            "processed_rows": 0,
            "processing_duration_ms": int((time.time() - start_time) * 1000),
            "status": "completed_empty",
            "segment_counts": {str(i): 0 for i in range(5)},
            "segment_percentages": {str(i): 0.0 for i in range(5)},
        }
        with open(os.path.join(batch_dir, "summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        save_errors_file(batch_dir, validation_errors or [])
        return {"summary": summary, "users": [], "validation_errors": [e.to_dict() for e in (validation_errors or [])]}

    # Prepare DataFrame for vectorized preprocessing
    df_input = pd.DataFrame([
        {
            "user_id": r["user_id"],
            "watch_time_hours": r["watch_time_hours"],
            "avg_session_mins": r["avg_session_mins"],
            "sessions_per_week": r["sessions_per_week"],
            "completion_rate": r["completion_rate"] if r["completion_rate"] is not None else preprocessor.median_completion_rate,
            "weekend_usage_ratio": r["weekend_usage_ratio"],
            "genre_diversity": r["genre_diversity"],
            "top_genres": r["top_genres_str"],
        }
        for r in valid_rows
    ])

    # Transform without refitting
    X_matrix = preprocessor.transform(df_input)
    predictions = kmeans_model.predict(X_matrix)
    distances_matrix = kmeans_model.transform(X_matrix)

    processed_users = []
    segment_counts = {str(i): 0 for i in range(5)}

    for idx, r in enumerate(valid_rows):
        seg_id = int(predictions[idx])
        segment_counts[str(seg_id)] = segment_counts.get(str(seg_id), 0) + 1
        dist = float(distances_matrix[idx][seg_id])

        meta = segment_metadata.get(str(seg_id), {})
        seg_name = meta.get("segment_name", f"Segment-{seg_id}")
        rec_genres = meta.get("recommended_genres", ["Drama", "Comedy"])

        # Explainable persona match summary
        match_explanation = f"Matches '{seg_name}' based on {r['watch_time_hours']:.1f}h monthly watch time, " \
                            f"{r['avg_session_mins']:.0f}m avg session, and preferences in {', '.join(r['top_genres'][:3]) or 'general catalog'}."

        recs = generate_recommendations(
            segment_name=seg_name,
            recommended_genres=rec_genres,
            user_top_genres=r["top_genres"],
            limit=4,
        )

        user_record = {
            "user_id": r["user_id"],
            "row_index": r["row_index"],
            "segment_id": seg_id,
            "segment_name": seg_name,
            "distance_to_centroid": round(dist, 4),
            "watch_time_hours": r["watch_time_hours"],
            "avg_session_mins": r["avg_session_mins"],
            "sessions_per_week": r["sessions_per_week"],
            "completion_rate": round(df_input.loc[idx, "completion_rate"], 3),
            "weekend_usage_ratio": round(r["weekend_usage_ratio"], 3),
            "genre_diversity": round(r["genre_diversity"], 1),
            "top_genres": r["top_genres"],
            "recommendations": recs,
            "match_explanation": match_explanation,
        }
        processed_users.append(user_record)

    total_valid = len(processed_users)
    segment_percentages = {
        str(i): round((segment_counts.get(str(i), 0) / total_valid) * 100, 1) if total_valid > 0 else 0.0
        for i in range(5)
    }

    duration_ms = int((time.time() - start_time) * 1000)

    summary = {
        "batch_id": batch_id,
        "filename": filename,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_rows": total_csv_rows,
        "valid_rows": total_valid,
        "invalid_rows": len({e.row_index for e in (validation_errors or [])}),
        "duplicate_rows": duplicate_rows,
        "processed_rows": total_valid,
        "processing_duration_ms": duration_ms,
        "status": "success",
        "segment_counts": segment_counts,
        "segment_percentages": segment_percentages,
    }

    # Save artifacts to batch directory
    with open(os.path.join(batch_dir, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    with open(os.path.join(batch_dir, "users.json"), "w", encoding="utf-8") as f:
        json.dump(processed_users, f, indent=2)

    # Save complete results CSV (with formula sanitization)
    save_users_csv(os.path.join(batch_dir, "results.csv"), processed_users)

    # Save per-segment CSVs
    for seg_id in range(5):
        seg_users = [u for u in processed_users if u["segment_id"] == seg_id]
        save_users_csv(os.path.join(batch_dir, f"segment_{seg_id}.csv"), seg_users)

    # Save error records
    save_errors_file(batch_dir, validation_errors or [])

    return {
        "summary": summary,
        "users": processed_users,
        "validation_errors": [e.to_dict() for e in (validation_errors or [])],
    }


def save_users_csv(filepath: str, users: List[Dict[str, Any]]):
    """Save processed user records as spreadsheet-safe CSV."""
    fieldnames = [
        "user_id",
        "segment_id",
        "segment_name",
        "distance_to_centroid",
        "watch_time_hours",
        "avg_session_mins",
        "sessions_per_week",
        "completion_rate",
        "weekend_usage_ratio",
        "genre_diversity",
        "top_genres",
        "recommendations",
    ]
    with open(filepath, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for u in users:
            writer.writerow({
                "user_id": sanitize_csv_formula(u.get("user_id")),
                "segment_id": u.get("segment_id"),
                "segment_name": sanitize_csv_formula(u.get("segment_name")),
                "distance_to_centroid": u.get("distance_to_centroid"),
                "watch_time_hours": u.get("watch_time_hours"),
                "avg_session_mins": u.get("avg_session_mins"),
                "sessions_per_week": u.get("sessions_per_week"),
                "completion_rate": u.get("completion_rate"),
                "weekend_usage_ratio": u.get("weekend_usage_ratio"),
                "genre_diversity": u.get("genre_diversity"),
                "top_genres": sanitize_csv_formula("|".join(u.get("top_genres", []))),
                "recommendations": sanitize_csv_formula("; ".join(u.get("recommendations", []))),
            })


def save_errors_file(batch_dir: str, errors: List[CSVValidationError]):
    """Save validation errors in JSON and CSV formats."""
    err_dicts = [e.to_dict() if isinstance(e, CSVValidationError) else e for e in errors]
    with open(os.path.join(batch_dir, "errors.json"), "w", encoding="utf-8") as f:
        json.dump(err_dicts, f, indent=2)

    err_csv_path = os.path.join(batch_dir, "errors.csv")
    with open(err_csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["row_index", "user_id", "column", "error"])
        writer.writeheader()
        for e in err_dicts:
            writer.writerow({
                "row_index": e.get("row_index"),
                "user_id": sanitize_csv_formula(e.get("user_id")),
                "column": sanitize_csv_formula(e.get("column")),
                "error": sanitize_csv_formula(e.get("error")),
            })


def get_batch_summary(batch_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve summary of a specific batch."""
    summary_path = os.path.join(BATCH_STORAGE_DIR, batch_id, "summary.json")
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def get_batch_users(
    batch_id: str,
    segment_id: Optional[int] = None,
    genre: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "user_id",
    sort_desc: bool = False,
    page: int = 1,
    page_size: int = 50,
) -> Tuple[List[Dict[str, Any]], int]:
    """Retrieve filtered, sorted, paginated users for a batch."""
    users_path = os.path.join(BATCH_STORAGE_DIR, batch_id, "users.json")
    if not os.path.exists(users_path):
        return [], 0

    with open(users_path, "r", encoding="utf-8") as f:
        users = json.load(f)

    # Filter by segment
    if segment_id is not None and 0 <= segment_id <= 4:
        users = [u for u in users if u.get("segment_id") == segment_id]

    # Filter by genre
    if genre and genre.strip():
        g_clean = genre.strip().lower()
        users = [u for u in users if any(g_clean == str(g).lower() for g in u.get("top_genres", []))]

    # Filter by search string in user_id
    if search and search.strip():
        s_clean = search.strip().lower()
        users = [u for u in users if s_clean in str(u.get("user_id", "")).lower()]

    # Sort
    valid_sort_keys = {
        "user_id", "watch_time_hours", "avg_session_mins", "sessions_per_week",
        "completion_rate", "weekend_usage_ratio", "distance_to_centroid", "segment_id"
    }
    actual_sort = sort_by if sort_by in valid_sort_keys else "user_id"
    users.sort(key=lambda x: (x.get(actual_sort) is None, x.get(actual_sort, 0)), reverse=sort_desc)

    total_count = len(users)
    start_idx = max(0, (page - 1) * page_size)
    end_idx = start_idx + page_size
    return users[start_idx:end_idx], total_count


def list_all_batches() -> List[Dict[str, Any]]:
    """List all stored batches sorted newest first."""
    batches = []
    if not os.path.exists(BATCH_STORAGE_DIR):
        return []

    for entry in os.scandir(BATCH_STORAGE_DIR):
        if entry.is_dir():
            summary_path = os.path.join(entry.path, "summary.json")
            if os.path.exists(summary_path):
                try:
                    with open(summary_path, "r", encoding="utf-8") as f:
                        batches.append(json.load(f))
                except Exception:
                    pass

    batches.sort(key=lambda b: b.get("created_at", ""), reverse=True)
    return batches


def get_latest_batch_id() -> Optional[str]:
    """Return the ID of the most recently processed batch."""
    batches = list_all_batches()
    return batches[0]["batch_id"] if batches else None
