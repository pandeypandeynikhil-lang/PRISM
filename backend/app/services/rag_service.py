"""
PRISM RAG Service — ChromaDB + Sentence Transformers
Retrieves relevant banking policies and templates for retention strategy generation.
"""
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

CHROMA_PATH   = os.path.join(os.path.dirname(__file__), "..", "rag", "chroma_db")
DOCS_PATH     = os.path.join(os.path.dirname(__file__), "..", "rag", "documents")
COLLECTION    = "prism_knowledge_base"

_chroma_client     = None
_collection        = None
_embedding_fn      = None


def _get_collection():
    global _chroma_client, _collection, _embedding_fn
    if _collection is not None:
        return _collection
    try:
        import chromadb
        from chromadb.utils import embedding_functions

        os.makedirs(CHROMA_PATH, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
        _embedding_fn  = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION,
            embedding_function=_embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
        if _collection.count() == 0:
            _ingest_documents()
        return _collection
    except ImportError:
        logger.warning("ChromaDB not installed — RAG returning empty context")
        return None


def _ingest_documents():
    logger.info("Ingesting PRISM knowledge base...")
    docs_dir = Path(DOCS_PATH)
    ids, texts, metas = [], [], []
    for txt_file in docs_dir.glob("*.txt"):
        content = txt_file.read_text(encoding="utf-8")
        # Chunk by section (split on double newline)
        chunks = [c.strip() for c in content.split("\n\n") if len(c.strip()) > 50]
        for i, chunk in enumerate(chunks):
            doc_id = f"{txt_file.stem}_{i}"
            ids.append(doc_id)
            texts.append(chunk)
            metas.append({"source": txt_file.name, "chunk_index": i})
    if ids:
        _collection.add(documents=texts, ids=ids, metadatas=metas)
        logger.info(f"✅ Ingested {len(ids)} chunks into ChromaDB")


def retrieve(query: str, n_results: int = 5) -> list[dict]:
    """Retrieve top-k relevant chunks for a query."""
    col = _get_collection()
    if col is None:
        return _fallback_retrieve(query)
    try:
        results = col.query(query_texts=[query], n_results=n_results)
        docs   = results["documents"][0]
        metas  = results["metadatas"][0]
        scores = results["distances"][0]
        return [
            {"text": d, "source": m["source"], "score": round(1 - s, 3)}
            for d, m, s in zip(docs, metas, scores)
        ]
    except Exception as e:
        logger.error(f"RAG retrieval error: {e}")
        return _fallback_retrieve(query)


def _fallback_retrieve(query: str) -> list[dict]:
    """Simple keyword fallback when ChromaDB is unavailable."""
    docs_dir = Path(DOCS_PATH)
    results = []
    query_lower = query.lower()
    for txt_file in docs_dir.glob("*.txt"):
        content = txt_file.read_text(encoding="utf-8")
        chunks = [c.strip() for c in content.split("\n\n") if len(c.strip()) > 50]
        for chunk in chunks:
            if any(word in chunk.lower() for word in query_lower.split()):
                results.append({"text": chunk, "source": txt_file.name, "score": 0.7})
    return results[:5]


def get_retention_context(
    risk_tier: str,
    segment: str,
    top_factors: list[dict],
) -> str:
    """Build a focused retrieval query and return concatenated context."""
    factors_str = ", ".join([f["factor"] for f in top_factors[:3]])
    query = f"{risk_tier} risk {segment} customer churn retention strategy {factors_str}"
    chunks = retrieve(query)
    if not chunks:
        return "No specific policy context retrieved. Apply general retention best practices."
    return "\n\n---\n\n".join([c["text"] for c in chunks])
