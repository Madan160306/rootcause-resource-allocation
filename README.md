# RootCause: Explainable Real-Time Resource Allocation Engine

[![AWS First Commit 2026](https://img.shields.io/badge/AWS%20First%20Commit-2026-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tests](https://img.shields.io/badge/pytest-22%20passed-success?logo=pytest&logoColor=white)](https://pytest.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> An explainable, constraint-aware resource allocation and decision-support engine for emergency operations, disaster response, and critical resource shortages.

---

## Overview

RootCause is an explainable, constraint-aware resource allocation and decision-support engine. It does not simply search for available resources. It implements a multi-stage decision pipeline that evaluates incoming emergency demand against available supplies, enforces operational boundaries, deterministically scores eligible candidates, and produces human-readable operational explanations.

The core workflow operates as follows:

```
Demand
  +--> Candidate supply evaluation
        +--> Hard constraint filtering
              +--> Deterministic allocation scoring
                    +--> Best allocation recommendation
                          +--> Human-readable explanation
                                +--> Operational transfer lifecycle
                                      +--> Audit trail
```

---

## The Problem

Emergency and disaster resource coordination presents complex operational challenges:

- **Fragmented resource information**: Supply levels and location data are distributed across isolated healthcare, municipal, and emergency facilities.
- **Manual coordination overhead**: Dispatchers must manually cross-reference availability, facility readiness, and transit distances under time pressure.
- **Competing demands**: Multiple emergency requests compete simultaneously for the same limited pool of assets (such as ambulances, portable generators, oxygen cylinders, medical kits, or blood units).
- **Urgency differences**: Urgent demands require prioritization over lower-acuity requests without dropping pending needs.
- **Quantity constraints**: Facilities rarely match requested quantities exactly, requiring evaluation of complete versus partial fulfillment.
- **Protected reserve requirements**: Facilities must retain a mandatory baseline safety stock to protect their local readiness.
- **Geographic distance**: Resources must be evaluated based on great-circle transit distance.
- **Availability and deadline constraints**: Medical supplies must be valid and ready for transfer before the incident deadline expires.
- **Difficulty explaining selections**: Incident commanders need clear explanations of why one provider was selected over another.

RootCause resolves these operational hurdles through deterministic mathematical matching paired with an explainability layer.

---

## The RootCause Solution

RootCause pairs a deterministic allocation engine with an Amazon Bedrock explainability layer.

The deterministic allocation engine is responsible for making the allocation decision and calculating scores. Amazon Bedrock only generates the natural-language explanation from the structured output of the deterministic engine.

```
Deterministic Allocation Engine
  +--> Produces structured decision, candidate scores, and verification reasons
        +--> Amazon Bedrock generates natural-language operational explanation
```

If Amazon Bedrock is unavailable, the deterministic structured reasons remain authoritative.

### Deterministic Scoring Rubric

The allocation engine evaluates candidate supplies across five weighted dimensions:

- **Resource compatibility**: 30 points (resource type matching)
- **Urgency**: 25 points (priority scaling based on incident triage classification)
- **Quantity availability**: 20 points (fulfillment percentage evaluation, allowing partial matching when permitted)
- **Geographic proximity**: 15 points (great-circle distance computed using the Haversine formula)
- **Time compatibility**: 10 points (availability window verification against operational deadline)

---

## Reserve Protection

RootCause prevents facilities from being depleted below their baseline safety threshold. The allocation engine enforces the implemented reserve rule:

```
Usable Quantity = Total Quantity - Protected Reserve
```

Allocations cannot reduce usable inventory below the protected reserve.

### Example:
- Total Quantity: 50 units
- Protected Reserve: 10 units
- Usable Quantity: 50 - 10 = 40 units available for allocation

If 20 units are allocated:
- Remaining Usable: 40 usable - 20 allocated = 20 usable remaining
- Protected Reserve: 10 units remains untouched

---

## No-Match Safety

An important property of RootCause is that **the system is allowed to return NO ELIGIBLE RESOURCE FOUND**.

When no candidate satisfies the required constraints, RootCause refuses to recommend candidates that fail its implemented allocation constraints rather than forcing a match.

When no candidate qualifies, the engine returns a structured rejection log explaining why evaluated providers did not meet the required constraints (such as insufficient usable inventory, incompatible resource type, or expired availability window).

---

## Operational Transfer Lifecycle

Allocations proceed through the actual lifecycle demonstrated in the deployed UI:

```
PENDING CONFIRMATION -> IN-TRANSIT -> FULFILLED -> ARCHIVED
```

- **PENDING CONFIRMATION**: The allocation recommendation has been calculated and staged. Usable inventory is not yet locked or decremented at the provider facility.
- **IN-TRANSIT**: The dispatch is confirmed. Usable inventory is decremented from the provider's catalog stock, the protected reserve remains guarded, and transit is underway.
- **FULFILLED**: The emergency resources have arrived at the triage destination, and transfer completion is confirmed.
- **ARCHIVED**: The delivery record is finalized, and verification telemetry is stored in the audit log.

---

## System Architecture

The deployed system uses the following serverless AWS architecture:

```
 +-------------------------------------------------------+
 |                       Amazon S3                       |
 |                  React Operations UI                  |
 +---------------------------+---------------------------+
                             |
                             v
 +-------------------------------------------------------+
 |             Amazon API Gateway HTTP API               |
 +---------------------------+---------------------------+
                             |
                             v
 +-------------------------------------------------------+
 |                      AWS Lambda                       |
 |               FastAPI running via Mangum              |
 +-------------+---------------------------+-------------+
               |                           |
               v                           v
 +---------------------------+ +---------------------------+
 |      Amazon DynamoDB      | |      Amazon Bedrock       |
 |         Supplies          | |        Titan Text         |
 |         Demands           | |  Explanation Synthesis    |
 |       Allocations         | +---------------------------+
 +-------------+-------------+
               |
               v
 +---------------------------+
 |       Deterministic       |
 |     Allocation Engine     |
 |   Resource Compatibility  |
 |          Urgency          |
 |         Quantity          |
 |    Geographic Distance    |
 |     Time Compatibility    |
 +---------------------------+
```

### Flow of Execution:
```
React frontend
 ->
Amazon S3 static website hosting
 ->
Amazon API Gateway HTTP API
 ->
AWS Lambda running FastAPI via Mangum
 ->
Amazon DynamoDB
```

Separately:
```
AWS Lambda
 ->
Amazon Bedrock
 ->
natural-language explanation
```

The AWS services actually used in the deployed system are:
- **Amazon S3**: Static website hosting for the React operations UI
- **Amazon API Gateway HTTP API**: HTTP API routing and CORS management
- **AWS Lambda**: Serverless compute running FastAPI via Mangum
- **Amazon DynamoDB**: Three DynamoDB tables using on-demand capacity (`Supplies`, `Demands`, and `Allocations`)
- **Amazon Bedrock**: Natural-language operational explanation synthesis

*(Note: The current deployment does not use CloudFront. The frontend is hosted directly through Amazon S3 static website hosting).*

---

## Amazon Bedrock Explainability Layer

Amazon Bedrock is used as an explainability layer. The deterministic allocation engine produces the structured decision, score, candidate information and reasons. Bedrock converts this structured result into a human-readable operational explanation.

- **Deployed Model Configuration**: The deployed configuration currently uses **Amazon Titan Text** (`amazon.titan-text-express-v1`).
- **Deterministic Decision Maker**: Bedrock does not choose the provider and does not calculate the allocation score.
- **Autonomous Fallback**: If Bedrock is unavailable, the deterministic decision and structured reasons remain authoritative, and the system provides rule-based explanations.

---

## Live Deployment

The system is deployed as a working application:

- **Frontend Application**: [http://rootcause-operations-ui-864365983847.s3-website.ap-south-1.amazonaws.com](http://rootcause-operations-ui-864365983847.s3-website.ap-south-1.amazonaws.com)  
  *(Hosted directly through Amazon S3 static website hosting)*
- **Backend API Base URL**: [https://c9e2cvd0dj.execute-api.ap-south-1.amazonaws.com](https://c9e2cvd0dj.execute-api.ap-south-1.amazonaws.com)
- **Documentation**: [https://c9e2cvd0dj.execute-api.ap-south-1.amazonaws.com/docs](https://c9e2cvd0dj.execute-api.ap-south-1.amazonaws.com/docs)

---

## Quickstart

### 1. Prerequisites
- Python 3.12+
- Node.js 20+ & npm

### 2. Backend Setup
```bash
# Clone repository and enter directory
cd rootcause-resource-allocation

# Install backend dependencies
pip install -r backend/requirements.txt pytest httpx

# Start FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# In a separate terminal, enter the frontend directory
cd frontend

# Install dependencies and start Vite dev server
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Testing

The current test suite has been verified:

**22 tests passed.**

Run the test suite locally:
```bash
pytest -v
```

The test suite covers:
- exact resource matching
- incompatible resource rejection
- quantity availability
- reserve protection
- urgency weighting
- geographic distance
- time compatibility
- expired supply
- no eligible candidates
- best candidate selection
- alternative candidates
- API health/root
- supply CRUD
- demand CRUD
- seed/stats
- allocation lifecycle
- no-match allocation
- full emergency allocation flow
- reserve protection
- partial allocation behavior

---

## AWS First Commit 2026 Track Alignment

RootCause is built using AWS services and is deployed as a working application, aligned with both hackathon tracks:

### Track 1: BUILD IT (Open Source Offline Reproduction)
- **Local Fallback**: Local development can run without AWS using the local repository implementation and in-memory storage fallback.
- **Deterministic Mathematical Core**: Pure Python matching engine with 100-point scoring matrix and guarded facility reserves.
- **22 Passing Tests**: Automated test suite verifying algorithm constraints and API behaviors.
- **Operations UI**: React 19 interface with real-time browser timezone localization (IST for demo), interactive allocation matrix, and audit controls.

### Track 2: SHIP IT (AWS Serverless Production Architecture)
- **Deployed Cloud Implementation**: The current deployed application is the SHIP IT implementation.
- **AWS Serverless Application Model (SAM)**: CloudFormation template in `infrastructure/template.yaml`.
- **FastAPI Lambda Function**: Python 3.12 serverless runtime mounted via Mangum ASGI adapter.
- **Amazon API Gateway HTTP API**: HTTP API routing with CORS support.
- **Amazon DynamoDB**: Three DynamoDB tables using on-demand capacity (`rootcause-supplies`, `rootcause-demands`, `rootcause-allocations`).
- **Amazon Bedrock**: Operational explanations generated via Amazon Titan Text (`amazon.titan-text-express-v1`).
- **Amazon S3 Static Website Hosting**: Hosts the compiled React frontend application.

---

## AI & Coding Assistance Disclosure

In accordance with hackathon guidelines, AI and coding assistance were utilized during development:
- **Development Assistance**: An AI coding assistant was used to assist with boilerplate drafting, refactoring components, styling CSS tokens, and structuring unit tests.
- **Amazon Bedrock Integration**: Bedrock is used within the deployed system strictly as an explainability synthesis layer using Amazon Titan Text.
- **Human Verification**: All core domain logic, deterministic scoring weights, constraint equations, API contracts, and test assertions were authored, reviewed, and verified directly.

---

## Documentation

- [Architecture Deep Dive](docs/architecture.md)
- [Deterministic Scoring Rubric & Equations](docs/allocation-algorithm.md)
- [REST API Specification](docs/api.md)
- [3-Minute Hackathon Demo Script](docs/demo-script.md)
- [AWS Deployment Guide](infrastructure/README.md)

---

## License

This project is open-source under the [MIT License](LICENSE).
