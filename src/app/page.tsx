"use client";

import { ChangeEvent, CSSProperties, DragEvent, PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

type LocalFile = { id: string; name: string; size: number; type: string; modified: Date; uploadedBy: string };
type UploadFeedback = { id: string; files: LocalFile[]; progress: number; visible: boolean };
type Arrival = { fileId: string; src: string; from: { left: number; top: number; width: number; height: number } };

const formatSize = (size: number) => size < 1024 ? `${size} B` : size < 1024 ** 2 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 ** 2).toFixed(1)} MB`;
const iconFor = (file: LocalFile) => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/pdf/.test(ext)) return "/icons/file-pdf.svg";
  if (/doc|docx|txt|rtf/.test(ext)) return "/icons/file-docs.svg";
  if (/xls|xlsx|csv/.test(ext)) return "/icons/file-excel.svg";
  if (/ppt|pptx/.test(ext)) return "/icons/file-ppt.svg";
  if (/png|jpe?g|gif|webp|svg/.test(ext)) return "/icons/file-image.svg";
  if (/mp3|wav|m4a/.test(ext)) return "/icons/file-audio.svg";
  if (/mp4|mov|webm/.test(ext)) return "/icons/file-video.svg";
  if (/md/.test(ext)) return "/icons/file-markdown.svg";
  if (/js|ts|html|css|json|py/.test(ext)) return "/icons/file-code.svg";
  return "/icons/file-default.svg";
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></>,
    messages: <><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11h8m-8 4h5"/></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7-.2.1-1.3.8-.2 1.8h-2.8l-.3-1.8-1.4-.8-1.7.7-1.4-2.4 1.4-1.1v-1.7l-1.4-1.1 1.4-2.4 1.7.7 1.4-.8.3-1.8h2.8l.2 1.8 1.3.8 1.7-.7 1.4 2.4-1.4 1.1z"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    forward: <><path d="m9 18 6-6-6-6"/></>,
    history: <><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01"/></>,
    workspace: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h8v8H8z"/></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.6a2 2 0 0 1-.6 1.8L7.7 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.8-.6l2.6.5a2 2 0 0 1 1.6 1.9Z"/></>,
    trash: <><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"/></>,
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2"/></>,
    folder: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    moon: <path d="M20.8 14.2A8.5 8.5 0 0 1 9.8 3.2 8.5 8.5 0 1 0 20.8 14.2Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    chev: <path d="m7 10 5 5 5-5"/>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4"/></>,
    file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Illustration({ active, fileRef }: { active: boolean; fileRef: React.RefObject<SVGGElement | null> }) {
  return <div className={`illustration ${active ? "is-active" : ""}`} aria-hidden="true">
    <div className="glow" />
    <div className="paper paper-one"><span /><span /><span /></div>
    <div className="paper paper-two"><span /><span /></div>
    <svg className="scene" viewBox="0 0 420 270" role="presentation">
      <defs>
        <radialGradient id="folder-shadow-gradient">
          <stop offset="0" stopColor="#A99AEF" stopOpacity=".2" />
          <stop offset=".58" stopColor="#B8AAEE" stopOpacity=".11" />
          <stop offset="1" stopColor="#C8BDF2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className="folder-ground-shadow" cx="209" cy="238" rx="112" ry="10" fill="url(#folder-shadow-gradient)" />
      <g className="folder-character">
        <path d="M81 103c0-8 6-14 14-14h61l24 24h127c9 0 16 7 16 16v89c0 10-8 18-18 18H99c-10 0-18-8-18-18z" fill="#9A78FB"/>
        <path d="M81 137c0-9 7-16 16-16h207c10 0 18 8 18 18v79c0 10-8 18-18 18H99c-10 0-18-8-18-18z" fill="#7141F8"/>
        <path d="M81 157q0-18 18-18h211q12 0 12 18v59q0 20-20 20H100q-19 0-19-19z" fill="#8059FA"/>
        <path d="M81 181q115 17 241-2v38q0 19-19 19H100q-19 0-19-19z" fill="#7141F8"/>
        <g className="face face-folder"><ellipse cx="173" cy="180" rx="4.8" ry="7"/><ellipse cx="204" cy="180" rx="4.8" ry="7"/><path d="M179 196q10 10 20 0" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></g>
        <circle cx="162" cy="190" r="5" fill="#F5A9D4" opacity=".75"/><circle cx="215" cy="190" r="5" fill="#F5A9D4" opacity=".75"/>
      </g>
      <g className="file-character" ref={fileRef}>
        <path d="M262 41h61l28 28v99q0 9-9 9h-80q-9 0-9-9V50q0-9 9-9z" fill="#fff" stroke="#DBD3F8" strokeWidth="2"/>
        <path d="M323 42v20q0 8 8 8h20" fill="#EEE9FF" stroke="#DBD3F8" strokeWidth="2"/>
        <path d="M280 92h36m-36 13h47m-47 13h28" stroke="#D8D0F3" strokeWidth="4" strokeLinecap="round"/>
        <g className="face face-file"><ellipse cx="290" cy="145" rx="4" ry="6" fill="#41415C"/><ellipse cx="313" cy="145" rx="4" ry="6" fill="#41415C"/><path d="M295 156q7 7 14 0" fill="none" stroke="#7141F8" strokeWidth="2" strokeLinecap="round"/></g>
        <circle cx="282" cy="151" r="4" fill="#F5A9D4" opacity=".7"/><circle cx="322" cy="151" r="4" fill="#F5A9D4" opacity=".7"/>
      </g>
      <path className="sparkle sparkle-a" d="M106 72v13m-6.5-6.5h13" stroke="#D0C2FF" strokeWidth="3" strokeLinecap="round"/>
      <path className="sparkle sparkle-b" d="M351 190v10m-5-5h10" stroke="#D0C2FF" strokeWidth="2.5" strokeLinecap="round"/>
      {active && <path className="flight-path" d="M293 176Q275 208 251 189" fill="none" stroke="#B39EFF" strokeWidth="2" strokeDasharray="4 5"/>}
    </svg>
  </div>;
}

export default function Home() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<"files" | "folders">("files");
  const [view, setView] = useState("My files");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [upload, setUpload] = useState<UploadFeedback | null>(null);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [uploaderFilter, setUploaderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [folders, setFolders] = useState<string[]>([]);
  const [folderModal, setFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [notice, setNotice] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const [eye, setEye] = useState({ x: 0, y: 0 });
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const illustrationFileRef = useRef<SVGGElement>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const iconRefs = useRef(new Map<string, HTMLImageElement>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const latestUploadId = useRef("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { if (!notice) return; noticeTimer.current = setTimeout(() => setNotice(""), 3600); return () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }; }, [notice]);

  const say = (message: string) => setNotice(message);
  const animateUpload = (incoming: File[]) => {
    if (!incoming.length) return;
    setActiveTab("files");
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    latestUploadId.current = id;
    const now = new Date();
    setCurrentDate(now);
    const newFiles = incoming.map((file, index) => ({ id: `${id}-${index}`, name: file.name, size: file.size, type: file.type || "Unknown file type", modified: now, uploadedBy: "You" }));
    setUpload({ id, files: newFiles, progress: 0, visible: true });
    [12, 29, 48, 69, 86, 100].forEach((progress, index) => {
      const timer = setTimeout(() => {
        if (latestUploadId.current === id) setUpload((current) => current?.id === id ? { ...current, progress } : current);
      }, index < 5 ? (index + 1) * 450 : 2550);
      timers.current.push(timer);
    });
    const finish = setTimeout(() => {
      const sourceElement = illustrationFileRef.current;
      const sourceRect = files.length === 0 && sourceElement?.isConnected ? sourceElement.getBoundingClientRect() : null;
      const representative = newFiles[0];
      if (sourceRect && representative && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setArrival({ fileId: representative.id, src: iconFor(representative), from: { left: sourceRect.left + sourceRect.width * .43, top: sourceRect.top + sourceRect.height * .55, width: 30, height: 30 } });
      }
      setFiles((current) => [...newFiles, ...current]);
      const uploadedIds = newFiles.map((file) => file.id);
      if (latestUploadId.current === id) setRecentIds(uploadedIds);
      const clearHighlight = setTimeout(() => setRecentIds((current) => current.filter((fileId) => !uploadedIds.includes(fileId))), 4200);
      timers.current.push(clearHighlight);
      if (latestUploadId.current === id) setUpload((current) => current?.id === id ? null : current);
    }, 2700);
    timers.current.push(finish);
  };
  const onSelect = (event: ChangeEvent<HTMLInputElement>) => { const selected = Array.from(event.target.files ?? []); event.target.value = ""; animateUpload(selected); };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); const dropped = Array.from(event.dataTransfer.files ?? []); if (!dropped.length) say("No files found in that drop. Try selecting a file."); else animateUpload(dropped); };
  const filteredFiles = useMemo(() => {
    const value = `${query} ${globalQuery}`.trim().toLowerCase();
    const now = currentDate?.getTime() ?? 0;
    return [...files].filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const matchesType = fileTypeFilter === "all" || (fileTypeFilter === "document" ? /^(pdf|docx?|txt|rtf|md|xlsx?|pptx?|odt|ods|odp)$/.test(ext) : fileTypeFilter === "image" ? /^(png|jpe?g|gif|webp|svg|bmp|tiff?)$/.test(ext) : fileTypeFilter === "videos" ? /^(mp4|mov|webm|avi|mkv)$/.test(ext) : fileTypeFilter === "musics" ? /^(mp3|wav|m4a|aac|ogg|flac)$/.test(ext) : ext === fileTypeFilter);
      const age = now - file.modified.getTime();
      const today = currentDate ? new Date(currentDate) : null;
      today?.setHours(0, 0, 0, 0);
      const year = today?.getFullYear() ?? 0;
      const thisYear = file.modified.getFullYear() === year;
      const lastYear = file.modified.getFullYear() === year - 1;
      const matchesDate = dateFilter === "all" || !today || (dateFilter === "today" ? file.modified.getTime() >= today.getTime() : dateFilter === "last-7-days" ? age < 604800000 : dateFilter === "last-30-days" ? age < 2592000000 : dateFilter === "this-year" ? thisYear : lastYear);
      return file.name.toLowerCase().includes(value) && matchesType && matchesDate && (uploaderFilter === "all" || file.uploadedBy === uploaderFilter);
    }).sort((a, b) => sortBy === "oldest" ? a.modified.getTime() - b.modified.getTime() : sortBy === "name" ? a.name.localeCompare(b.name) : b.modified.getTime() - a.modified.getTime());
  }, [files, query, globalQuery, sortBy, fileTypeFilter, uploaderFilter, dateFilter, currentDate]);
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); setEye({ x: Math.max(-5, Math.min(5, (event.clientX - rect.left - rect.width / 2) / 34)), y: Math.max(-4, Math.min(4, (event.clientY - rect.top - rect.height / 2) / 40)) }); };
  const eyeStyle = { "--eye-x": `${eye.x}px`, "--eye-y": `${eye.y}px` } as CSSProperties;

  useEffect(() => {
    if (!arrival) return;
    let cancelled = false;
    let animation: Animation | undefined;
    let sparkleAnimation: Animation | undefined;
    let finish: ReturnType<typeof setTimeout> | undefined;
    let firstFrame = 0;
    let secondFrame = 0;
    const cancel = () => {
      cancelled = true;
      animation?.cancel();
      sparkleAnimation?.cancel();
      if (finish) clearTimeout(finish);
      setArrival(null);
    };
    window.addEventListener("resize", cancel, { once: true });
    window.addEventListener("scroll", cancel, { once: true, capture: true });
    // Portal the icon to the document body and leave it at its source for a paint
    // before measuring the newly committed row and starting the flight.
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (cancelled) return;
        const row = rowRefs.current.get(arrival.fileId);
        const target = iconRefs.current.get(arrival.fileId);
        const overlay = document.querySelector<HTMLElement>(`[data-arrival-icon="${arrival.fileId}"]`);
        const sparkles = document.querySelector<HTMLElement>("[data-arrival-sparkles]");
        if (!row || !target || !overlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setArrival(null); return; }
        const rect = target.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0 || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) { setArrival(null); return; }
        if (sparkles) {
          sparkles.style.left = `${rect.left + rect.width / 2}px`;
          sparkles.style.top = `${rect.top + rect.height / 2}px`;
          sparkleAnimation = sparkles.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.6)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)", offset: .45 }, { opacity: 0, transform: "translate(-50%,-50%) scale(1.12)" }], { duration: 380, delay: 470, easing: "ease-out" });
        }
        animation = overlay.animate([
          { left: `${arrival.from.left}px`, top: `${arrival.from.top}px`, width: `${arrival.from.width}px`, height: `${arrival.from.height}px`, transform: "translate(-50%, -50%) scale(.88)", opacity: 1 },
          { left: `${(arrival.from.left + rect.left + rect.width / 2) / 2}px`, top: `${(arrival.from.top + rect.top + rect.height / 2) / 2 - 26}px`, width: "27px", height: "27px", transform: "translate(-50%, -50%) scale(1.04)", opacity: 1, offset: .52 },
          { left: `${rect.left + rect.width / 2}px`, top: `${rect.top + rect.height / 2}px`, width: `${rect.width}px`, height: `${rect.height}px`, transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        ], { duration: 850, easing: "cubic-bezier(.22,.72,.25,1)", fill: "forwards" });
        finish = setTimeout(() => setArrival(null), 850);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      animation?.cancel();
      sparkleAnimation?.cancel();
      if (finish) clearTimeout(finish);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("scroll", cancel, true);
    };
  }, [arrival, activeTab, filteredFiles]);

  return (
    <main className={`app-shell ${dark ? "dark" : ""}`}>
      <header className="app-topbar">
        <button className="workspace-selector" aria-label="Current organisation">
          <span className="workspace-logo"><Icon name="workspace" size={17} /></span>
          <Icon name="chev" size={15} />
        </button>
        <div className="global-search-group">
          <div className="history-controls" aria-label="Navigation history">
            <button aria-label="Back"><Icon name="back" /></button>
            <button aria-label="Forward"><Icon name="forward" /></button>
            <button aria-label="History"><Icon name="history" /></button>
          </div>
          <label className="global-search"><Icon name="search" size={18} /><input value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} placeholder="Search messages and people..." aria-label="Search workspace" /><kbd>Ctrl K</kbd></label>
        </div>
        <div className="topbar-tools">
          <button aria-label="Help" title="Help"><Icon name="help" size={20} /></button>
          <button className="theme-toggle" aria-label={`Switch to ${dark ? "light" : "dark"} theme`} title={`Switch to ${dark ? "light" : "dark"} theme`} onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"} size={17} /></button>
        </div>
      </header>

      <aside className="app-rail" aria-label="Main navigation">
        <nav className="main-nav">
          {[ ["home", "Home"], ["messages", "DMs"], ["people", "People"], ["folder", "Files"], ["phone", "Buzz"] ].map(([icon, label]) => (
            <button className={`main-nav-item ${label === "Files" ? "selected" : ""}`} key={label} aria-current={label === "Files" ? "page" : undefined} title={label}><span><Icon name={icon} size={20} /></span><small>{label}</small></button>
          ))}
        </nav>
        <nav className="rail-bottom" aria-label="Account navigation">
          <button className="main-nav-item" title="Notifications" aria-label="Notifications"><span><Icon name="bell" size={19} /></span></button>
          <button className="main-nav-item" title="Settings" aria-label="Settings"><span><Icon name="settings" size={19} /></span></button>
        </nav>
      </aside>

      <aside className="files-nav" aria-label="Files navigation">
        <nav>
          {[["All files", "all"], ["My files", "my"], ["Shared with me", "shared"], ["Deleted files", "deleted"]].map(([label, key]) => (
            <button key={key} onClick={() => key === "my" ? setView("My files") : (setView(label), setActiveTab("files"))} className={`files-nav-item ${view === label ? "selected" : ""}`} aria-current={view === label ? "page" : undefined}><Icon name={key === "all" ? "folder" : key === "my" ? "file" : key === "shared" ? "people" : "trash"} size={16} />{label}</button>
          ))}
        </nav>
      </aside>

      <section className="files-page-shell">
        <div className="files-heading-row">
          <h1>{view === "My files" ? "My Files" : view}</h1>
          <div className="heading-actions">
            <button className="button button-outline" onClick={() => setFolderModal(true)}><Icon name="plus" size={17} />New Folder</button>
            <button className="button button-outline upload-button" onClick={() => inputRef.current?.click()}><Icon name="upload" size={17} />Upload File</button>
          </div>
        </div>
        <input ref={inputRef} type="file" multiple className="sr-only" onChange={onSelect} aria-label="Choose files to upload" />
        <div className="filters-row">
          <label className="searchbox"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by file name" aria-label="Search by file name" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear filename search"><Icon name="close" size={14} /></button>}</label>
          <label className="filter-select"><span className="sr-only">File Type</span><select aria-label="File Type" value={fileTypeFilter} onChange={(event) => setFileTypeFilter(event.target.value)}><option value="all">File Type</option><option value="document">Documents</option><option value="image">Images</option><option value="videos">Videos</option><option value="musics">Music</option></select><Icon name="chev" size={14} /></label>
          <label className="filter-select"><span className="sr-only">Uploaded By</span><select aria-label="Uploaded By" value={uploaderFilter} onChange={(event) => setUploaderFilter(event.target.value)}><option value="all">Uploaded By</option><option value="You">You</option></select><Icon name="chev" size={14} /></label>
          <label className="filter-select"><span className="sr-only">Date Modified</span><select aria-label="Date Modified" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="all">Date Modified</option><option value="today">Today</option><option value="last-7-days">Last 7 days</option><option value="last-30-days">Last 30 days</option><option value="this-year">This year</option><option value="last-year">Last year</option></select><Icon name="chev" size={14} /></label>
          <label className="filter-select sort-select"><span className="sr-only">Sort</span><select aria-label="Sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Newest to Oldest</option><option value="oldest">Oldest to Newest</option></select><Icon name="chev" size={14} /></label>
        </div>
        <div className="tabs" role="tablist" aria-label="File views">
          <button role="tab" aria-selected={activeTab === "folders"} className={activeTab === "folders" ? "tab active" : "tab"} onClick={() => setActiveTab("folders")}>Folders</button>
          <button role="tab" aria-selected={activeTab === "files"} className={activeTab === "files" ? "tab active" : "tab"} onClick={() => setActiveTab("files")}>Files</button>
        </div>
        <div className={`file-content-area ${dragging ? "dragging" : ""}`} style={eyeStyle} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={onDrop} onPointerMove={onPointerMove} onPointerLeave={() => setEye({ x: 0, y: 0 })}>
          {activeTab === "files" && files.length === 0 && <div className="empty-state"><Illustration active={dragging || upload !== null} fileRef={illustrationFileRef} /><h2>No files yet</h2><p>Upload or drag &amp; drop to get started</p><button type="button" className="button empty-upload-button" onClick={() => inputRef.current?.click()}><Icon name="upload" size={17} />Upload File</button></div>}
          {activeTab === "files" && upload?.visible && <div className="upload-card" aria-live="polite"><div className="upload-card-heading"><div className="upload-symbol"><Icon name="upload" size={17} /></div><div><strong>Uploading {upload.files.length === 1 ? "file" : `${upload.files.length} files`}</strong><span>Local simulation · {upload.progress}%</span></div><button className="icon-button" onClick={() => setUpload((current) => current ? { ...current, visible: false } : null)} aria-label="Dismiss upload progress"> <Icon name="close" size={17} /></button></div><div className="upload-items">{upload.files.map((file) => <div className="upload-item" key={file.id}><div className="upload-item-top"><span><Icon name="file" size={15} />{file.name}</span><span>{formatSize(file.size)}</span></div><div className="progress-track"><div className="progress-value" style={{ width: `${upload.progress}%` }} /></div></div>)}</div></div>}
          {activeTab === "files" && files.length > 0 && <div className="file-table-wrap"><table className="file-table"><thead><tr><th>Name</th><th>Owner</th><th>Date Created</th><th>Size</th><th>Actions</th></tr></thead><tbody>{filteredFiles.map((file) => <tr key={file.id} ref={(node) => { if (node) rowRefs.current.set(file.id, node); else rowRefs.current.delete(file.id); }} className={`${recentIds.includes(file.id) ? "recent-row" : ""} ${arrival?.fileId === file.id ? "arrival-target" : ""}`}><td><div className="file-name"><Image ref={(node) => { if (node) iconRefs.current.set(file.id, node); else iconRefs.current.delete(file.id); }} src={iconFor(file)} alt="" width={30} height={30} /><span>{file.name}</span></div></td><td>{file.uploadedBy}</td><td>{file.modified.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td><td>{formatSize(file.size)}</td><td><button className="file-menu" aria-label={`Actions for ${file.name}`}>•••</button></td></tr>)}</tbody></table>{filteredFiles.length === 0 && <div className="no-results">No files match these filters.</div>}</div>}
          {activeTab === "folders" && <div className="folder-view">{folders.length ? <div className="folder-grid">{folders.map((folder) => <div className="folder-card" key={folder}><Icon name="folder" size={22} /><span>{folder}</span></div>)}</div> : <div className="folder-empty"><p>No folders yet</p><p>Create a folder to get started</p></div>}</div>}
        </div>
      </section>
      {arrival && typeof document !== "undefined" && createPortal(<>
        <div className="arrival-flight" data-arrival-icon={arrival.fileId} style={{ left: arrival.from.left, top: arrival.from.top, width: arrival.from.width, height: arrival.from.height }} aria-hidden="true"><Image src={arrival.src} alt="" fill sizes="30px" /></div>
        <svg className="arrival-sparkles" data-arrival-sparkles aria-hidden="true" viewBox="0 0 40 40"><path d="M10 2v12m-6-6h12M30 23v12m-6-6h12"/><path d="M10 2v12m-6-6h12M30 23v12m-6-6h12" transform="translate(20 0) scale(.45)"/></svg>
      </>, document.body)}
      {notice && <div className="toast" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><Icon name="close" size={14} /></button></div>}
      {folderModal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFolderModal(false); }}><form className="folder-modal" onSubmit={(event) => { event.preventDefault(); const name = folderName.trim(); if (!name) { say("Add a name for your folder."); return; } setFolders((current) => [name, ...current]); setFolderName(""); setFolderModal(false); setActiveTab("folders"); say(`Folder “${name}” created in this preview.`); }}><div className="modal-top"><div className="modal-icon"><Icon name="folder" size={20} /></div><button type="button" className="icon-button" aria-label="Close dialog" onClick={() => setFolderModal(false)}><Icon name="close" /></button></div><h2>Create a folder</h2><p>Give your folder a name so it’s easy to find later.</p><label className="folder-field">Folder name<input autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="e.g. Brand assets" maxLength={64} /></label><div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setFolderModal(false)}>Cancel</button><button type="submit" className="button button-primary">Create folder</button></div></form></div>}
    </main>
  );
}
