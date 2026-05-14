-- Plan v4 Epic B — AI Photo Analysis 기반.
--
-- 변경 의도: 외국인 손님이 원하는 헤어/메이크업 스타일 사진을 업로드하면
--           Claude Opus 4.7 Vision API가 시술 가능 여부 / 추천 시술 /
--           난이도 / 예상 시간 / 모발 호환성을 판정 → 매장 매칭 보조.
--           PRD 모듈 1 P0 핵심 차별화 ("Got a photo of the look you want?").
--
-- 변경:
--   1) photo_analyses 테이블 신규
--      - id (uuid PK), customer_id (FK nullable, 익명 분석 허용),
--        store_id (FK nullable, 매장 컨텍스트가 있을 때만),
--        image_url (text, Supabase Storage path),
--        status ('pending'|'analyzing'|'completed'|'failed'),
--        result_jsonb (Vision API raw response),
--        style_name (text, "Korean layered bob..."),
--        difficulty ('easy'|'medium'|'hard'),
--        estimated_minutes (integer),
--        compatibility_note (text),
--        confidence (numeric 0~1),
--        error_message (text, status='failed'일 때만)
--   2) idx_photo_analyses_customer_id (customer mypage 조회)
--   3) idx_photo_analyses_created_at (분석 history 정렬)
--
-- 영향:
--   - 신규 테이블만 추가, 기존 row 영향 X
--
-- application 영향:
--   - /c/photo-analyze 페이지 (Epic B)
--   - DAL: apps/web/src/shared/lib/dal/photo-analyses.ts
--
-- RLS: service_role bypass (기존 정책 동일).
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS photo_analyses;

CREATE TABLE photo_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result_jsonb jsonb,
  style_name text,
  difficulty text,
  estimated_minutes integer,
  compatibility_note text,
  confidence numeric(3, 2),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT photo_analyses_status_check CHECK (
    status IN ('pending', 'analyzing', 'completed', 'failed')
  ),
  CONSTRAINT photo_analyses_difficulty_check CHECK (
    difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')
  ),
  CONSTRAINT photo_analyses_confidence_check CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
  )
);

CREATE INDEX idx_photo_analyses_customer_id
  ON photo_analyses (customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX idx_photo_analyses_created_at
  ON photo_analyses (created_at DESC);
