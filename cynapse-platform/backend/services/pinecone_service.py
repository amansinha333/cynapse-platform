from pinecone import Pinecone
from config import PINECONE_API_KEY, PINECONE_INDEX

# Initialize Pinecone connection
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX)

def store_embedding(doc_id: str, embedding: list, metadata: dict):
    # Saves the vector to your Pinecone Cloud
    index.upsert(
        vectors=[
            {
                "id": doc_id,
                "values": embedding,
                "metadata": metadata
            }
        ]
    )

# CHANGED: Increased top_k from 5 to 20 so it casts a much wider net across all 50-70 PDFs
def search_embeddings(query_embedding: list, top_k: int = 20):
    return index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )