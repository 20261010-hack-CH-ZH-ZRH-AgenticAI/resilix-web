"use client";
import { ActionButton, Icon } from "@resilix/ui-components";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "@/features/shell/Brand";
import { Preferences } from "@/features/shell/Preferences";
import { usePreferences } from "@/lib/i18n/Provider";
import { deckLabels, type Slide, slidesFor } from "./content";
import styles from "./DeckStyles.module.css";

function SlideView({
  slide,
  index,
  total,
}: {
  slide: Slide;
  index: number;
  total: number;
}) {
  return (
    <article className={`${styles.slide} ${slide.accent ? styles.accent : ""}`}>
      <div className={styles.slideTop}>
        <span>{slide.label}</span>
        <span>JO202610101600</span>
      </div>
      <div className={styles.slideBody}>
        <div className={styles.copy}>
          <h1>{slide.title}</h1>
          <p>{slide.body}</p>
        </div>
        <div className={styles.visual}>
          {slide.kind === "hero" ? (
            <div className={styles.heroMark}>
              <div />
              <div />
              <Icon name="shield" width={100} height={100} />
            </div>
          ) : (
            <div
              className={`${styles.points} ${slide.kind === "architecture" ? styles.architecture : ""}`}
            >
              {slide.points.map((point, pointIndex) => (
                <div key={point}>
                  <span>{String(pointIndex + 1).padStart(2, "0")}</span>
                  <strong>{point}</strong>
                  <Icon
                    name={
                      slide.kind === "privacy"
                        ? "lock"
                        : slide.kind === "architecture"
                          ? "layers"
                          : "arrow"
                    }
                    width={20}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {slide.kind === "hero" && (
        <div className={styles.heroPoints}>
          {slide.points.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
      )}
      <footer className={styles.slideFoot}>
        <p>{slide.footnote}</p>
        <span>
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
      </footer>
    </article>
  );
}
export function PitchDeck() {
  const { language, t } = usePreferences();
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const slides = slidesFor(language);
  const labels = deckLabels[language];
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("button,input,select,a"))
        return;
      if (["ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
        setIndex((value) => Math.min(value + 1, slides.length - 1));
      }
      if (event.key === "ArrowLeft")
        setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [slides.length]);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/">
          <Brand />
        </Link>
        <div>
          <Preferences />
          <ActionButton
            compact
            variant="ghost"
            title={labels.fullscreen}
            aria-label={labels.fullscreen}
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else
                void document.documentElement
                  .requestFullscreen()
                  .catch(() => setError(t("requestError")));
            }}
          >
            <Icon name="layers" />
          </ActionButton>
          <ActionButton
            compact
            variant="ghost"
            title={labels.print}
            aria-label={labels.print}
            onClick={() => window.print()}
          >
            <Icon name="download" />
          </ActionButton>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      <main className={styles.active}>
        <SlideView slide={slides[index]} index={index} total={slides.length} />
      </main>
      <div className={styles.print}>
        {slides.map((slide, i) => (
          <SlideView
            key={slide.label}
            slide={slide}
            index={i}
            total={slides.length}
          />
        ))}
      </div>
      <nav className={styles.controls} aria-label={t("pitch")}>
        <ActionButton
          compact
          variant="ghost"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          aria-label={labels.previous}
        >
          ←
        </ActionButton>
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <button
              type="button"
              key={slide.label}
              aria-label={`${labels.slide} ${i + 1}`}
              aria-current={i === index ? "step" : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <ActionButton
          compact
          variant="ghost"
          disabled={index === slides.length - 1}
          onClick={() => setIndex(index + 1)}
          aria-label={labels.next}
        >
          →
        </ActionButton>
        <Link href="/">
          {t("demo")} <Icon name="arrow" width={16} />
        </Link>
      </nav>
    </div>
  );
}
