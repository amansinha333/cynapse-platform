"""Shared helpers for embedding vectors (Pinecone dimension alignment)."""


def fit_vector_dimension(values: list[float], target_dim: int) -> list[float]:
    if len(values) == target_dim:
        return values
    if len(values) > target_dim:
        return values[:target_dim]
    return values + [0.0] * (target_dim - len(values))
