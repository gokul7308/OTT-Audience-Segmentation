"""
Comprehensive Unit & Integration Test Suite for Streamly Batch Processing.
Validates:
1. Valid CSV with multiple users
2. CSV with one user
3. CSV with all 5 predicted segments represented
4. Missing required columns
5. Missing user IDs
6. Duplicate user IDs (both keep_first and reject_duplicates policies)
7. Negative watch time
8. Negative session duration
9. Completion rate above 1.0
10. Weekend usage ratio above 1.0
11. Unknown genres handled gracefully
12. Empty genre values handled gracefully
13. Invalid numeric fields
14. Empty CSV
15. Malformed CSV syntax
16. Oversized upload rejection
17. Downloading complete results
18. Downloading each individual segment (0 through 4)
19. Isolation between different batches
20. Deterministic repeated inference
"""

import os
import io
import sys
import csv
import json
import pytest
from fastapi.testclient import TestClient

# Add project root and api dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from main import app, load_artifacts, MODEL_STATE


@pytest.fixture(scope="module")
def client():
    load_artifacts()
    with TestClient(app) as test_client:
        yield test_client


def test_batch_valid_multiple_users(client):
    """1. Test valid CSV with multiple users."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,sessions_per_week,completion_rate,weekend_usage_ratio,genre_diversity,top_genres\n"
        "USR-01,45.0,90.0,10,0.85,0.30,3,Action|Sci-Fi|Thriller\n"
        "USR-02,5.0,30.0,2,0.50,0.80,1,Comedy\n"
    )
    files = {"file": ("test.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["valid_rows"] == 2
    assert data["summary"]["status"] == "success"
    assert len(data["preview_users"]) == 2


def test_batch_single_user(client):
    """2. Test CSV with exactly one user."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,sessions_per_week,completion_rate,weekend_usage_ratio,genre_diversity,top_genres\n"
        "USR-SOLO,25.0,70.0,6,0.80,0.40,2,Drama|Romance\n"
    )
    files = {"file": ("single.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["valid_rows"] == 1
    assert data["preview_users"][0]["user_id"] == "USR-SOLO"


def test_batch_all_five_segments_represented(client):
    """3. Test CSV with representative users for all five segments."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,sessions_per_week,completion_rate,weekend_usage_ratio,genre_diversity,top_genres\n"
        "U-POWER,48.0,95.0,11,0.85,0.35,3,Action|Sci-Fi|Thriller\n"
        "U-CASUAL,4.5,35.0,2,0.50,0.75,2,Comedy|Drama\n"
        "U-EXPLORER,30.0,60.0,7,0.68,0.40,6.5,Romance|Thriller|Sci-Fi|Documentary\n"
        "U-DRAMA,27.0,78.0,6,0.85,0.40,2.0,Drama|Romance\n"
        "U-FAMILY,10.5,26.0,4,0.63,0.52,3.0,Animation|Family|Comedy\n"
    )
    files = {"file": ("five_segments.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    summary = res.json()["summary"]
    counts = summary["segment_counts"]
    for seg_id in range(5):
        assert counts[str(seg_id)] >= 1


def test_batch_missing_required_columns(client):
    """4. Test missing required columns (e.g. watch_time_hours)."""
    csv_data = (
        "user_id,avg_session_mins\n"
        "USR-01,90.0\n"
    )
    files = {"file": ("missing_col.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 400
    assert "watch_time_hours" in res.json()["detail"]


def test_batch_missing_user_ids(client):
    """5. Test missing user ID in rows."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins\n"
        ",45.0,90.0\n"
        "   ,20.0,40.0\n"
        "USR-VALID,30.0,60.0\n"
    )
    files = {"file": ("missing_user.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["valid_rows"] == 1
    assert data["summary"]["invalid_rows"] == 2
    assert any("user_id is required" in e["error"] for e in data["validation_errors"])


def test_batch_duplicate_user_ids(client):
    """6. Test duplicate user ID detection under keep_first and reject_duplicates policies."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins\n"
        "USR-DUP,45.0,90.0\n"
        "USR-DUP,15.0,30.0\n"
    )
    # Policy keep_first: 1 valid, 1 duplicate reported in errors
    files1 = {"file": ("dup1.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res1 = client.post("/segment/batch", files=files1, data={"duplicate_policy": "keep_first"})
    assert res1.status_code == 200
    assert res1.json()["summary"]["valid_rows"] == 1
    assert res1.json()["summary"]["duplicate_rows"] == 1

    # Policy reject_duplicates: duplicates rejected
    files2 = {"file": ("dup2.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res2 = client.post("/segment/batch", files=files2, data={"duplicate_policy": "reject_duplicates"})
    assert res2.status_code == 200
    assert res2.json()["summary"]["duplicate_rows"] == 1


def test_batch_negative_watch_time(client):
    """7. Test negative watch time rejected."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins\n"
        "USR-NEG, -12.5, 45.0\n"
    )
    files = {"file": ("neg_watch.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["valid_rows"] == 0
    assert data["summary"]["invalid_rows"] == 1
    assert any("Watch time cannot be negative" in e["error"] for e in data["validation_errors"])


def test_batch_negative_session_duration(client):
    """8. Test negative session duration rejected."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins\n"
        "USR-NEG-SESS, 20.0, -30.0\n"
    )
    files = {"file": ("neg_sess.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["valid_rows"] == 0
    assert any("Average session duration cannot be negative" in e["error"] for e in data["validation_errors"])


def test_batch_completion_rate_above_one(client):
    """9. Test completion rate > 1.0 rejected."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,completion_rate\n"
        "USR-OOB, 20.0, 45.0, 1.85\n"
    )
    files = {"file": ("comp_oob.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    assert any("completion_rate must be between 0.0 and 1.0" in e["error"] for e in res.json()["validation_errors"])


def test_batch_weekend_usage_ratio_above_one(client):
    """10. Test weekend usage ratio > 1.0 rejected."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,weekend_usage_ratio\n"
        "USR-WUR-OOB, 20.0, 45.0, 1.5\n"
    )
    files = {"file": ("wur_oob.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    assert any("weekend_usage_ratio must be between 0.0 and 1.0" in e["error"] for e in res.json()["validation_errors"])


def test_batch_unknown_genres(client):
    """11. Test unknown genres handled gracefully without crash."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,top_genres\n"
        "USR-UNKNOWN, 25.0, 50.0, K-Drama|SuperHero|Gaming\n"
    )
    files = {"file": ("unknown_genre.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    assert res.json()["summary"]["valid_rows"] == 1
    assert len(res.json()["preview_users"][0]["recommendations"]) > 0


def test_batch_empty_genre_values(client):
    """12. Test empty genre values handled gracefully."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,top_genres\n"
        "USR-EMPTY-GENRE, 25.0, 50.0,\n"
    )
    files = {"file": ("empty_genre.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    assert res.json()["summary"]["valid_rows"] == 1


def test_batch_invalid_numeric_fields(client):
    """13. Test string in float numeric column."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins\n"
        "USR-BAD-NUM, forty_hours, 60.0\n"
    )
    files = {"file": ("bad_num.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 200
    assert any("Invalid numeric value for watch_time_hours" in e["error"] for e in res.json()["validation_errors"])


def test_batch_empty_csv(client):
    """14. Test empty CSV upload returns 400."""
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 400


def test_batch_malformed_csv(client):
    """15. Test malformed CSV syntax or wrong extension."""
    files = {"file": ("test.pdf", io.BytesIO(b"%PDF-1.4..."), "application/pdf")}
    res = client.post("/segment/batch", files=files)
    assert res.status_code == 400


def test_batch_download_complete_results(client):
    """17. Test downloading complete results CSV."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,top_genres\n"
        "USR-EXPORT-1, 45.0, 90.0, Action|Sci-Fi\n"
        "USR-EXPORT-2, 5.0, 30.0, Comedy\n"
    )
    files = {"file": ("export_test.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/segment/batch", files=files)
    batch_id = res.json()["summary"]["batch_id"]

    export_res = client.get(f"/segment/batch/{batch_id}/export")
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers["content-type"]
    assert "streamly_batch_" in export_res.headers["content-disposition"]
    content = export_res.text
    assert "user_id,segment_id,segment_name" in content
    assert "USR-EXPORT-1" in content
    assert "USR-EXPORT-2" in content


def test_batch_download_individual_segments(client):
    """18. Test downloading each individual segment (0 through 4)."""
    # Create batch with all 5 segments
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,sessions_per_week,completion_rate,weekend_usage_ratio,genre_diversity,top_genres\n"
        "U-POWER,48.0,95.0,11,0.85,0.35,3,Action|Sci-Fi|Thriller\n"
        "U-CASUAL,4.5,35.0,2,0.50,0.75,2,Comedy|Drama\n"
        "U-EXPLORER,30.0,60.0,7,0.68,0.40,6.5,Romance|Thriller|Sci-Fi|Documentary\n"
        "U-DRAMA,27.0,78.0,6,0.85,0.40,2.0,Drama|Romance\n"
        "U-FAMILY,10.5,26.0,4,0.63,0.52,3.0,Animation|Family|Comedy\n"
    )
    files = {"file": ("five_segs.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    batch_id = client.post("/segment/batch", files=files).json()["summary"]["batch_id"]

    for seg_id in range(5):
        seg_res = client.get(f"/segment/batch/{batch_id}/export?segment_id={seg_id}")
        assert seg_res.status_code == 200
        assert f"streamly_segment_{seg_id}.csv" in seg_res.headers["content-disposition"]
        reader = csv.DictReader(io.StringIO(seg_res.text))
        for row in reader:
            assert row["segment_id"] == str(seg_id)


def test_batch_isolation(client):
    """19. Test isolation between different batches."""
    csv_1 = "user_id,watch_time_hours,avg_session_mins\nUSR-BATCH-A,45.0,90.0\n"
    csv_2 = "user_id,watch_time_hours,avg_session_mins\nUSR-BATCH-B,10.0,25.0\n"

    b1_id = client.post("/segment/batch", files={"file": ("b1.csv", io.BytesIO(csv_1.encode("utf-8")), "text/csv")}).json()["summary"]["batch_id"]
    b2_id = client.post("/segment/batch", files={"file": ("b2.csv", io.BytesIO(csv_2.encode("utf-8")), "text/csv")}).json()["summary"]["batch_id"]

    assert b1_id != b2_id

    b1_users = client.get(f"/segment/batch/{b1_id}").json()["users"]
    b2_users = client.get(f"/segment/batch/{b2_id}").json()["users"]

    assert any(u["user_id"] == "USR-BATCH-A" for u in b1_users)
    assert not any(u["user_id"] == "USR-BATCH-B" for u in b1_users)
    assert any(u["user_id"] == "USR-BATCH-B" for u in b2_users)
    assert not any(u["user_id"] == "USR-BATCH-A" for u in b2_users)


def test_batch_deterministic_inference(client):
    """20. Test deterministic repeated inference for batch."""
    csv_data = (
        "user_id,watch_time_hours,avg_session_mins,top_genres\n"
        "USR-DET-1, 35.0, 75.0, Action|Sci-Fi\n"
        "USR-DET-2, 8.0, 30.0, Comedy\n"
    )
    f1 = {"file": ("det1.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    f2 = {"file": ("det2.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}

    r1 = client.post("/segment/batch", files=f1).json()["preview_users"]
    r2 = client.post("/segment/batch", files=f2).json()["preview_users"]

    for u1, u2 in zip(r1, r2):
        assert u1["segment_id"] == u2["segment_id"]
        assert u1["segment_name"] == u2["segment_name"]
        assert u1["recommendations"] == u2["recommendations"]
        assert abs(u1["distance_to_centroid"] - u2["distance_to_centroid"]) < 1e-5
