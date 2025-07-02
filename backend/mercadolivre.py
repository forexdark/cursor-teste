import os
import httpx

ML_API_URL = "https://api.mercadolibre.com/items/"
ML_CLIENT_ID = os.getenv("ML_CLIENT_ID")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET")

async def buscar_produto_ml(ml_id: str):
    url = f"{ML_API_URL}{ml_id}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            return None
        data = resp.json()
        return {
            "nome": data.get("title"),
            "preco": data.get("price"),
            "estoque": data.get("available_quantity"),
            "url": data.get("permalink"),
            "thumbnail": data.get("thumbnail"),
            "vendedor_id": data.get("seller_id"),
        }

async def buscar_avaliacoes_ml(ml_id: str):
    url = f"https://api.mercadolibre.com/reviews/item/{ml_id}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            return None
        data = resp.json()
        return data.get("reviews", []) 