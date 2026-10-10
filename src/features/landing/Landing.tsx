"use client";
import { ActionButton, Badge, Icon } from "@resilix/ui-components";
import Link from "next/link";
import { Brand } from "@/features/shell/Brand";
import { Preferences } from "@/features/shell/Preferences";
import { usePreferences } from "@/lib/i18n/Provider";
import styles from "./LandingStyles.module.css";
export function Landing({
  onSignIn,
  onDemo,
  busy,
}: {
  onSignIn: () => void;
  onDemo: () => void;
  busy: boolean;
}) {
  const { t } = usePreferences();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <nav>
          <Link href="/deck/JO202610101600">{t("viewDeck")}</Link>
        </nav>
        <div className={styles.headerRight}>
          <Preferences />
          <ActionButton variant="ghost" onClick={onSignIn}>
            {t("signIn")}
            <Icon name="arrow" />
          </ActionButton>
        </div>
      </header>
      <main>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}>
              <span />
              {t("heroEyebrow")}
            </div>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroBody")}</p>
            <div className={styles.ctas}>
              <ActionButton variant="accent" onClick={onDemo} disabled={busy}>
                {t(busy ? "loading" : "demo")}
                <Icon name="arrow" />
              </ActionButton>
              <Link href="/deck/JO202610101600" className={styles.textLink}>
                {t("viewDeck")} <Icon name="external" width={15} />
              </Link>
            </div>
            <div className={styles.demoNote}>
              <Icon name="lock" width={14} />
              {t("demoExplain")}
            </div>
          </div>
          <div className={styles.heroVisual}>
            <svg
              className={styles.landscape}
              viewBox="0 0 600 640"
              role="img"
              aria-label={t("platform")}
            >
              <defs>
                <pattern
                  id="contours"
                  width="120"
                  height="120"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M0 20C35 80 60-30 120 20M0 40C35 100 60-10 120 40M0 60C35 120 60 10 120 60M0 80C35 140 60 30 120 80M0 100C35 160 60 50 120 100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth=".7"
                  />
                </pattern>
              </defs>
              <rect width="600" height="640" className={styles.landscapeBase} />
              <rect
                width="600"
                height="640"
                fill="url(#contours)"
                opacity=".18"
              />
              <path
                d="M-20 565 154 200 270 380 380 108 650 640H-20Z"
                className={styles.mountainBack}
              />
              <path
                d="m20 640 217-337 105 138 91-152 208 351Z"
                className={styles.mountainFront}
              />
              <path
                d="m154 200-36 77 40-23 29 19-33-73Zm226-92-44 114 48-31 37 13-41-96Z"
                className={styles.snow}
              />
              <path
                d="M132 600c160-190 90-95 210-175s11-81 114-140"
                fill="none"
                className={styles.route}
                strokeWidth="3"
                strokeDasharray="7 8"
              />
              <circle
                cx="341"
                cy="425"
                r="16"
                className={styles.locationHalo}
              />
              <circle cx="341" cy="425" r="6" className={styles.locationDot} />
            </svg>
            <div className={styles.visualTop}>
              <Badge tone="lime" dot>
                {t("platform")}
              </Badge>
              <span className={styles.coordinates}>
                46°49′ N &nbsp; 8°14′ E
              </span>
            </div>
            <div className={styles.visualCard}>
              <div className={styles.visualIcon}>
                <Icon name="spark" width={24} height={24} />
              </div>
              <div>
                <strong>{t("tagline")}</strong>
                <p>{t("featureAI")}</p>
              </div>
              <Icon name="arrow" />
            </div>
            <div className={styles.visualFoot}>
              <Icon name="mountain" width={15} />
              {t("prototype")}
              <span>01 / RESILIX</span>
            </div>
          </div>
        </section>
        <section className={styles.features}>
          <div className={styles.sectionHead}>
            <span>{t("builtFor")}</span>
            <span>↙</span>
          </div>
          <div className={styles.featureGrid}>
            {(["Map", "Privacy", "AI"] as const).map((name, index) => (
              <article key={name}>
                <div className={styles.featureTop}>
                  <span>0{index + 1}</span>
                  <Icon
                    name={
                      name === "Map"
                        ? "map"
                        : name === "Privacy"
                          ? "lock"
                          : "wave"
                    }
                    width={26}
                    height={26}
                  />
                </div>
                <h2>{t(`feature${name}`)}</h2>
                <p>{t(`feature${name}Body`)}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.footnote}>
          <Icon name="shield" />
          <div>
            <strong>{t("emergency")}</strong>
            <p>{t("boundary")}</p>
          </div>
          <Badge>{t("prototype")}</Badge>
        </section>
      </main>
      <footer className={styles.footer}>
        <Brand />
        <span>Agentic AI Hack · Zürich · 10.10.2026</span>
        <Link href="/deck/JO202610101600">{t("viewDeck")} ↗</Link>
      </footer>
    </div>
  );
}
