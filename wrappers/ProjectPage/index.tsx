"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import ButtonExample from "@/components/ButtonExample";
import CodeChip from "@/components/CodeChip";
import CodeFile from "@/components/CodeFile";
import MetricsExample from "@/components/MetricsExample";
import SummaryExample from "@/components/SummaryExample";
import TextExample from "@/components/TextExample";
import Icon from "@/components/Icon";
import Header from "@/components/Header";
import Shell from "@/components/Shell";
import Subscribe from "@/components/Subscribe";
import Tab from "@/components/Tab";
import TextLink from "@/components/TextLink";
import { loadTriedFonts, normalizeFont } from "@/lib/normalizeFont";
import { TRIED_FONTS, type TriedId } from "@/lib/triedFonts";
import type { NormalizeResult } from "@/lib/types";
import { cn } from "@/utils/cn";
import { isTriedId } from "@/utils/isTriedId";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const CSS_PREVIEW = `@font-face {
  font-family: "Inter";
  src: url("./Inter-Regular.woff2") format("woff2"),
       url("./Inter-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  ascent-override: 97.2%;
  descent-override: 25%;
  line-gap-override: 0%;
}
`;

type UploadId = `upload:${string}`;
type Source = TriedId | UploadId;

type UploadedFont = {
  id: UploadId;
  label: string;
};

