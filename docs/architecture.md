# RootCause Architecture Documentation

## Executive Overview
**RootCause** is a deterministic, explainable, real-time resource allocation platform built for emergency operations and disaster relief. During crises (pandemics, natural disasters, power grid collapses), resource distribution must be:
1. **Deterministic & Verifiable**: No arbitrary black-box hallucinations.
2. **Transparent & Explainable**: Mathematical score breakdown with human-readable rationale.
3. **Safety-Guaranteed**: Strict protection of provider safety reserves to prevent localized cascading failures.
4. **Resilient & Real-Time**: Sub-second matching with or without active cloud connectivity.

---

## High-Level System Architecture

```
+-----------------------------------------------------------------------------+
|                               OPERATIONS UI                                 |
|          (React 19 + Vite: Real-time Dashboard, Match Inspector, Logs)     |
+--------------------------------------+--------------------------------------+
                                       |
                                       | REST API (HTTP / JSON)
                                       v
+-----------------------------------------------------------------------------+
|                               FASTAPI BACKEND                               |
|        (/supplies, /demands, /allocate, /allocations, /stats, /seed)        |
+--------------------------------------+--------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
+--------------------------------------+   +----------------------------------+
|      ALLOCATION ENGINE               |   |       EXPLANATION SERVICE        |
| - Hard Constraint Filter             |   | - Local Rule-Based Engine        |
| - Reserve Protection Guard           |   | - Amazon Bedrock (Titan/Claude)  |
| - Haversine Distance Calculator      |   |   Operational Narrative Layer    |
| - 100-Point Scoring Matrix           |   +----------------------------------+
| - Best Match + Alternatives Ranking  |
+--------------------------------------+
                   |
                   v
+--------------------------------------+
|          STORAGE LAYER               |
| - Local In-Memory Storage (Dev/Test) |
| - Amazon DynamoDB (Cloud Deployment) |
+--------------------------------------+
```

---

## Data Flow & Lifecycle Transition

### 1. Demand & Supply Ingestion
- Providers publish available inventory (`resource_type`, `quantity`, `reserve_quantity`, `location`, `latitude`, `longitude`, `available_from`, `available_until`).
- Responders publish urgent demands (`resource_type`, `quantity`, `requester`, `urgency`, `needed_by`, `location`, `latitude`, `longitude`).

### 2. Allocation Pipeline
```
[ Incoming Demand ]
         │
         ▼
[ 1. Hard Eligibility Filter ] ──► (Ineligible? Store explicit rejection reasons)
         │ (Eligible candidates pass)
         ▼
[ 2. Deterministic Scoring Engine ]
         ├─ Resource Compatibility (30 pts)
         ├─ Urgency Weighting (25 pts)
         ├─ Quantity Fulfillment (20 pts)
         ├─ Haversine Distance Proximity (15 pts)
         └─ Time Window Buffer (10 pts)
         │
         ▼
[ 3. Best Candidate Selection ]
         ├─ Top match selected as recommendation
         └─ Next best candidates provided as ranked alternatives
         │
         ▼
[ 4. Explainability Layer ]
         ├─ Local Deterministic Reason Generator
         └─ (Optional) Amazon Bedrock Natural Narrative Synthesis
         │
         ▼
[ 5. Decision & Confirmation ]
         ├─ Accepted: Inventory safely decremented, demand -> 'matched'
         └─ Completed: Demand -> 'fulfilled', transfer verified
```

---

## Design Principles

### Determinism Over Generative Guesswork
Generative models should never decide the numerical allocation of life-critical medical equipment or life-saving supplies. In RootCause, mathematical algorithms execute scoring and constraint enforcement with 100% repeatability. Bedrock is utilized strictly as a natural-language bridge to convey the deterministic mathematical findings to human incident commanders.

### Reserve Quantity Protection
In disaster scenarios, hospital depletion often turns aid facilities into secondary casualty epicenters. RootCause enforces hard reserve thresholds:
$$\text{Usable Quantity} = \text{Total Quantity} - \text{Reserve Quantity}$$
If $\text{Usable Quantity} \le 0$, the facility is strictly excluded from allocation.
