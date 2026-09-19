"""
AWS Lambda entrypoint for RootCause API.
Uses Mangum as an ASGI adapter to route API Gateway HTTP events to FastAPI.
"""

from main import app

try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    # Mangum optional in local testing
    def handler(event, context):
        raise RuntimeError("Mangum is required for AWS Lambda execution. Run `pip install mangum`.")
