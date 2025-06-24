import os
import uuid
import chromadb
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv

load_dotenv()

# 🔧 Initialize Chroma client
chroma_client = chromadb.Client()

# 📚 Create memory collection with default embeddings (free and simple)
collection = chroma_client.get_or_create_collection(
    name="memories"
    # Using default embeddings - no API key needed
)

# ✅ Store memory
def store_memory(user_id, text, summary, tags, voice_path_url=None):
    if isinstance(tags, list):
        tags = ",".join(tags)
        
    metadata = {
        "user": user_id,
        "tags": tags,
        "summary": summary,
        "voice_path_url": voice_path_url or ""
    }
    
    try:
        collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[f"memory_{str(uuid.uuid4())}"]
        )
        print(f"✅ Memory stored successfully!")
    except Exception as e:
        print(f"❌ Error storing memory: {e}")

def query_memory(query, k=3):
    try:
        results = collection.query(query_texts=[query], n_results=k)
        return results['documents'][0], results['metadatas'][0]
    except Exception as e:
        print(f"❌ Error querying memory: {e}")
        return [], []

print("✅ Memory manager loaded with default embeddings")