import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

async def gerar_resumo_avaliacoes(avaliacoes: list) -> str:
    if not avaliacoes:
        return "Sem avaliações suficientes para resumo."
    textos = [a.get("content", "") for a in avaliacoes if a.get("content")]
    if not textos:
        return "Sem avaliações textuais."
    prompt = (
        "Resuma em português, de forma clara e objetiva, os principais pontos positivos e negativos das avaliações a seguir sobre um produto do Mercado Livre:\n"
        + "\n".join(textos[:10])  # Limitar para não estourar o contexto
    )
    response = await openai.ChatCompletion.acreate(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip() 