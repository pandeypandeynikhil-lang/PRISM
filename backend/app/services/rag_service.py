"""
PRISM RAG Service v2
ChromaDB persistent vector store + Sentence Transformers
Falls back to keyword search if ChromaDB unavailable
"""
import os, logging
from pathlib import Path

logger = logging.getLogger(__name__)

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "rag", "chroma_db")
DOCS_PATH   = os.path.join(os.path.dirname(__file__), "..", "rag", "documents")
COLLECTION  = "prism_knowledge_base_v2"

_client     = None
_collection = None
_embed_fn   = None


def _get_collection():
    global _client, _collection, _embed_fn
    if _collection is not None:
        return _collection
    try:
        import chromadb
        from chromadb.utils import embedding_functions
        os.makedirs(CHROMA_PATH, exist_ok=True)
        _client    = chromadb.PersistentClient(path=CHROMA_PATH)
        _embed_fn  = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _collection = _client.get_or_create_collection(
            name=COLLECTION,
            embedding_function=_embed_fn,
            metadata={"hnsw:space": "cosine"},
        )
        if _collection.count() == 0:
            _ingest()
        else:
            logger.info(f"ChromaDB loaded — {_collection.count()} chunks")
        return _collection
    except Exception as e:
        logger.warning(f"ChromaDB unavailable ({e}) — using keyword fallback")
        return None


def _ingest():
    docs_dir = Path(DOCS_PATH)
    ids, texts, metas = [], [], []
    for txt_file in docs_dir.glob("*.txt"):
        content = txt_file.read_text(encoding="utf-8")
        chunks  = [c.strip() for c in content.split("\n\n") if len(c.strip()) > 60]
        for i, chunk in enumerate(chunks):
            doc_id = f"{txt_file.stem}_{i}"
            ids.append(doc_id)
            texts.append(chunk)
            metas.append({"source": txt_file.name, "chunk_index": i})
    if ids:
        _collection.add(documents=texts, ids=ids, metadatas=metas)
        logger.info(f"Ingested {len(ids)} chunks into ChromaDB")


def retrieve(query: str, n_results: int = 5) -> list[dict]:
    col = _get_collection()
    if col is None:
        return _keyword_fallback(query)
    try:
        results = col.query(query_texts=[query], n_results=n_results)
        docs    = results["documents"][0]
        metas   = results["metadatas"][0]
        scores  = results["distances"][0]
        return [
            {"text": d, "source": m["source"], "score": round(1 - s, 3)}
            for d, m, s in zip(docs, metas, scores)
        ]
    except Exception as e:
        logger.error(f"ChromaDB query error: {e}")
        return _keyword_fallback(query)


def _keyword_fallback(query: str) -> list[dict]:
    docs_dir    = Path(DOCS_PATH)
    results     = []
    query_words = query.lower().split()
    for txt_file in docs_dir.glob("*.txt"):
        content = txt_file.read_text(encoding="utf-8")
        chunks  = [c.strip() for c in content.split("\n\n") if len(c.strip()) > 60]
        for chunk in chunks:
            hits = sum(1 for w in query_words if w in chunk.lower())
            if hits > 0:
                results.append({"text": chunk, "source": txt_file.name,
                                 "score": round(hits / len(query_words), 2)})
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:5]


def get_retention_context(risk_tier: str, segment: str, top_factors: list) -> str:
    factors_str = ", ".join([f["factor"] for f in top_factors[:3]])
    query  = f"{risk_tier} risk {segment} customer churn retention strategy {factors_str} bank offer"
    chunks = retrieve(query)
    if not chunks:
        return "Apply standard retention best practices per bank policy."
    return "\n\n---\n\n".join([c["text"] for c in chunks])
