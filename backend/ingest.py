from __future__ import annotations

from langchain_text_splitters import RecursiveCharacterTextSplitter


def recursive_split_with_parent_context(
    text: str,
    page_number: int,
    section_name: str,
    source_name: str,
) -> list[dict]:
    """
    Split text into child chunks while preserving parent context metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
        is_separator_regex=False,
    )
    chunks = splitter.split_text(text or "")
    records = []
    for idx, chunk in enumerate(chunks):
        normalized = " ".join((chunk or "").split())
        if len(normalized) < 80:
            continue
        records.append(
            {
                "chunk_index": idx,
                "child_text": normalized,
                "parent_context": text,
                "page_number": page_number,
                "section_name": section_name,
                "source": source_name,
            }
        )
    return records
