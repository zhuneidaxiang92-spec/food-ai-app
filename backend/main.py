# ==============================================
# ✅ Load environment variables FIRST
# ==============================================
from pathlib import Path
from dotenv import load_dotenv
import os

env_path = Path(__file__).resolve().parent / ".env"
print(f"🔍 Loading .env from: {env_path}")
load_dotenv(dotenv_path=env_path)

print("DEBUG — testing .env load:")
print("MYSQL_USER =", os.getenv("MYSQL_USER"))
print("MYSQL_PASSWORD =", os.getenv("MYSQL_PASSWORD"))
print("MYSQL_DB =", os.getenv("MYSQL_DB"))
print("MYSQL_HOST =", os.getenv("MYSQL_HOST"))

# ==============================================
# ✅ Imports
# ==============================================
from fastapi import FastAPI, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx
import asyncio

from . import models
from . import database
from .routers import auth, auth_google, posts, community, users

import requests
from PIL import Image
from io import BytesIO


# ==============================================
# 🌐 DeepL / OpenAI Translation (Async + Batch)
# ==============================================
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")

async def translate_async(client: httpx.AsyncClient, text: str, target_lang: str = "JA") -> str:
    """Non-blocking translation of a single string."""
    if not text:
        return ""

    # 1️⃣ Try DeepL
    try:
        url = "https://api-free.deepl.com/v2/translate"
        params = {
            "auth_key": DEEPL_API_KEY,
            "text": text,
            "target_lang": target_lang
        }
        response = await client.post(url, data=params, timeout=10)
        data = response.json()
        if "translations" in data:
            return data["translations"][0]["text"]
    except Exception as e:
        print(f"⚠️ DeepL Async Error: {e}")

    # 2️⃣ Fallback: OpenAI
    try:
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            return text

        lang_name = "Japanese" if target_lang == "JA" else "English"
        
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": f"You are a helpful translator. Translate the following text to {lang_name}. Return ONLY the translation, no extra text."},
                {"role": "user", "content": text}
            ],
            "temperature": 0.3
        }
        res = await client.post(url, headers=headers, json=payload, timeout=20)
        data = res.json()
        if "choices" in data:
            return data["choices"][0]["message"]["content"].strip()
            
    except Exception as e:
        print(f"❌ OpenAI Async Error: {e}")

    return text

async def translate_batch(client: httpx.AsyncClient, texts: list[str]) -> list[str]:
    """Translate multiple strings in ONE API call (reduces lag)."""
    if not texts: return []
    
    # Filter empty strings to avoid breaking logic
    valid_texts = [t for t in texts if t]
    if not valid_texts: return texts
    
    # Delimiter for batching
    delimiter = "\n|||\n"
    combined = delimiter.join(valid_texts)
    
    # Translate the big block
    translated_block = await translate_async(client, combined)
    
    # Split back
    parts = translated_block.split(delimiter)
    
    # Re-map to original size (simple approach usually works, or precise map)
    # If standard split fails, fallback to line-splitting or return block
    # For safety, if counts mismatch, just return originals or best effort.
    if len(parts) == len(valid_texts):
        return parts
        
    # Fallback if delimiter got messed up: try simple newline split
    return translated_block.split("\n")[:len(valid_texts)]

