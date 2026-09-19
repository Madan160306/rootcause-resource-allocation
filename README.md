# RootCause: Explainable Real-Time Resource Allocation Engine

[![AWS First Commit 2026](https://img.shields.io/badge/AWS%20First%20Commit-2026-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tests](https://img.shields.io/badge/pytest-22%20passed-success?logo=pytest&logoColor=white)](https://pytest.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Deterministic, explainable, and real-time resource allocation for emergency operations, disaster response, and critical medical shortages.**

---

## 🌟 The Problem
During disasters (hurricanes, pandemics, grid collapse, mass casualty incidents), emergency operations centers struggle to route scarce resources—ambulances, portable generators, oxygen cylinders, trauma blood units—to where they are needed most.

Existing solutions either rely on:
- **Manual, chaotic phone trees** that cause fatal delays.
- **Opaque black-box AI algorithms** that hallucinate numbers, breach hospital safety reserves, or fail to explain *why* facility A was prioritized over facility B.

---

## 🚀 The RootCause Solution

RootCause combines **100% deterministic mathematical scoring** with **transparent factor attribution** and an **Amazon Bedrock explainability layer**:

1. **Deterministic 100-Point Scoring**:
   - **Resource Compatibility (30 pts)**: Strict type matching and normalization.
   - **Urgency Multiplier (25 pts)**: Dynamic weight scaling (`CRITICAL` = 25, `HIGH` = 20, `MEDIUM` = 12, `LOW` = 5).
   - **Quantity Availability (20 pts)**: Full vs partial fulfillment scoring.
   - **Geographic Proximity (15 pts)**: Exact great-circle distance calculated using the **Haversine formula**.
   - **Time Buffer (10 pts)**: Safety margins evaluated against critical operational deadlines.
2. **Mandatory Safety Reserve Protection**:
   - Algorithms enforce: $\text{Usable} = \text{Total Quantity} - \text{Reserve Quantity}$.
   - The engine *strictly refuses* to deplete local safety reserves, preventing secondary facility failure.
3. **Dual-Layer Explainability**:
   - **Local Engine**: Instant, deterministic factor attribution and audit trails without external dependencies.
   - **Amazon Bedrock (Titan/Claude)**: Generates human-readable operational summaries for incident commanders.
4. **End-to-End Lifecycle State Machine**:
   - `Match Found` $\rightarrow$ `Accepted / Reserved` (inventory decremented safely) $\rightarrow$ `In-Transit / Completed`.

---

## 🏗️ System Architecture

```
                        +----------------------------+
                        | Amazon CloudFront / S3     |
                        | (React 19 Operations UI)   |
                        +--------------+-------------+
                                       |
                                       v
                        +----------------------------+
                        | Amazon API Gateway (HTTP)  |
                        +--------------+-------------+
                                       |
                                       v
                        +----------------------------+
                        | AWS Lambda (Python 3.12)   |
                        | (FastAPI + Mangum ASGI)    |
                        +---+--------------------+---+
                            |                    |
             +--------------+                    +--------------+
             v                                                  v
+----------------------------+                     +----------------------------+
| Amazon DynamoDB Tables     |                     | Amazon Bedrock             |
| - Supplies                 |                     | (Titan / Claude)           |
| - Demands                  |                     | AI Natural-Language        |
| - Allocations              |                     | Operational Narratives     |
+----------------------------+                     +----------------------------+
```

---

## ⚡ Quickstart (Local Development)

### 1. Prerequisites
- Python 3.12+
- Node.js 20+ & npm

### 2. Backend Setup
```bash
# Clone and enter directory
cd rootcause-resource-allocation

# Install backend dependencies
pip install -r backend/requirements.txt pytest httpx

# Start FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Comprehensive Test Suite

Run the complete test suite (22 unit, API, and end-to-end integration tests):

```bash
pytest -v
```

### Test Coverage:
- `allocation_engine/tests/test_allocation_engine.py`:
  - Exact resource compatibility validation
  - Incompatible resource rejection
  - Haversine spherical distance calculations
  - Distance score decay curve
  - Quantity fulfillment scoring & partial allowance
  - Urgency weighting differentials
  - Reserve quantity preservation and boundary conditions
  - Expiry and time window validation
  - Deterministic tie-breaking and alternative candidate ranking
- `backend/tests/test_api.py`:
  - Full CRUD for supplies and demands
  - Allocation endpoint testing (by demand ID or inline demand)
  - Rejection reason generation for unmatchable demands
  - Confirmation and completion lifecycle transitions
  - Aggregate dashboard statistics calculation
- `tests/integration/test_end_to_end.py`:
  - Complete end-to-end disaster scenario simulation
  - Seed $\rightarrow$ Match $\rightarrow$ Confirm $\rightarrow$ Inventory deduction $\rightarrow$ Delivery

---

## ☁️ AWS Production Deployment

Deploy with one command using the AWS Serverless Application Model (SAM):

```bash
cd infrastructure
sam build
sam deploy --guided
```

This provisions:
- AWS Lambda Function with FastAPI + Mangum.
- API Gateway HTTP API v2 with CORS.
- 3 Amazon DynamoDB Tables (`rootcause-supplies`, `rootcause-demands`, `rootcause-allocations`).
- IAM Role with Bedrock `InvokeModel` permissions.
- S3 Static Website Hosting bucket for the React UI.

---

## 📖 Documentation
- [Architecture Deep Dive](docs/architecture.md)
- [Deterministic Scoring Rubric & Equations](docs/allocation-algorithm.md)
- [REST API Specification](docs/api.md)
- [3-Minute Hackathon Demo Script](docs/demo-script.md)
- [AWS Deployment Guide](infrastructure/README.md)

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