export default function ProjectPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const cache = useRef<Partial<Record<Source, NormalizeResult>>>({});
  const sourceRef = useRef<Source>("unica77");
  const uploadingRef = useRef(false);
  const [source, setSource] = useState<Source>("unica77");
  const [uploads, setUploads] = useState<UploadedFont[]>([]);
  const [result, setResult] = useState<NormalizeResult | null>(null);
  const [warm, setWarm] = useState<NormalizeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadTriedFonts(TRIED_FONTS)
      .then((loaded) => {
        if (cancelled) return;
        cache.current = { ...cache.current, ...loaded };
        setWarm((prev) => {
          const tried = Object.values(loaded);
          const triedFamilies = new Set(
            tried.map((item) => item.originalFamily),
          );
          return [
            ...tried,
            ...prev.filter((item) => !triedFamilies.has(item.originalFamily)),
          ];
        });
        const selected = sourceRef.current;
        if (isTriedId(selected)) {
          setResult(loaded[selected] ?? loaded.unica77);
          setLoading(false);
        }
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

  function selectSource(id: Source) {
    if (uploadingRef.current) return;
    sourceRef.current = id;
    setSource(id);
    setError("");
    const cached = cache.current[id];
    if (cached) {
      setResult(cached);
      setLoading(false);
    }
  }

  async function handleFile(file: File) {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    setError("");
    try {
      const next = await normalizeFont(file);
      const id = `upload:${crypto.randomUUID()}` as UploadId;
      cache.current[id] = next;
      const label = next.family || next.fileName.replace(/\.[^.]+$/, "");
      setUploads((prev) => [...prev, { id, label }]);
      setWarm((prev) => [...prev, next]);
      sourceRef.current = id;
      setSource(id);
      setResult(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not read that font.",
      );
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }

  const fontName = isTriedId(source)
    ? TRIED_FONTS.find((item) => item.id === source)?.label
    : (uploads.find((item) => item.id === source)?.label ?? result?.family);

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
      className={styles.page}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (uploadingRef.current) return;
        const file = event.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
    >
      <div className={styles.column}>
        <Header>
          <nav
            className={cn(styles.crumb, textStyles.bodyMd)}
            aria-label="Breadcrumb"
          >
            <span className={styles.crumbLead}>
              <span>⋊&gt;</span>
              <span>~/O/P/</span>
            </span>
            <span className={styles.crumbCurrent}>
              <Icon name="cube" />
              <span>Normalize font metrics for web: GUI and CLI solutions</span>
            </span>
          </nav>

          <div className={styles.sections}>
            <section className={styles.section}>
              <p className={textStyles.bodyMd}>Introduction</p>
              <p className={cn(styles.copy, textStyles.bodyMd)}>
                The text within a button is not always centered vertically. That
                is the font’s fault, not yours. You can trim the line box in CSS
                with{" "}
                <CodeChip>text-box: trim-both cap alphabetic</CodeChip>. That property became a cross-browser option on
                August 18, 2026, when Firefox adopted it. The default is still
                the untrimmed box, and component kits were written for that
                default.
              </p>
              <p className={cn(styles.copy, textStyles.bodyMd)}>
                Trim cuts descenders. An input, a textarea, or any box that
                clips overflow will cut g, p, and y once the line stops at the
                cap and the baseline. Turn trim off on those controls and you
                are back to the font’s real metrics, which may still sit high or
                low.
              </p>
              <p className={cn(styles.copy, textStyles.bodyMd)}>
                For the web, fix those metrics in CSS and leave the file alone.
                The same box is written as ascent-override, descent-override,
                and line-gap-override. Rewriting the font file is the other
                path, mostly for typographers who need that box everywhere the
                font is used, not only in one stylesheet.
              </p>
            </section>

            <section className={styles.section}>
              <p className={textStyles.bodyMd}>How it works</p>
              <p className={cn(styles.copy, textStyles.bodyMd)}>
                Both paths use one box. The leftover above the caps equals the
                leftover below the baseline, so a one-word label sits in the
                middle of equal padding. Spare height the file already has is
                used first, whether that is empty room in the line or extra
                leading. The line only grows when real descenders would not fit
                after that.
              </p>
            </section>

            <section className={cn(styles.section, styles.gui)}>
              <div className={styles.intro}>
                <p className={textStyles.bodyMd}>GUI solution</p>
                <p className={cn(styles.copy, textStyles.bodyMd)}>
                  Drop a font file to see the measurement, then download the
                  rewritten font. That file is for typographers, and for any
                  place that cannot take a stylesheet. You can also try three
                  selected fonts at the bottom, and see how the tool changed
                  them: I’ve selected fonts I admire and would like to use in my
                  work, but their metrics are a bit off by default: Unica77 LL
                  by Lineto, GT America by Grilli Type, and BST Ritma by British
                  Standard Type.
                </p>
              </div>
              <div className={styles.demo}>
                <div className={styles.row}>
                  <div className={styles.fonts}>
                    {TRIED_FONTS.map((item) => (
                      <Tab
                        key={item.id}
                        icon="aa"
                        active={source === item.id}
                        onClick={() => selectSource(item.id)}
                      >
                        {item.label}
                      </Tab>
                    ))}
                    {uploads.map((item) => (
                      <Tab
                        key={item.id}
                        icon="aa"
                        active={source === item.id}
                        onClick={() => selectSource(item.id)}
                      >
                        {item.label}
                      </Tab>
                    ))}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  fullWidth
                  icon="upload"
                  disabled={uploading}
                  aria-busy={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  {uploading
                    ? "Uploading and normalizing..."
                    : "Upload your font"}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  disabled={uploading}
                  accept=".ttf,.otf,.woff,.woff2,.ttc"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFile(file);
                    event.target.value = "";
                  }}
                />
                {error ? (
                  <p className={cn(styles.error, textStyles.bodySm)}>{error}</p>
                ) : null}
                <div
                  className={cn(
                    styles.examples,
                    uploading && styles.examplesBusy,
                  )}
                  inert={uploading || undefined}
                  aria-busy={uploading}
                >
                  {result?.blob && !loading ? (
                    <Button
                      variant="secondary"
                      icon="download"
                      fullWidth
                      onClick={download}
                    >
                      Download
                    </Button>
                  ) : null}
                  <SummaryExample
                    result={result}
                    loading={loading}
                    disabled={uploading}
                    name={fontName}
                  />
                  <MetricsExample
                    result={result}
                    loading={loading}
                    disabled={uploading}
                    name={fontName}
                  />
                  <ButtonExample
                    result={result}
                    loading={loading}
                    disabled={uploading}
                    name={fontName}
                  />
                  <TextExample
                    result={result}
                    loading={loading}
                    disabled={uploading}
                    name={fontName}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.methods}>
                <div className={styles.method}>
                  <p className={textStyles.bodyMd}>CLI solution</p>
                  <p className={cn(styles.copy, textStyles.bodyMd)}>
                    Install with npm. Then point the command at a single file, a
                    set of files, or a folder. A folder means every .otf, .ttf,
                    .woff, and .woff2 inside it.
                  </p>
                  <Shell code="npm i -g normalize-metrics" />
                  <p className={cn(styles.copy, textStyles.bodyMd)}>
                    Or add it to a repo as a dev dependency:
                  </p>
                  <Shell code="npm i -D normalize-metrics" />
                </div>

                <div className={styles.method}>
                  <p className={textStyles.bodyMd}>CSS method</p>
                  <p className={cn(styles.copy, textStyles.bodyMd)}>
                    For the web, leave the font files alone.{" "}
                    <CodeChip>--css</CodeChip> saves style.css with
                    ascent-override, descent-override, and line-gap-override.
                  </p>
                  <Shell code="normalize-metrics Inter-Regular.woff2 Inter-Regular.otf --css" />
                  <p className={cn(styles.copy, textStyles.bodyMd)}>
                    Or once, without installing:
                  </p>
                  <Shell code="npx normalize-metrics ./fonts --css" />
                  <CodeFile name="style.css" code={CSS_PREVIEW} />
                </div>

                <div className={styles.method}>
                  <p className={textStyles.bodyMd}>File rewrite method</p>
                  <p className={cn(styles.copy, textStyles.bodyMd)}>
                    For typographers, and for anywhere a stylesheet cannot go.
                    It writes a normalized copy next to the original. The
                    letters stay the same.
                  </p>
                  <Shell code="normalize-metrics Inter-Regular.woff2 Inter-Regular.otf" />
                  <p className={cn(styles.copy, textStyles.bodyMd)}>
                    <CodeChip>--check</CodeChip> reports fonts that are still
                    off and exits without writing.
                  </p>
                </div>
              </div>
              <div className={styles.row}>
                <Button
                  variant="secondary"
                  size="m"
                  icon="github"
                  href="https://github.com/gerguno/normalize-metrics"
                  target="_blank"
                >
                  View on Github
                </Button>
                <Button
                  variant="secondary"
                  size="m"
                  icon="npm"
                  href="https://www.npmjs.com/package/normalize-metrics"
                  target="_blank"
                >
                  View on NPM
                </Button>
              </div>
            </section>
          </div>
        </Header>
      </div>

      <div className={styles.bottom}>
        <Subscribe />

        <div className={cn(styles.footer, textStyles.bodyMd)}>
          <TextLink href="https://x.com/olesgergun" target="_blank">
            Follow me on X
          </TextLink>
          <p>
            © As a part of Rhizome project by{" "}
            <TextLink href="https://olesgergun.com" target="_blank">
              Oles Gergun
            </TextLink>
            , 2026
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
    </main>
  );
}
