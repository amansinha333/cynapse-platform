import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME", "cynapse-compliance")

if not api_key:
    print("❌ PINECONE_API_KEY missing.")
else:
    pc = Pinecone(api_key=api_key)
    try:
        # List indexes
        print("Indexes:", pc.list_indexes().names())
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print(f"✅ Success! Stats for {index_name}:")
        print(stats)
    except Exception as e:
        print(f"❌ Failed: {e}")
