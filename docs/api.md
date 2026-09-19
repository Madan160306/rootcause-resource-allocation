# RootCause REST API Reference

The RootCause backend is built with FastAPI. All endpoints return and accept JSON.

Base URL: `http://localhost:8000` (Local) or API Gateway URL (Cloud)

---

## Health & Platform Info

### `GET /`
Returns platform metadata and running status.

### `GET /health`
Returns system health check and Bedrock integration state.

---

## Supplies Management

### `GET /supplies`
List all registered supplies.

### `POST /supplies`
Create a new supply item.
**Request Body:**
```json
{
  "resource_type": "Oxygen Cylinder",
  "quantity": 50,
  "reserve_quantity": 10,
  "provider": "Metro General Hospital",
  "location": "Downtown Center",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "available_from": "2026-09-19T00:00:00Z",
  "available_until": "2026-09-22T23:59:59Z",
  "status": "available",
  "provider_reliability": 0.98
}
```

### `GET /supplies/{id}`
Retrieve details for a single supply item.

### `DELETE /supplies/{id}`
Delete a supply record.

---

## Demands Management

### `GET /demands`
List all emergency demands.

### `POST /demands`
Submit an emergency demand request.
**Request Body:**
```json
{
  "resource_type": "Oxygen Cylinder",
  "quantity": 20,
  "requester": "Riverside Community Clinic",
  "location": "Manhattan West",
  "latitude": 40.7200,
  "longitude": -74.0100,
  "urgency": "CRITICAL",
  "needed_by": "2026-09-20T12:00:00Z"
}
```

### `GET /demands/{id}`
Retrieve a specific demand.

### `DELETE /demands/{id}`
Delete a demand request.

---

## Allocation & Explainability

### `POST /allocate`
Run deterministic matching algorithm against active inventory.
**Request Body (By ID):**
```json
{
  "demand_id": 1,
  "allow_partial": false
}
```
**Or Inline Demand:**
```json
{
  "demand": {
    "resource_type": "Generator",
    "quantity": 2,
    "requester": "Field Clinic",
    "location": "Queens",
    "latitude": 40.72,
    "longitude": -73.80,
    "urgency": "HIGH"
  },
  "allow_partial": false
}
```

**Response (`MATCH_FOUND`):**
```json
{
  "status": "MATCH_FOUND",
  "recommendation": {
    "supply_id": 1,
    "provider": "Metro General Hospital",
    "allocated_quantity": 20,
    "score": 98.2,
    "distance_km": 1.2,
    "breakdown": {
      "resource_compatibility": 30.0,
      "urgency_weight": 25.0,
      "quantity_availability": 20.0,
      "geographic_distance": 14.8,
      "time_compatibility": 8.4
    },
    "reasons": [
      "Exact resource match (Oxygen Cylinder)",
      "Proximity match: 1.2 km away",
      "Full fulfillment capacity (20 units)",
      "Provider safety reserve of 10 units preserved"
    ]
  },
  "alternatives": [ ... ],
  "explanation": "The system recommends Metro General Hospital with an allocation score of 98.2/100...",
  "allocation_id": 1
}
```

### `GET /allocations`
List all created allocation recommendations and history.

### `POST /allocations/{id}/confirm`
Confirm an allocation recommendation. Deducts supply inventory safely and marks demand as `matched`.

### `POST /allocations/{id}/complete`
Mark allocation transfer completed and demand as `fulfilled`.

### `GET /stats`
Get live KPI operational numbers for dashboard.

### `POST /seed`
Instantly loads demo emergency supplies and demands.