# ==============================================
# 🚀 FastAPI Setup
# ==============================================
app = FastAPI(title="🍣 Food AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HUGGINGFACE_MODEL = os.getenv("HUGGINGFACE_MODEL")
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")

# Load DB tables
models.Base.metadata.create_all(bind=database.engine)

# Include routers
app.include_router(posts.router)
app.include_router(auth.router)
app.include_router(auth_google.router)
app.include_router(community.router)
app.include_router(users.router)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")


# ==============================================
# ⭐ NEW — Get food image from Spoonacular
# ==============================================
def get_food_image(food_name: str):
    try:
        search_url = (
            f"https://api.spoonacular.com/recipes/complexSearch"
            f"?query={food_name}&number=1&apiKey={SPOONACULAR_API_KEY}"
        )
        res = requests.get(search_url, timeout=10).json()

        if res.get("results"):
            return res["results"][0].get("image")

    except Exception as e:
        print("❌ Image fetch error:", e)

    return None  # fallback


# ==============================================
# 🧠 Predict endpoint
# ==============================================
@app.post("/predict")
async def predict_food(file: UploadFile = File(...)):
    try:
        # Resize image
        image_bytes = await file.read()
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image.thumbnail((512, 512))
        buf = BytesIO()
        image.save(buf, format="JPEG", quality=85)
        img_final = buf.getvalue()

        async with httpx.AsyncClient() as client:
            # 1. HuggingFace Prediction (Async)
            hf_url = f"https://router.huggingface.co/hf-inference/models/{HUGGINGFACE_MODEL}"
            headers = {
                "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
                "Content-Type": "image/jpeg",
            }

            print("🚀 Sending image to HuggingFace (Async)...")
            res = await client.post(hf_url, headers=headers, content=img_final, timeout=60)

            try:
                pred = res.json()
            except:
                return {"error": "Invalid HuggingFace response", "recipe_found": False}

            if not pred or not isinstance(pred, list):
                return {"error": "No prediction", "recipe_found": False}

            food_name = pred[0]["label"].lower()
            confidence = pred[0]["score"]
            print(f"✅ AI Result: {food_name} ({confidence})")

            # 2. Parallel: Translate Name & Search Repository
            # We run these concurrently to save time
            async def search_spoonacular():
                queries = [food_name, f"{food_name} recipe"]
                for q in queries:
                    url = "https://api.spoonacular.com/recipes/complexSearch"
                    params = {"query": q, "number": 1, "apiKey": SPOONACULAR_API_KEY}
                    r = await client.get(url, params=params, timeout=15)
                    d = r.json()
                    if d.get("results"):
                        return d["results"][0]["id"]
                return None

            # Execute translation and search in parallel
            task_trans_name = translate_async(client, food_name)
            task_search = search_spoonacular()
            
            food_name_jp, recipe_id = await asyncio.gather(task_trans_name, task_search)

            if not recipe_id:
                return {
                    "predicted_food_en": food_name,
                    "predicted_food_jp": food_name_jp,
                    "confidence": confidence,
                    "recipe_found": False,
                    "recipe": None,
                }

            # 3. Fetch Recipe & Batch Translate (Parallel)
            info_url = (
                f"https://api.spoonacular.com/recipes/{recipe_id}/information"
                f"?apiKey={SPOONACULAR_API_KEY}"
            )
            info_res = await client.get(info_url, timeout=20)
            info = info_res.json()

            title_en = info.get("title", "")
            instructions_en = info.get("instructions", "No instructions available.")
            ingredients_raw = info.get("extendedIngredients", [])

            # Batch Translate Ingredients (Huge Performance Win)
            ing_names = [ing.get("name", "") for ing in ingredients_raw]
            
            t_title, t_instr, t_ingreds = await asyncio.gather(
                translate_async(client, title_en),
                translate_async(client, instructions_en),
                translate_batch(client, ing_names)
            )

            recipe = {
                "name_en": title_en,
                "name_jp": t_title,
                "image": info.get("image"),
                "instructions_en": instructions_en,
                "instructions_jp": t_instr,
                "ingredients_en": [
                    {
                        "ingredient": ing.get("name"),
                        "measure": f"{ing.get('amount', '')} {ing.get('unit', '')}".strip()
                    }
                    for ing in ingredients_raw
                ],
                "ingredients_jp": t_ingreds, # List of strings
                "sourceUrl": info.get("sourceUrl"),
            }

            return {
                "predicted_food_en": food_name,
                "predicted_food_jp": food_name_jp,
                "confidence": confidence,
                "recipe_found": True,
                "recipe": recipe,
            }

    except Exception as e:
        print("❌ Async Predict Error:", e)
        return {"error": str(e), "recipe_found": False}


# ============================================================
# ⭐ NEW: Fetch Recipe by Name (Fix for Home → Recipe)
# ============================================================
@app.get("/recipe/{food_name}")
async def get_recipe_by_name(food_name: str):
    try:
        async with httpx.AsyncClient() as client:
            recipe_id = None
            
            # Helper to search
            async def search_sq(q):
                try:
                    url = "https://api.spoonacular.com/recipes/complexSearch"
                    params = {"query": q, "number": 1, "apiKey": SPOONACULAR_API_KEY}
                    r = await client.get(url, params=params, timeout=10)
                    d = r.json()
                    if d.get("results"):
                        return d["results"][0]["id"]
                except: pass
                return None

            # 1. Search Spoonacular (Original Name)
            # Try exact and underscore-replaced
            queries = [food_name, food_name.replace("_", " ")]
            
            for q in queries:
                recipe_id = await search_sq(q)
                if recipe_id: break
            
            # 2. If not found, try translating to English and search again
            if not recipe_id:
                print(f"⚠️ No results for '{food_name}', translating to English...")
                translated_name = await translate_async(client, food_name, target_lang="EN")
                print(f"➡️ Translated: {translated_name}")
                recipe_id = await search_sq(translated_name)

            if not recipe_id:
                return {"detail": "Not Found", "recipe": None}

            # Fetch complete recipe
            info_url = (
                f"https://api.spoonacular.com/recipes/{recipe_id}/information"
                f"?apiKey={SPOONACULAR_API_KEY}"
            )
            info_res = await client.get(info_url, timeout=20)
            info = info_res.json()

            title_en = info.get("title", "")
            instructions_en = info.get("instructions", "") or "No instructions."
            ingredients_raw = info.get("extendedIngredients", [])

            # Parallel Translate
            ing_names = [ing.get("name", "") for ing in ingredients_raw]
            
            t_title, t_instr, t_ingreds = await asyncio.gather(
                translate_async(client, title_en),
                translate_async(client, instructions_en),
                translate_batch(client, ing_names)
            )

            recipe = {
                "name_en": title_en,
                "name_jp": t_title,
                "image": info.get("image"),
                "instructions_en": instructions_en,
                "instructions_jp": t_instr,
                "ingredients_en": [
                    {
                        "ingredient": ing.get("name"),
                        "measure": f"{ing.get('amount', '')} {ing.get('unit', '')}".strip()
                    }
                    for ing in ingredients_raw
                ],
                "ingredients_jp": t_ingreds,
                "sourceUrl": info.get("sourceUrl"),
            }

            return {"recipe": recipe}

    except Exception as e:
        return {"error": str(e), "recipe": None}



# ============================================================
# ⭐ Save user preferences
# ============================================================
@app.post("/users/{user_id}/preferences")
def save_preferences(user_id: int, prefs: dict = Body(...)):
    foods = prefs.get("foods", [])
    foods_str = ",".join(foods)

    try:
        conn = database.engine.raw_connection()
        cur = conn.cursor()

        cur.execute(
            "UPDATE users SET favorite_foods=%s WHERE id=%s",
            (foods_str, user_id)
        )
        conn.commit()

        cur.close()
        conn.close()
        return {"status": "ok", "saved": foods}

    except Exception as e:
        return {"error": str(e)}


# ============================================================
# ⭐ UPDATED — Get Recommendations with Images
# ============================================================
@app.get("/recommendations/name/{username}")
def get_recommendations_by_name(username: str):
    try:
        conn = database.engine.raw_connection()
        cur = conn.cursor()

        cur.execute("SELECT favorite_foods FROM users WHERE name=%s", (username,))
        row = cur.fetchone()

        cur.close()
        conn.close()

        # No preferences
        if not row or not row[0]:
            return {"items": []}

        foods = row[0].split(",")

        # ⭐ Return food name + image
        results = [
            {"name": f, "image": get_food_image(f)}
            for f in foods
        ]

        return {"items": results}

    except Exception as e:
        return {"error": str(e)}


# ==============================================
# 🏠 Home Route
# ==============================================
@app.get("/")
def home():
    return {"message": "Food AI backend running!"}
