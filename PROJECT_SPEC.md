# Project Specification & Architecture Overview

**Project Name:** RootCause — Explainable Real-Time Resource Allocation Engine  
**Event:** AWS First Commit 2026  
**Status:** Feature Complete & Verified  
**License:** MIT  

---

## 1. Executive Summary & Problem Statement

During emergency scenarios—including natural disasters, regional grid failures, and mass-casualty triage—coordinating and dispatching critical medical and operational assets (oxygen cylinders, emergency backup generators, ambulances, trauma kits, and blood units) is severely hampered by two extremes:

1. **Chaotic Manual Processes:** Phone trees and ad-hoc spreadsheets lead to deadly allocation delays and misallocated equipment.
2. **Black-Box AI Models:** Pure generative LLMs cannot be trusted to assign numerical, life-or-death inventory; they risk hallucinations, ignore facility safety margins, and cannot provide mathematical guarantees.

### The RootCause Mission
RootCause solves this crisis with a **hybrid deterministic-generative architecture**:
- **100% Deterministic Mathematical Engine:** Enforces hard boundary constraints, guards mandatory safety reserves, and calculates verifiable multi-attribute scores.
- **Explainability Layer:** Uses Amazon Bedrock (Titan/Claude) and a deterministic fallback to translate mathematical rankings into natural-language narratives for incident commanders.

---

## 2. Core Functional Requirements & Specifications

### 2.1 Hard Eligibility Constraints (Zero Tolerance)
Before soft scoring begins, every candidate supply is subjected to strict binary elimination:
1. **Resource Type Match:** Case-insensitive, whitespace-trimmed exact type matching.
2. **Safety Reserve Guard:**
   $$\text{Usable Quantity} = \text{Total Quantity} - \text{Reserve Quantity} > 0$$
   *The system strictly refuses to allocate or deplete local safety reserves, preventing secondary facility failure.*
3. **Fulfillment Threshold:**
   - Strict Mode: $\text{Usable Quantity} \ge \text{Requested Quantity}$
   - Partial Mode (`allow_partial = True`): $\text{Usable Quantity} > 0$
4. **Temporal Availability Window:**
   $$\text{Available From} \le \text{Needed By} \le \text{Available Until}$$
5. **Operational State:** Provider status must be `"available"`.

---

### 2.2 100-Point Deterministic Scoring Rubric

Total score $S \in [0, 100]$ is computed as:
$$S = S_{\text{compat}} + S_{\text{urgency}} + S_{\text{qty}} + S_{\text{dist}} + S_{\text{time}}$$

| Factor | Max Points | Attribution Logic |
| :--- | :---: | :--- |
| **Resource Compatibility** | **30** | Exact verified resource type match = 30 pts. |
| **Urgency Weighting** | **25** | Prioritizes highest stakes: `CRITICAL` = 25, `HIGH` = 20, `MEDIUM` = 12, `LOW` = 5. |
| **Quantity Fulfillment** | **20** | Full fulfillment = 20 pts. Partial capacity scaled linearly: $\min\left(20, \frac{\text{Usable}}{\text{Requested}} \times 20\right)$. |
| **Geographic Proximity** | **15** | Great-circle distance $d$ (km) calculated via the **Haversine Formula**: <br> $S_{\text{dist}} = 15 \times \max\left(0, 1 - \frac{d}{100}\right)$. |
| **Time Window Buffer** | **10** | Lead-time buffer prior to deadline: $>24\text{h}$ = 10 pts, $6-24\text{h}$ = 7 pts, $<6\text{h}$ = 4 pts. |

---

### 2.3 Alternative Providers Ranking
The engine ranks all eligible providers descending by score. The highest-scoring candidate is designated as the primary **Recommendation**, while the subsequent top candidates are preserved as **Ranked Alternatives**, providing incident commanders with immediate fallback options.

---

### 2.4 State Machine & Lifecycle Management
Every allocation recommendation follows a strict lifecycle state machine to eliminate double-allocation:

```
[ Unassigned Demand ]
         │
         ▼  (POST /allocate)
[ Draft Match Recommendation ]
         │
         ▼  (POST /allocations/{id}/confirm)
[ Accepted / In-Transit ] ──► (Provider inventory decremented; reserve protected)
         │
         ▼  (POST /allocations/{id}/complete)
[ Completed / Delivered ] ──► (Demand marked fulfilled; transfer confirmed)
```

---

## 3. System Architecture

```
+-----------------------------------------------------------------------------+
|                          OPERATIONS WEB APPLICATION                         |
|      (React 19, Vite, Syne/Inter/JetBrains Mono Design System, Lucide)      |
+--------------------------------------+--------------------------------------+
                                       │
                                       ▼ REST API (HTTP / JSON)
+-----------------------------------------------------------------------------+
|                       AMAZON API GATEWAY (HTTP API v2)                      |
+--------------------------------------+--------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
|                          AWS LAMBDA (Python 3.12)                           |
|                      FastAPI Application via Mangum                         |
+-------------------+-------------------------------------+-------------------+
                    │                                     │
                    ▼                                     ▼
+---------------------------------------+ +-----------------------------------+
|      ALLOCATION ENGINE (Domain)       | |        EXPLANATION SERVICE        |
| - Hard Constraint Eligibility Filter  | | - Local Rule-Based Generator      |
| - 100-Pt Deterministic Scoring Matrix | | - Amazon Bedrock (Titan / Claude) |
| - Haversine Distance Calculator       | |   Natural Narrative Synthesis     |
| - Ranked Alternatives Selector        | +-----------------------------------+
+-------------------+-------------------+
                    │
                    ▼
+-----------------------------------------------------------------------------+
|                           STORAGE ABSTRACTION                               |
| - Local In-Memory Storage (Dev / Testing)                                   |
| - Amazon DynamoDB Tables: Supplies, Demands, Allocations (Cloud Prod)       |
+-----------------------------------------------------------------------------+
```

