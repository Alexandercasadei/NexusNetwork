import json
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from fastapi.middleware.cors import CORSMiddleware

# Inizializzazione App
app = FastAPI(title="NEXUS AI Backend")

# Configurazione CORS (per permettere al sito locale di chiamare l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione, specifica il dominio esatto
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caricamento Modello AI (RAG - Retrieval)
# 'all-MiniLM-L6-v2' è veloce e leggero, perfetto per CPU
print("Caricamento modello AI... (potrebbe richiedere qualche secondo al primo avvio)")
model = SentenceTransformer('all-MiniLM-L6-v2')

# Caricamento Knowledge Base
KB_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
with open(KB_PATH, "r", encoding="utf-8", errors="ignore") as f:
    knowledge_base = json.load(f)

# Pre-calcolo degli embeddings per le domande (il "cervello" dell'AI)
kb_questions = [item["question"] for item in knowledge_base]
kb_embeddings = model.encode(kb_questions, convert_to_tensor=True)

class Query(BaseModel):
    text: str

class KnowledgeItem(BaseModel):
    question: str
    answer: str

@app.post("/chat")
async def chat(query: Query):
    user_input = query.text.strip()
    
    if not user_input:
        raise HTTPException(status_code=400, detail="Domanda vuota")

    # 1. Calcola embedding della domanda utente
    query_embedding = model.encode(user_input, convert_to_tensor=True)

    # 2. Trova la domanda più simile nella Knowledge Base (Semantic Search)
    # Utilizziamo la Cosine Similarity
    cos_scores = util.cos_sim(query_embedding, kb_embeddings)[0]
    best_match_idx = int(cos_scores.argmax())
    best_score = float(cos_scores[best_match_idx])

    # 3. Soglia di confidenza (se l'AI non è sicura, lo dice)
    THRESHOLD = 0.35 # Leggermente abbassata per catturare più variazioni di domande

    if best_score < THRESHOLD:
        return {
            "answer": "Hmm, non ho una risposta specifica per questo nel mio database. Prova a riformulare la domanda o chiedimi di OBS, Twitch o configurazioni streaming.",
            "score": best_score
        }

    # 4. Restituisci la risposta migliore
    return {
        "answer": knowledge_base[best_match_idx]["answer"],
        "score": best_score,
        "matched_question": knowledge_base[best_match_idx]["question"]
    }

@app.get("/knowledge")
async def get_knowledge():
    return knowledge_base

@app.post("/knowledge")
async def add_knowledge(item: KnowledgeItem):
    knowledge_base.append(item.dict())
    save_kb()
    return {"message": "Added successfully", "count": len(knowledge_base)}

@app.put("/knowledge/{idx}")
async def update_knowledge(idx: int, item: KnowledgeItem):
    if idx < 0 or idx >= len(knowledge_base):
        raise HTTPException(status_code=404, detail="Item not found")
    knowledge_base[idx] = item.dict()
    save_kb()
    return {"message": "Updated successfully"}

@app.delete("/knowledge/{idx}")
async def delete_knowledge(idx: int):
    if idx < 0 or idx >= len(knowledge_base):
        raise HTTPException(status_code=404, detail="Item not found")
    knowledge_base.pop(idx)
    save_kb()
    return {"message": "Deleted successfully"}

def save_kb():
    # Save to file
    with open(KB_PATH, "w", encoding="utf-8") as f:
        json.dump(knowledge_base, f, indent=2, ensure_ascii=False)
    
    # Re-compute embeddings
    global kb_embeddings
    kb_questions = [k["question"] for k in knowledge_base]
    kb_embeddings = model.encode(kb_questions, convert_to_tensor=True)

if __name__ == "__main__":
    import uvicorn
    print("NEXUS AI Server in avvio su http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)