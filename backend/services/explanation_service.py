"""
Explanation Service for RootCause.
Separates deterministic allocation calculations from AI / natural-language explanation.
Supports deterministic LocalExplanationService and optional BedrockExplanationService.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import os
import json


class ExplanationService(ABC):
    """Abstract interface for generating human-readable allocation explanations."""
    @abstractmethod
    def explain_allocation(self, recommendation: Dict[str, Any], demand: Dict[str, Any]) -> str:
        pass


class LocalExplanationService(ExplanationService):
    """
    Deterministic rule-based explanation service.
    Zero external dependencies, instant execution, completely reliable for local and offline use.
    """
    def explain_allocation(self, recommendation: Dict[str, Any], demand: Dict[str, Any]) -> str:
        provider = recommendation.get("provider", "Unknown Provider")
        res_type = demand.get("resource_type", "resource")
        allocated_qty = recommendation.get("allocated_quantity", demand.get("quantity", 0))
        reasons = recommendation.get("reasons", [])
        score = recommendation.get("score", 0)
        dist_km = recommendation.get("distance_km")
        reserve_qty = recommendation.get("reserve_quantity", 0)

        parts = [
            f"The system recommends {provider} with an allocation score of {score}/100.",
            f"It can fulfill {allocated_qty} unit{'s' if allocated_qty != 1 else ''} of {res_type}."
        ]

        if dist_km is not None:
            parts.append(f"The facility is located {dist_km:.1f} km away, minimizing transit delay.")

        if reserve_qty > 0:
            parts.append(f"The provider's critical reserve of {reserve_qty} units remains strictly protected.")

        filtered_reasons = [r for r in reasons if "km away" not in r and "Exact resource" not in r]
        if filtered_reasons:
            reasons_summary = ", ".join(filtered_reasons)
            parts.append(f"Key factors: {reasons_summary}.")

        return " ".join(parts)


class BedrockExplanationService(ExplanationService):
    """
    Optional Amazon Bedrock explanation layer.
    Translates structured engine outputs into polished operational narratives.
    Gracefully falls back to LocalExplanationService if AWS or Bedrock is unavailable.
    """
    def __init__(self, model_id: Optional[str] = None):
        self.model_id = model_id or os.environ.get("BEDROCK_MODEL_ID", "amazon.titan-text-express-v1")
        self.local_fallback = LocalExplanationService()
        self._boto3_client = None

    def _get_client(self):
        if self._boto3_client is not None:
            return self._boto3_client
        try:
            import boto3
            region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
            self._boto3_client = boto3.client("bedrock-runtime", region_name=region)
            return self._boto3_client
        except Exception:
            return None

    def explain_allocation(self, recommendation: Dict[str, Any], demand: Dict[str, Any]) -> str:
        client = self._get_client()
        if client is None:
            # Fallback seamlessly to local engine explanation
            return self.local_fallback.explain_allocation(recommendation, demand)

        try:
            prompt = (
                f"You are the explanation layer for RootCause, an emergency resource allocation engine. "
                f"Convert the following structured match result into a concise, professional 2-sentence summary "
                f"explaining why this provider was chosen for this emergency demand.\n\n"
                f"Demand: {json.dumps(demand)}\n"
                f"Recommendation: {json.dumps(recommendation)}\n\n"
                f"Explanation:"
            )
            
            # Format payload depending on model family
            if "titan" in self.model_id:
                body = json.dumps({
                    "inputText": prompt,
                    "textGenerationConfig": {
                        "maxTokenCount": 200,
                        "temperature": 0.2,
                        "topP": 0.9,
                    }
                })
            else:
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 200,
                    "temperature": 0.2,
                    "messages": [{"role": "user", "content": prompt}]
                })

            response = client.invoke_model(
                modelId=self.model_id,
                body=body,
                contentType="application/json",
                accept="application/json",
            )
            response_body = json.loads(response["body"].read().decode("utf-8"))
            
            if "results" in response_body and response_body["results"]:
                return response_body["results"][0]["outputText"].strip()
            elif "content" in response_body and response_body["content"]:
                return response_body["content"][0]["text"].strip()
            return self.local_fallback.explain_allocation(recommendation, demand)
        except Exception:
            # Under any AWS/network/credential exception, fallback safely
            return self.local_fallback.explain_allocation(recommendation, demand)


def get_explanation_service() -> ExplanationService:
    """Factory returns BedrockExplanationService if requested and enabled, else LocalExplanationService."""
    use_aws = os.environ.get("USE_BEDROCK", "").lower() in ("1", "true", "yes")
    if use_aws:
        return BedrockExplanationService()
    return LocalExplanationService()
