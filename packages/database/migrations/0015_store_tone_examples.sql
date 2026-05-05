-- Epic 1 1B Phase 2-B: 매장 톤 학습 — store_tone_examples 테이블
--
-- 사장이 Composer에서 답변을 작성한 뒤 "🎙️ 내 매장 톤 학습 →" 버튼을
-- 명시적으로 클릭하면 한 row가 추가된다. AI 답변 생성 시
-- listRecentToneExamples(storeId, 10)로 최근 10개를 조회하여
-- generate-reply.ts의 system prompt에 few-shot reference로 주입한다.
--
-- **명시 학습만**: outbound 메시지 자동 저장은 별 Task (privacy + 사장 통제권).
-- 자동 학습 도입 시 본 테이블에 `source` 컬럼 추가 ('manual' | 'auto') 검토.
--
-- **content 길이**: application 레이어 (learnStoreTone Server Action)에서
-- 1~500자 zod 검증. DB는 TEXT NOT NULL 만 강제 (학습 효과 vs cache 비용).
--
-- **인덱스**: (store_id, created_at DESC) — listRecentToneExamples의 최근 N개
-- 조회를 단일 인덱스 스캔으로 처리. 매장당 examples 0~수백 row 예상.
--
-- **RLS**: store_owner만 자기 매장 examples R/W. application은 service_role
-- direct connection으로 우회되지만 defense-in-depth (0013 store_knowledge 패턴 일관).
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS store_tone_examples_store_owner ON store_tone_examples;
--   DROP INDEX IF EXISTS idx_store_tone_examples_store_id_created_at;
--   DROP TABLE IF EXISTS store_tone_examples;

CREATE TABLE store_tone_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_tone_examples_store_id_created_at
  ON store_tone_examples(store_id, created_at DESC);

ALTER TABLE store_tone_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY store_tone_examples_store_owner ON store_tone_examples
  FOR ALL
  USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = auth.uid())
  );
