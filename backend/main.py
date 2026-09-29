import os
import io
import json
import pypdf
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Model target (Falling back to llama-3.3-70b-versatile if gpt-oss-20b is unavailable)
PRIMARY_MODEL = "openai/gpt-oss-20b"
FALLBACK_MODEL = "llama-3.3-70b-versatile"

paper_store = {}

class ChatRequest(BaseModel):
    paper_id: str
    message: str

def extract_pdf_text(file_bytes: bytes) -> str:
    pdf_stream = io.BytesIO(file_bytes)
    reader = pypdf.PdfReader(pdf_stream)
    
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
            
    return text

def call_groq_with_fallback(messages, json_mode=False):
    models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL]
    
    for model_name in models_to_try:
        try:
            kwargs = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.2,
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
                
            return client.chat.completions.create(**kwargs)
        except Exception as e:
            print(f"Error with model {model_name}: {e}")
            continue

    raise HTTPException(
        status_code=503,
        detail="All Groq AI models are currently unavailable. Please try again shortly."
    )

@app.post("/api/convert-paper")
async def convert_paper(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = extract_pdf_text(content)
        
        if not text.strip():
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from PDF. Ensure the file contains selectable text."
            )
        
        trimmed_text = text[:25000]

        prompt = f"""
        You are an expert 3D visualization architect and AI scientist.
        Analyze the following research paper and output a strictly valid JSON blueprint to construct an interactive 3D scene.

        The JSON must follow this exact schema:
        {{
            "title": "Paper Title",
            "summary": "Short 2-sentence summary",
            "nodes": [
                {{
                    "id": "1",
                    "title": "Concept Name",
                    "description": "Brief description of this concept/module",
                    "shape": "sphere" | "cube" | "torus",
                    "color": "#HEXCOLOR",
                    "position": [0, 0, 0]
                }}
            ],
            "connections": [
                {{"source": "1", "target": "2", "label": "data flow or relation"}}
            ]
        }}

        Ensure positions spread nodes out evenly across coordinates between -5 and 5 on x, y, z axes.

        PAPER TEXT:
        {trimmed_text}
        """

        messages = [
            {"role": "system", "content": "You are a JSON-only generating assistant."},
            {"role": "user", "content": prompt}
        ]

        response = call_groq_with_fallback(messages, json_mode=True)
        blueprint = json.loads(response.choices[0].message.content)
        
        paper_id = file.filename
        paper_store[paper_id] = trimmed_text

        return {"paper_id": paper_id, "blueprint": blueprint}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_with_paper(req: ChatRequest):
    paper_text = paper_store.get(req.paper_id, "")
    if not paper_text:
        raise HTTPException(
            status_code=404, 
            detail="Paper context not found. Please re-upload the paper."
        )

    messages = [
        {
            "role": "system", 
            "content": f"You are an AI research assistant. Answer based strictly on this paper context:\n{paper_text[:20000]}"
        },
        {"role": "user", "content": req.message}
    ]

    response = call_groq_with_fallback(messages, json_mode=False)
    return {"reply": response.choices[0].message.content}