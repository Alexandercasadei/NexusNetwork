import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

# Configurazione App
app = FastAPI(title="NEXUS AI Backend")

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Percorsi File
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")

# Caricamento Modello AI
print("Caricamento modello AI... (potrebbe richiedere qualche secondo)")
model = SentenceTransformer('all-MiniLM-L6-v2')

# Variabili Globali per Dati e Embeddings
df = pd.DataFrame()
embeddings = None

def load_data():
    """Carica il dataset CSV e ricalcola gli embeddings."""
    global df, embeddings
    if os.path.exists(DATASET_PATH):
        try:
            df = pd.read_csv(DATASET_PATH)
            # Verifica colonne minime
            required_cols = ["Domanda", "Risposta_Dettagliata"]
            if not all(col in df.columns for col in required_cols):
                print("CSV non valido, colonne mancanti.")
                df = pd.DataFrame(columns=["Categoria", "Domanda", "Risposta_Dettagliata"])
        except Exception as e:
            print(f"Errore lettura CSV: {e}")
            df = pd.DataFrame(columns=["Categoria", "Domanda", "Risposta_Dettagliata"])
    else:
        print("Dataset non trovato, creo vuoto.")
        df = pd.DataFrame(columns=["Categoria", "Domanda", "Risposta_Dettagliata"])
    
    # Pulizia dati
    df.fillna("", inplace=True)
    
    # Calcolo Embeddings
    if not df.empty:
        sentences = df["Domanda"].tolist()
        embeddings = model.encode(sentences, convert_to_tensor=True)
    else:
        embeddings = None
    print(f"Dataset caricato: {len(df)} righe.")

# Caricamento iniziale
load_data()

# Modelli Pydantic per API
class Query(BaseModel):
    text: str

class KnowledgeItem(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "Generale"

@app.post("/chat")
async def chat(query: Query):
    user_input = query.text.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="Domanda vuota")

    if df.empty or embeddings is None:
        return {"answer": "Il mio database è vuoto. Aggiungi conoscenza dalla Dashboard!", "score": 0.0}

    # 1. Encoding domanda utente
    query_embedding = model.encode(user_input, convert_to_tensor=True)

    # 2. Ricerca Semantica (Cosine Similarity)
    cos_scores = util.cos_sim(query_embedding, embeddings)[0]
    best_match_idx = int(cos_scores.argmax())
    best_score = float(cos_scores[best_match_idx])

    # 3. Soglia di confidenza
    THRESHOLD = 0.40 

    if best_score < THRESHOLD:
        return {
            "answer": "Non ho trovato una risposta specifica nel mio database. Prova a riformulare la domanda.",
            "score": best_score
        }

    # 4. Recupero risposta
    row = df.iloc[best_match_idx]
    return {
        "answer": row["Risposta_Dettagliata"],
        "score": best_score,
        "matched_question": row["Domanda"],
        "category": row.get("Categoria", "Generale")
    }

@app.get("/knowledge")
async def get_knowledge():
    """Restituisce la KB in formato JSON compatibile con la Dashboard."""
    result = []
    for idx, row in df.iterrows():
        result.append({
            "id": int(idx),
            "question": row["Domanda"],
            "answer": row["Risposta_Dettagliata"],
            "category": row.get("Categoria", "")
        })
    return result

@app.post("/knowledge")
async def add_knowledge(item: KnowledgeItem):
    """Aggiunge una nuova domanda al CSV e ricarica il modello."""
    global df
    
    new_row = {
        "Categoria": item.category,
        "Domanda": item.question,
        "Risposta_Dettagliata": item.answer
    }
    
    # Aggiungi al DataFrame
    new_df = pd.DataFrame([new_row])
    df = pd.concat([df, new_df], ignore_index=True)
    
    # Salva su CSV
    df.to_csv(DATASET_PATH, index=False)
    
    # Ricarica embeddings per includere la nuova domanda
    load_data()
    
    return {"message": "Aggiunto con successo", "count": len(df)}

@app.put("/knowledge/{item_id}")
async def update_knowledge(item_id: int, item: KnowledgeItem):
    global df
    if item_id < 0 or item_id >= len(df):
        raise HTTPException(status_code=404, detail="Item not found")
    
    df.at[item_id, "Categoria"] = item.category
    df.at[item_id, "Domanda"] = item.question
    df.at[item_id, "Risposta_Dettagliata"] = item.answer
    
    df.to_csv(DATASET_PATH, index=False)
    load_data()
    return {"message": "Updated"}

@app.delete("/knowledge/{item_id}")
async def delete_knowledge(item_id: int):
    global df
    if item_id < 0 or item_id >= len(df):
        raise HTTPException(status_code=404, detail="Item not found")
    
    df = df.drop(item_id).reset_index(drop=True)
    df.to_csv(DATASET_PATH, index=False)
    load_data()
    return {"message": "Deleted"}

if __name__ == "__main__":
    import uvicorn
    print("NEXUS AI Server (RAG) in avvio su http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)