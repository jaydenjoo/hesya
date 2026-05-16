import { useTranslations } from "next-intl";

type MockTile = { label: string; value: string };

export function MarketingB2bOwners() {
  const t = useTranslations("MarketingLanding");
  const bullets = t.raw("b2bBullets") as string[];
  const tiles = t.raw("b2bMockTiles") as MockTile[];
  return (
    <section id="salons" aria-labelledby="b2b-h2" className="mk-section">
      <div className="mk-wrap">
        <span className="mk-eyebrow">{t("b2bEyebrow")}</span>
        <h2 id="b2b-h2">{t("b2bTitle")}</h2>
        <p>{t("b2bBody")}</p>
        <ul>
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p>
          <a href="#">{t("b2bCtaPrimary")}</a>{" "}
          <a href="#">{t("b2bCtaSecondary")}</a>
        </p>
        <div role="figure" aria-label={t("b2bMockHead")}>
          <strong>{t("b2bMockHead")}</strong>
          <small>{t("b2bMockSubhead")}</small>
          <ul>
            {tiles.map((tile) => (
              <li key={tile.label}>
                <span>{tile.label}</span> <strong>{tile.value}</strong>
              </li>
            ))}
          </ul>
          <p>{t("b2bMockOverlay")}</p>
        </div>
      </div>
    </section>
  );
}
