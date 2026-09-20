"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import ButtonExample from "@/components/ButtonExample";
import CodeChip from "@/components/CodeChip";
import MetricsExample from "@/components/MetricsExample";
import SummaryExample from "@/components/SummaryExample";
import TextExample from "@/components/TextExample";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import Shell from "@/components/Shell";
import Subscribe from "@/components/Subscribe";
import Tab from "@/components/Tab";
import { loadTriedFonts, normalizeFont } from "@/lib/normalizeFont";
import { TRIED_FONTS, type TriedId } from "@/lib/triedFonts";
import type { NormalizeResult } from "@/lib/types";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

type Source = TriedId | "upload";

const NAV = [
  "Latest",
  "Manifest",
  "Services",
  "About",
  "Technology",
  "Testimonials",
];

export default function ProjectPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const cache = useRef<Partial<Record<Source, NormalizeResult>>>({});
  const sourceRef = useRef<Source>("unica77");
  const [source, setSource] = useState<Source>("unica77");
  const [result, setResult] = useState<NormalizeResult | null>(null);
  const [warm, setWarm] = useState<NormalizeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadTriedFonts(TRIED_FONTS)
      .then((loaded) => {
        if (cancelled) return;
        cache.current = { ...cache.current, ...loaded };
        setWarm(Object.values(loaded));
        const selected = sourceRef.current;
        const next = selected !== "upload" ? loaded[selected] : loaded.unica77;
        setResult(next);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not read that font.",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectTried(id: TriedId) {
    sourceRef.current = id;
    setSource(id);
    setError("");
    const cached = cache.current[id];
    if (cached) setResult(cached);
  }

  async function handleFile(file: File) {
    setSource("upload");
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const next = await normalizeFont(file);
      cache.current.upload = next;
      setResult(next);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not read that font.",
      );
      setLoading(false);
    }
  }

  function download() {
    if (!result?.blob) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main
      className={cn(styles.page, menuOpen && styles.pageMenuOpen)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
    >
      <div className={styles.column}>
        <Logo
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((value) => !value)}
        />

        <nav
          className={cn(styles.crumb, textStyles.bodySm)}
          aria-label="Breadcrumb"
        >
          <span>@</span>
          <span>/</span>
          <span>Projects</span>
          <span>/</span>
          <span className={styles.crumbCurrent}>
            <Icon name="cube" />
            Normalize font metrics: GUI and CLI solutions
          </span>
        </nav>

        <div className={styles.sections}>
          <section className={styles.section}>
            <p className={textStyles.bodySm}>Introduction</p>
            <p className={cn(styles.copy, textStyles.bodySm)}>
              The text within a button is not always centered vertically. That
              is the font’s fault, not yours. Of course, you can already trim
              the line box in CSS with{" "}
              <CodeChip>
                <span className={styles.codeProp}>text-box:</span>{" "}
                <span className={styles.codeValue}>
                  trim-both cap alphabetic
                </span>
              </CodeChip>
              . That property became a cross-browser friendly option on August
              18, 2026, when Firefox adopted it. But the default is still the
              untrimmed box, and component kits were written for that default.
            </p>
            <p className={cn(styles.copy, textStyles.bodySm)}>
              My tool rewrites the font for that default case. It only changes
              how the word sits in the box: not the letters, the look of the
              font, its rhythm or anything else.
            </p>
          </section>

          <section className={cn(styles.section, styles.gui)}>
            <div className={styles.intro}>
              <p className={textStyles.bodySm}>GUI solution</p>
              <p className={cn(styles.copy, textStyles.bodySm)}>
                Drop a font file to fix this problem, see the measurements, then
                download the rewritten font. You can also try three selected
                fonts at the bottom, and see how the tool impacted them: I’ve
                selected fonts I admire and would like to use in my work, but
                their metrics are a bit off by default: Unica77 by Lineto,
                America by Grilli Type, and Ritma by British Standard Type.
              </p>
            </div>
            <div className={styles.demo}>
              <div className={styles.row}>
                {TRIED_FONTS.map((item) => (
                  <Tab
                    key={item.id}
                    icon="aa"
                    active={source === item.id}
                    onClick={() => selectTried(item.id)}
                  >
                    {item.label}
                  </Tab>
                ))}
                <Button
                  variant="primary"
                  icon="upload"
                  onClick={() => inputRef.current?.click()}
                >
                  Upload your font
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  accept=".ttf,.otf,.woff,.woff2,.ttc"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFile(file);
                    event.target.value = "";
                  }}
                />
              </div>
              {error ? (
                <p className={cn(styles.error, textStyles.bodySm)}>{error}</p>
              ) : null}
              <div className={styles.examples}>
                <SummaryExample result={result} loading={loading} />
                {source === "upload" && result && !loading ? (
                  <Button
                    variant="primary"
                    icon="download"
                    fullWidth
                    onClick={download}
                  >
                    Download
                  </Button>
                ) : null}
                <MetricsExample result={result} loading={loading} />
                <ButtonExample result={result} loading={loading} />
                <TextExample result={result} loading={loading} />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <p className={textStyles.bodySm}>CLI solution</p>
            <p className={cn(styles.copy, textStyles.bodySm)}>
              Install with npm, then point it at a file or a folder. A folder
              means every .otf, .ttf, .woff, and .woff2 inside it. It writes a
              normalized copy next to the original.
            </p>
            <Shell
              code={`npm i -g normalize-metrics
normalize-metrics Inter-Regular.otf
normalize-metrics ./fonts`}
            />
            <p className={cn(styles.copy, textStyles.bodySm)}>
              Or once, without installing:
            </p>
            <Shell code="npx normalize-metrics ./fonts" />
            <p className={cn(styles.copy, textStyles.bodySm)}>
              In a repo, add it as a dev dependency and list the folders in the
              config. <CodeChip>--check</CodeChip> reports fonts that are still
              off and exits without writing.
            </p>
          </section>
        </div>
      </div>

      <div className={styles.bottom}>
        <Subscribe />

        <div className={cn(styles.footer, textStyles.bodySm)}>
          <a href="https://x.com/olesgergun">Follow me on X</a>
          <p>
            © As a part of Rhizome project by{" "}
            <a href="https://olesgergun.com">Oles Gergun</a>, 2026
          </p>
        </div>
      </div>

      <div className={styles.fontWarmup} aria-hidden="true">
        {warm.map((item) => (
          <span key={item.originalFamily}>
            <span style={{ fontFamily: item.originalFamily }}>Ag</span>
            <span style={{ fontFamily: item.normalizedFamily }}>Ag</span>
          </span>
        ))}
      </div>

      {menuOpen ? (
        <div className={styles.overlay}>
          <div className={styles.overlayInner}>
            <nav
              className={cn(styles.nav, textStyles.bodySm)}
              aria-label="Site"
            >
              {NAV.map((item) => (
                <a key={item} href="#">
                  {item} /
                </a>
              ))}
            </nav>
            <p className={cn(styles.byline, textStyles.bodySm)}>
              Oles Gergun, design engineer
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
