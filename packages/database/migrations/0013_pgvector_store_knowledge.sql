-- Epic 1 1B Phase B-4a: pgvector 활성화 + store_knowledge 테이블 (RAG FAQ)
--
-- 사장이 매장 FAQ(질문/답변)를 등록하면 OpenAI text-embedding-3-small로
-- 임베딩(1536d)을 생성하여 저장. inbound 메시지 도착 시 메시지 임베딩과
-- cosine similarity로 top-k 검색 → AI 답변 prompt에 컨텍스트로 주입.
--
-- 인덱스: ivfflat + vector_cosine_ops (작은 데이터셋 ~수백~수천 row에 적합).
-- 매장당 FAQ 50~200건 예상 → 전체 데이터셋도 작아 ivfflat lists=100으로 충분.
-- 미래 데이터셋 1M+로 확장 시 hnsw 전환 고려.
--
-- RLS: store_owner만 자기 매장 FAQ에 접근. application은 service_role
-- direct connection이라 우회되지만 defense-in-depth (L-061 패턴 일관).
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS store_knowledge_store_owner ON store_knowledge;
--   DROP INDEX IF EXISTS idx_store_knowledge_embedding;
--   DROP INDEX IF EXISTS idx_store_knowledge_store_id;
--   DROP TABLE IF EXISTS store_knowledge;
--   -- pgvector extension은 다른 곳에서 사용할 수 있으므로 DROP 신중

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE store_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_knowledge_store_id
  ON store_knowledge(store_id);

-- ivfflat 인덱스: cosine similarity 검색용. lists=100은 row 수
-- 100~10K 사이에 적합 (Supabase pgvector 가이드).
CREATE INDEX idx_store_knowledge_embedding
  ON store_knowledge
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE store_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY store_knowledge_store_owner ON store_knowledge
  FOR ALL
  USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = auth.uid())
  );
