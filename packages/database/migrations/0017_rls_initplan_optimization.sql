-- Epic 인프라 — RLS InitPlan 최적화 (advisor `auth_rls_initplan` 5 WARN fix)
--
-- 기존 5 policy가 `auth.uid()`을 row마다 재평가 → 운영 트래픽 시 hot path 성능 저하.
-- `(select auth.uid())`로 변환하면 Postgres planner가 InitPlan으로 1회만 평가.
-- (Supabase RLS performance docs:
--   https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
--
-- **의미 동일**: USING/WITH CHECK 결과는 모든 row에 대해 동일. 단순 평가 시점 변경.
-- **service_role bypass**: 현재 application은 service_role direct connection이라
--   회귀 0. 향후 anon/authenticated 키 사용 시점에 자동으로 성능 안전망.
--
-- ROLLBACK:
--   DROP POLICY ...; CREATE POLICY ... USING (... auth.uid()) ;  -- 기존 형태 복원
--   (5 테이블 동일 절차)

-- conversations (0011)
DROP POLICY IF EXISTS conversations_store_owner ON conversations;
CREATE POLICY conversations_store_owner ON conversations
  FOR ALL
  USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
  );

-- store_integrations (0011)
DROP POLICY IF EXISTS store_integrations_store_owner ON store_integrations;
CREATE POLICY store_integrations_store_owner ON store_integrations
  FOR ALL
  USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
  );

-- messages (0012, conversation 통한 join — WITH CHECK 둘 다)
DROP POLICY IF EXISTS messages_store_owner ON messages;
CREATE POLICY messages_store_owner ON messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.store_id IN (
          SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.store_id IN (
          SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())
        )
    )
  );

-- store_knowledge (0013)
DROP POLICY IF EXISTS store_knowledge_store_owner ON store_knowledge;
CREATE POLICY store_knowledge_store_owner ON store_knowledge
  FOR ALL
  USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
  )
  WITH CHECK (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
  );

-- store_tone_examples (0015)
DROP POLICY IF EXISTS store_tone_examples_store_owner ON store_tone_examples;
CREATE POLICY store_tone_examples_store_owner ON store_tone_examples
  FOR ALL
  USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
  )
  WITH CHECK (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
  );
