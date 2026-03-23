from datetime import datetime, timedelta, timezone


def predict_fill_times(bins, collections):
    """
    Predict when each bin will reach full capacity based on historical fill rates.
    Uses a simple moving average of fill rate changes.
    """
    # Build collection history per bin
    history = {}
    for c in collections:
        bid = c.get("bin_id")
        if bid not in history:
            history[bid] = []
        history[bid].append({
            "timestamp": c.get("timestamp"),
            "fill_before": c.get("fill_level_before", 0),
            "fill_after": c.get("fill_level_after", 0),
        })

    predictions = []
    now = datetime.now(timezone.utc)

    for b in bins:
        bid = b.get("bin_id")
        current_fill = b.get("sensor_data", {}).get("fill_level", 0)
        remaining = 100 - current_fill

        if remaining <= 0:
            predictions.append({
                "bin_id": bid,
                "current_fill": current_fill,
                "predicted_full_at": now.isoformat(),
                "hours_until_full": 0,
                "urgency": "critical",
                "daily_fill_rate": 0,
            })
            continue

        # Calculate average daily fill rate from history
        bin_history = history.get(bid, [])
        if len(bin_history) >= 2:
            total_fill_per_day = 0
            count = 0
            for i in range(len(bin_history) - 1):
                t1 = bin_history[i]["timestamp"]
                t2 = bin_history[i + 1]["timestamp"]
                if isinstance(t1, str):
                    t1 = datetime.fromisoformat(t1)
                if isinstance(t2, str):
                    t2 = datetime.fromisoformat(t2)
                days_diff = max((t2 - t1).total_seconds() / 86400, 0.1)
                fill_diff = bin_history[i + 1]["fill_before"]  # Fill level recovered
                total_fill_per_day += fill_diff / days_diff
                count += 1
            daily_rate = total_fill_per_day / count if count > 0 else 15
        else:
            # Default: assume 15% fill per day for bins without history
            daily_rate = 15

        daily_rate = max(daily_rate, 1)  # At least 1% per day to avoid division by zero
        hours_until_full = (remaining / daily_rate) * 24
        predicted_full = now + timedelta(hours=hours_until_full)

        # Urgency levels
        if hours_until_full <= 6:
            urgency = "critical"
        elif hours_until_full <= 24:
            urgency = "high"
        elif hours_until_full <= 48:
            urgency = "medium"
        else:
            urgency = "low"

        predictions.append({
            "bin_id": bid,
            "current_fill": current_fill,
            "predicted_full_at": predicted_full.isoformat(),
            "hours_until_full": round(hours_until_full, 1),
            "urgency": urgency,
            "daily_fill_rate": round(daily_rate, 1),
        })

    # Sort by urgency (most urgent first)
    urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    predictions.sort(key=lambda p: (urgency_order.get(p["urgency"], 4), p["hours_until_full"]))

    return predictions
