import { AiFlow, IosFrame } from "@hesya/shared-ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KVerifiedBadge } from "@/components/trust/KVerifiedBadge";

const peachScale = [
  { name: "peach-50", token: "--hesya-peach-50", hex: "#FDF8F1" },
  { name: "peach-100", token: "--hesya-peach-100", hex: "#F8E9D9" },
  { name: "peach-200", token: "--hesya-peach-200", hex: "#F5DDC8" },
  { name: "amber-500", token: "--hesya-amber-500", hex: "#E8A97A" },
  { name: "amber-600", token: "--hesya-amber-600", hex: "#D88B5B" },
  { name: "navy-900", token: "--hesya-navy-900", hex: "#1A2238" },
];

const trustScale = [
  { name: "kverified-gold", token: "--kverified-gold", hex: "#D4AF37" },
  { name: "trust-rose", token: "--trust-rose", hex: "#E8C4D6" },
  { name: "share-glow", token: "--share-glow", hex: "#F8D7C8" },
];

const radiusScale = [
  { name: "sm", value: "8px" },
  { name: "md", value: "12px" },
  { name: "lg", value: "16px" },
  { name: "xl", value: "20px" },
  { name: "2xl", value: "24px" },
];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-16 px-6 py-16">
      <header className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Hesya · Design System v1.0 · Phase 1A
        </p>
        <h1 className="font-heading text-5xl font-semibold tracking-tight">
          The Korean welcome,
          <br />
          in 5 languages.
        </h1>
        <p className="kr max-w-2xl text-base text-muted-foreground">
          외국인을 위한 한국 미용실 환대 시스템. 본 페이지는 핸드오프 v1.0
          (2026-05-01)에서 확정한 토큰·컴포넌트·트러스트 레이어를 코드로 매핑한
          검증 카탈로그입니다.
        </p>
      </header>

      <section id="color" className="space-y-6">
        <h2 className="font-heading text-3xl font-semibold">01. Color</h2>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Brand — Peach + Amber + Navy
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {peachScale.map((c) => (
              <div key={c.name} className="space-y-2">
                <div
                  className="h-20 rounded-lg border border-border"
                  style={{ background: c.hex }}
                />
                <div className="space-y-0.5 text-xs">
                  <div className="font-mono">{c.name}</div>
                  <div className="font-mono text-muted-foreground">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Trust layer — PRD § 6.5
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {trustScale.map((c) => (
              <div key={c.name} className="space-y-2">
                <div
                  className="h-20 rounded-lg border border-border"
                  style={{ background: c.hex }}
                />
                <div className="space-y-0.5 text-xs">
                  <div className="font-mono">{c.name}</div>
                  <div className="font-mono text-muted-foreground">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="type" className="space-y-6">
        <h2 className="font-heading text-3xl font-semibold">02. Typography</h2>
        <div className="space-y-4 rounded-xl border border-border bg-card p-8">
          <p className="font-heading text-5xl font-semibold tracking-tight">
            Fraunces — Display
          </p>
          <p className="text-2xl">Source Sans 3 — Body English</p>
          <p className="kr text-2xl">Pretendard Variable — 한국어 본문</p>
          <p className="font-mono text-sm">JetBrains Mono — code · numbers</p>
        </div>
        <p className="kr text-sm text-muted-foreground">
          한글 본문은 <code className="font-mono">word-break: keep-all</code> +{" "}
          <code className="font-mono">line-height: 1.8</code>로 가독성을
          확보합니다. 영문은{" "}
          <code className="font-mono">letter-spacing: 0.01em</code>의 미세
          조정으로 시각 균형을 맞춥니다.
        </p>
      </section>

      <section id="space" className="space-y-6">
        <h2 className="font-heading text-3xl font-semibold">03. Radius</h2>
        <div className="flex flex-wrap items-end gap-4">
          {radiusScale.map((r) => (
            <div key={r.name} className="space-y-2 text-center">
              <div
                className="size-20 border border-border bg-secondary"
                style={{ borderRadius: r.value }}
              />
              <div className="font-mono text-xs">
                {r.name} · {r.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="components" className="space-y-8">
        <h2 className="font-heading text-3xl font-semibold">04. Components</h2>

        <Card>
          <CardHeader>
            <CardTitle>Button</CardTitle>
            <CardDescription>shadcn/ui · Hesya amber primary</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Input + Select</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input placeholder="이메일 또는 매장명" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="시술 종류 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hair_general">헤어 일반</SelectItem>
                <SelectItem value="skin_beauty">피부 미용</SelectItem>
                <SelectItem value="nail">네일</SelectItem>
                <SelectItem value="makeup">메이크업</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badge</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <KVerifiedBadge locale="en" />
            <KVerifiedBadge locale="ko" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Avatar>
              <AvatarFallback>HS</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>外</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>K</AvatarFallback>
            </Avatar>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ko">
              <TabsList>
                <TabsTrigger value="ko">한국어</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ja">日本語</TabsTrigger>
                <TabsTrigger value="zh">中文</TabsTrigger>
                <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
              </TabsList>
              <TabsContent value="ko" className="kr pt-4 text-sm">
                다국어 시술 메뉴 — 매장이 한 번 입력하면 자동으로 5개 언어로
                번역됩니다.
              </TabsContent>
              <TabsContent value="en" className="pt-4 text-sm">
                Multilingual service menu — enter once, auto-translated to five
                languages.
              </TabsContent>
              <TabsContent value="ja" className="pt-4 text-sm">
                多言語施術メニュー
              </TabsContent>
              <TabsContent value="zh" className="pt-4 text-sm">
                多语言服务菜单
              </TabsContent>
              <TabsContent value="vi" className="pt-4 text-sm">
                Menu dịch vụ đa ngôn ngữ
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section id="trust" className="space-y-6">
        <h2 className="font-heading text-3xl font-semibold">
          05. K-Verified Trust System
        </h2>
        <p className="kr text-sm text-muted-foreground">
          외국인 관광객의 첫 신뢰 장벽 = &quot;이 매장 합법인가?&quot;를 단일
          시각 시스템으로 해소합니다. PRD § 6.5 참조.
        </p>
        <Card className="bg-[color:var(--hesya-peach-100)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              청담미용실
              <KVerifiedBadge />
            </CardTitle>
            <CardDescription>강남구 · 시술 12종 · 4.8★ (124)</CardDescription>
          </CardHeader>
          <CardContent className="kr text-sm">
            정부 검증 매장은{" "}
            <code className="font-mono text-xs">verification_status</code>가{" "}
            <code className="font-mono text-xs">auto_approved</code> 또는{" "}
            <code className="font-mono text-xs">approved</code>일 때만 골드
            뱃지가 표시됩니다.
          </CardContent>
        </Card>
      </section>

      <section id="shared-ui" className="space-y-6">
        <h2 className="font-heading text-3xl font-semibold">
          06. Shared UI primitives
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>AiFlow (stub)</CardTitle>
            <CardDescription>
              Inbox · Chat · Photo Analysis가 공유하는 AI 흐름 시각화. Phase 1
              E1-7에서 본격 구현.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AiFlow
              steps={[
                {
                  id: "1",
                  label: "Detect language",
                  status: "done",
                  detail: "ja",
                },
                { id: "2", label: "Translate to ko", status: "done" },
                { id: "3", label: "Match store FAQ", status: "running" },
                { id: "4", label: "Draft reply", status: "pending" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IosFrame (개발 미리보기 전용)</CardTitle>
            <CardDescription>
              고객 PWA 페이지를 데스크톱에서 iPhone shape으로 미리보기.
              Production은 frame 없이 edge-to-edge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IosFrame>
              <div className="space-y-4 p-6">
                <h3 className="font-heading text-2xl font-semibold">Hesya</h3>
                <p className="kr text-sm text-muted-foreground">
                  PWA 미리보기 sample. 실제 PWA는 viewport에 맞춰 렌더링.
                </p>
                <Button className="w-full">예약하기</Button>
              </div>
            </IosFrame>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
