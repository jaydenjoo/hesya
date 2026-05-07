# Vercel Queue Beta Issue — Trigger Registration Deployment Pinning

> 작성일: 2026-05-07 | 등록처: vercel/sdk repo 또는 support@vercel.com (Jayden 수동)
> 본문은 영어로 작성 (Vercel 측 트리아지 기본 언어)
> 등록 후 issue URL을 PROGRESS.md에 기록

## Issue Title (영어)

```
Vercel Queue beta: experimentalTriggers registration not migrated to new deployment after redeploy (callback push mode)
```

## Issue Body (영어, paste-ready)

````markdown
## Summary

Using Vercel Queues beta with `experimentalTriggers` in `vercel.json`, the trigger registration is **pinned to a specific deployment ID and never migrates to subsequent production deployments**, even though the `<project>.vercel.app` alias correctly points to the latest deployment. This causes published messages to be routed to a stale deployment indefinitely, resulting in messages stuck in retry loops.

## Environment

- `@vercel/queue`: `0.1.6`
- `vercel` CLI: `53.1.1`
- Project: monorepo (`apps/web` Next.js 16 App Router with `vercel.json` at the app root)
- Region: `iad1` (single region)
- Mode: callback push mode (`handleCallback` from `@vercel/queue`)

## Reproduction

1. `vercel.json` (in `apps/web/`):

   ```json
   {
     "functions": {
       "src/app/api/queue/inbox-process-inbound/route.ts": {
         "experimentalTriggers": [
           { "type": "queue/v2beta", "topic": "inbox-process-inbound" }
         ]
       }
     }
   }
   ```

2. Worker route uses `handleCallback` from `@vercel/queue`.

3. Deployment A is created → trigger registers → publishes route to deployment A → works correctly.

4. Code change deployed → Deployment B created (`<project>.vercel.app` alias updates to B).

5. **Bug**: New publishes still hit Deployment A. Messages already in flight retry against Deployment A indefinitely.

## Evidence

`vercel logs --no-branch -q "queue/inbox-process-inbound"` over 24h shows:

```
May 07 10:06:41.68  hesya-esra9g1py.vercel.app  POST 500  Queue callback error: MessageNotFoundError: Q-1M0zeW2mOqC8I12gNUJP13GZZr7Sdnxi
May 07 09:51:41.58  hesya-esra9g1py.vercel.app  POST 500  Queue callback error: MessageNotFoundError: Q-1M0zeW2mOqC8I12gNUJP13GZZr7Sdnxi
... (15 minute intervals, 13+ hours, all hitting hesya-esra9g1py — an OLD deployment)
```

Meanwhile:

- `<project>.vercel.app` alias points to a NEWER deployment (`hesya-aj554w05l`)
- The newer deployment has the same `experimentalTriggers` config and `handleCallback` route
- New publishes from a fresh client reach the new alias correctly via direct HTTP, but the queue invokes only the old deployment

## Root Cause Hypothesis

The trigger registration in Vercel Queue's server-side state is bound to a specific `deploymentId` at the time of first registration, and there is no mechanism to migrate it to a new deployment when a redeploy happens. This separates the `<project>.vercel.app` alias resolution (which is alias-based) from the queue trigger routing (which is deployment-pinned).

## Why This Is Critical

1. **Customer-side fix is impossible**: No `vercel.json` setting, redeploy, env update, or CLI command can repair the trigger registration. The state is server-side only.

2. **Silent failure mode**: The dashboard "Throughput / Consumer Group" metrics show normal numbers (because publishes succeed and the OLD deployment still receives), so it appears healthy from a metric standpoint. The breakage is only visible by inspecting deployment URLs in `vercel logs`.

3. **Combined with `MessageNotFoundError`**: The old deployment in our case ran an SDK version with a known callback retry directive bug (separate issue: callback `{ afterSeconds }` directive triggers `changeVisibility(PATCH /lease/{handle})` → 404 → silent fail → message marked as ack'd in some cases / retry loop in others). This compounds the routing issue and creates infinite retry loops with no DLQ termination.

4. **Production impact**: For us, a single test message has been retrying every 15 minutes for 13+ hours, generating Sentry noise and burning lambda invocations.

## What We Did

We migrated to Upstash QStash (Vercel Marketplace integration) which uses URL-based routing (`<project>.vercel.app/api/<route>`). The alias-based URL automatically tracks the latest deployment, eliminating the deployment pinning class of bugs entirely. PR reference: <link to be filled>.

## Suggested Fix

1. **Auto-migrate trigger registration to the latest stable deployment** when a new prod deployment becomes Ready. Match the alias resolution behavior.

2. **Or**: Expose a CLI/API to inspect and manually move trigger registrations between deployments. Currently `vercel inspect <deployment>` does not show queue trigger pinning state.

3. **Or**: Document this behavior prominently in beta docs with a recommended workaround (e.g., a manual "trigger refresh" step on each deploy).

## Additional Diagnostics

- Project ID: `prj_N5IPqEfHP3vDsiHxSTdascXZulma`
- Org ID: `team_8xMVY93zqUIqB8m8dXcvsrI2`
- Old deployment (stuck trigger): `hesya-esra9g1py-jaydens-projects-f5e92399.vercel.app`
- New deployment (alias target): `hesya-aj554w05l-jaydens-projects-f5e92399.vercel.app` (and later deployments)
- Stuck messageId: `Q-1M0zeW2mOqC8I12gNUJP13GZZr7Sdnxi`

Happy to provide more logs or test against a fix on a separate `experimentalTriggers` topic.
````

## Cleanup Request (별도, support@vercel.com)

After registering the issue above, also email support@vercel.com:

```
Subject: Stuck queue message + dangling trigger registration cleanup request

Project: prj_N5IPqEfHP3vDsiHxSTdascXZulma
Topic: inbox-process-inbound
Stuck message: Q-1M0zeW2mOqC8I12gNUJP13GZZr7Sdnxi

After migrating away from Vercel Queues to QStash (issue: <issue-link>), this
message is still being retried every 15 minutes against an old deployment
(hesya-esra9g1py-...). The vercel.json trigger config has been removed in the
new deployment but the server-side trigger registration persists.

Could you:
1. Delete or expire the stuck message Q-1M0zeW2mOqC8I12gNUJP13GZZr7Sdnxi
2. Cleanup the trigger registration pinned to old deployment hesya-esra9g1py
3. Confirm the topic 'inbox-process-inbound' itself is removable

Thanks!
```

## 등록 후 트래킹

issue URL과 staff 응답 시각을 PROGRESS.md에 기록. 응답 1주 무응답 시 follow-up.
