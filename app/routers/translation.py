import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from google.cloud import translate_v3

router = APIRouter()

SUPPORTED_LANGUAGES = {
    "en",
    "zh-CN",
    "hi",
    "es",
    "ar",
    "fr",
    "bn",
    "pt",
    "ru",
    "id",
    "ja",
    "ko",
}


class TranslationRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=100)
    target_language: str


class TranslationResponse(BaseModel):
    translations: list[str]


@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

    if request.target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported target language",
        )

    if not project_id:
        raise HTTPException(
            status_code=503,
            detail="Google Cloud Translation is not configured",
        )

    if any(not isinstance(text, str) for text in request.texts):
        raise HTTPException(
            status_code=400,
            detail="All texts must be strings",
        )

    try:
        client = translate_v3.TranslationServiceClient()

        parent = f"projects/{project_id}/locations/global"

        response = client.translate_text(
            request={
                "parent": parent,
                "contents": request.texts,
                "mime_type": "text/plain",
                "target_language_code": request.target_language,
            }
        )

        return TranslationResponse(
            translations=[
                item.translated_text
                for item in response.translations
            ]
        )

    except Exception as error:
        print(f"Google Cloud Translation error: {error}", flush=True)

        raise HTTPException(
            status_code=502,
            detail="Translation service is currently unavailable",
        ) from error