---

## 4. Data Models (Pydantic / JSON Schemas)

### `Supply`
```typescript
interface Supply {
  id?: number;
  resource_type: string;           // e.g., "Oxygen Cylinder", "Ambulance", "Generator"
  quantity: number;                // Total physical units (> 0)
  reserve_quantity: number;        // Protected units (cannot exceed total quantity)
  provider: string;                // Facility name
  location: string;                // Human-readable address / sector
  latitude?: number;
  longitude?: number;
  available_from?: string;         // ISO 8601 UTC
  available_until?: string;        // ISO 8601 UTC
  status: "available" | "reserved" | "depleted" | "inactive";
  provider_reliability?: number;  // 0.0 to 1.0 (default 1.0)
}
```

### `Demand`
```typescript
interface Demand {
  id?: number;
  resource_type: string;
  quantity: number;
  requester: string;
  location: string;
  latitude?: number;
  longitude?: number;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  needed_by?: string;              // ISO 8601 UTC
  status: "pending" | "matched" | "fulfilled" | "cancelled";
  created_at?: string;
}
```

### `Allocation`
```typescript
interface Allocation {
  id?: number;
  demand_id: number;
  supply_id: number;
  provider: string;
  requester: string;
  allocated_quantity: number;
  score: number;                   // 0.0 to 100.0
  breakdown?: Record<string, number>;
  reasons: string[];
  created_at?: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  explanation?: string;
}
```

---

## 5. REST API Interface

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Platform metadata, version, and running status. |
| `GET` | `/health` | Health check and Bedrock status check. |
| `GET` | `/supplies` | List all cataloged supplies. |
| `POST` | `/supplies` | Register new inventory with protected reserve. |
| `GET` | `/supplies/{id}` | Retrieve details for a single supply. |
| `DELETE` | `/supplies/{id}` | Delete a supply item. |
| `GET` | `/demands` | List all registered emergency demands. |
| `POST` | `/demands` | Publish an emergency demand with urgency level. |
| `GET` | `/demands/{id}` | Retrieve details for a single demand. |
| `DELETE` | `/demands/{id}` | Delete a demand item. |
| `POST` | `/allocate` | Run deterministic matching engine for a demand. |
| `GET` | `/allocations` | List all allocation recommendations and transfer history. |
| `POST` | `/allocations/{id}/confirm` | Confirm match: locks quantity and decrements stock. |
| `POST` | `/allocations/{id}/complete` | Complete transfer: marks demand fulfilled. |
| `GET` | `/stats` | Aggregate metrics for real-time dashboard. |
| `POST` | `/seed` | Seed realistic disaster triage scenario data. |
| `POST` | `/reset` | Clear all data stores for clean test isolation. |

---

## 6. Design System Specification

| Token Category | Value | Application |
| :--- | :--- | :--- |
| **Background** | `#0A0A0C` | Root application canvas |
| **Surface** | `#131316` | Panels, cards, header, forms |
| **Raised** | `#1A1A1F` | Item cards, inputs, buttons, nested containers |
| **Border** | `rgba(255, 255, 255, 0.06)` | Universal divider lines & borders |
| **Single Accent** | `#C9A961` (Gold) | Primary action buttons and active navigation tab only |
| **Typography - Primary**| `#EDEAE3` (Off-white) | Titles, values, body text |
| **Typography - Muted**  | `#8A8780` | Subtitles, labels, secondary metadata |
| **Badges - Critical** | `#E5484D` / `rgba(229, 72, 77, 0.12)` bg | Critical urgency badges |
| **Badges - High** | `#F5A524` / `rgba(245, 165, 36, 0.12)` bg | High urgency badges |
| **Badges - OK** | `#3DD68C` / `rgba(61, 214, 140, 0.12)` bg | Fulfilled / completed / matched badges |
| **Fonts - Heading** | `Syne` | Screen titles (28px), panel titles |
| **Fonts - Body** | `Inter` | Descriptions, labels, button text |
| **Fonts - Monospace** | `JetBrains Mono` | Numbers, scores, coordinates, timestamps |
| **Corner Radii** | `10px` cards / `6px` buttons | No gradients across entire UI |

---

## 7. Cloud Infrastructure Specification (AWS SAM)

- **AWS Lambda:** Python 3.12, 512MB RAM, 30s timeout, running FastAPI via [`Mangum`](file:///C:/Users/madan/rootcause-resource-allocation/backend/lambda_handler.py).
- **Amazon API Gateway:** HTTP API v2 with wildcard CORS.
- **Amazon DynamoDB:** Pay-Per-Request On-Demand tables (`rootcause-supplies`, `rootcause-demands`, `rootcause-allocations`) with GSIs on `resource_type`, `status`, and `demand_id`.
- **Amazon Bedrock:** Scoped IAM policy to `bedrock:InvokeModel` for Claude / Titan text models.
- **Amazon S3:** Static web hosting for production Vite React distribution.

---

## 8. Quality Assurance & Test Verification

All **22 tests** pass with 100% success rate:
- **13 Engine Tests:** Compatibility, reserve guards, distance calculation, urgency scaling, expiration, and alternatives ranking.
- **6 API Tests:** CRUD, matching validation, rejection error reporting, and lifecycle transitions.
- **3 Integration Tests:** End-to-end disaster triage simulation from initial seed to final delivery.
- **Linter:** `oxlint` passes with **0 errors and 0 warnings**.
- **Build:** `vite build` creates production bundles in sub-second execution.
