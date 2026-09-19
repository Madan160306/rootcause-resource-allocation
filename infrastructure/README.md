# RootCause Infrastructure & AWS Deployment Guide

This directory contains the AWS Serverless Application Model (SAM) configuration to deploy the RootCause platform to production on AWS for the **AWS First Commit 2026 Hackathon**.

---

## Architecture Overview

```
                        +----------------------------+
                        | Amazon CloudFront / S3     |
                        | (React Operations Web App) |
                        +--------------+-------------+
                                       |
                                       v
                        +----------------------------+
                        | Amazon API Gateway (HTTP)  |
                        +--------------+-------------+
                                       |
                                       v
                        +----------------------------+
                        | AWS Lambda Function        |
                        | (FastAPI + Mangum ASGI)    |
                        +---+--------------------+---+
                            |                    |
             +--------------+                    +--------------+
             v                                                  v
+----------------------------+                     +----------------------------+
| Amazon DynamoDB Tables     |                     | Amazon Bedrock             |
| - rootcause-supplies       |                     | (Titan / Claude)           |
| - rootcause-demands        |                     | AI Natural-Language        |
| - rootcause-allocations    |                     | Explanation Generation     |
+----------------------------+                     +----------------------------+
```

---

## AWS Services Utilized

1. **AWS Lambda (Python 3.12)**:
   - Hosts the deterministic allocation engine and FastAPI REST API with zero idle cost.
   - Wraps the ASGI application via `Mangum`.

2. **Amazon API Gateway (HTTP API v2)**:
   - Provides low-latency, fully managed RESTful ingress with CORS support.

3. **Amazon DynamoDB**:
   - Pay-per-request On-Demand storage for Supplies, Demands, and confirmed Allocations.
   - GSI on `resource_type` and `status` for fast indexed querying.

4. **Amazon Bedrock**:
   - Generates natural language operational summaries from deterministic scores.
   - Falls back gracefully to local deterministic reasoning if offline or without AWS credentials.

5. **Amazon S3**:
   - High-availability static hosting for the React dashboard.

---

## Prerequisites

- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed (`sam --version`)
- Python 3.12+
- Node.js 20+

---

## Deployment Steps

### 1. Build and Deploy Backend & Infrastructure

```bash
cd infrastructure
sam build
sam deploy --guided
```

During `sam deploy --guided`, enter:
- Stack Name: `rootcause-app`
- AWS Region: `us-east-1` (or your preferred region with Amazon Bedrock access)
- Confirm changes and allow SAM CLI to create IAM roles.

### 2. Deploy Frontend to S3

```bash
cd ../frontend
# Build the production React assets
npm run build

# Sync built assets to S3 (replace with your S3 bucket name from SAM outputs)
aws s3 sync dist/ s3://<rootcause-operations-ui-ACCOUNT_ID>/ --delete
```

### 3. Verification

Access the outputs printed by SAM:
- API endpoint: `https://<api-id>.execute-api.<region>.amazonaws.com`
- Operations Dashboard: `http://<bucket-name>.s3-website-<region>.amazonaws.com`
