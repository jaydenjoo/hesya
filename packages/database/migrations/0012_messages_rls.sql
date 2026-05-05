-- Epic 1 1B Phase B-3c: messages RLS 정책 추가
--
-- 0003에서 messages 테이블이 ENABLE ROW LEVEL SECURITY 됐으나
-- 어떤 POLICY도 정의되지 않은 상태. 현재는 모든 application 코드가
-- service_role(direct DATABASE_URL connection)로 접근하므로 운영상
-- 안전하지만, anon/authenticated 키가 messages 테이블을 만지려 하면
-- 차단도 허용도 정의되지 않음 = 방어 심층화 부재.
--
-- 본 마이그레이션은 conversations RLS와 동일한 store_owner 패턴을
-- messages에 적용 (0011 conversations_store_owner 참조). messages는
-- store_id 컬럼이 없으므로 conversation_id → conversations 테이블
-- join을 통해 소유권 확인.
--
-- service_role은 RLS bypass이므로 application 회귀 영향 없음.
-- 향후 anon/authenticated 키 노출 시도 시 본 정책이 차단선.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS messages_store_owner ON messages;

CREATE POLICY messages_store_owner ON messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.store_id IN (
          SELECT store_id FROM store_owners WHERE user_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.store_id IN (
          SELECT store_id FROM store_owners WHERE user_id = auth.uid()
        )
    )
  );
