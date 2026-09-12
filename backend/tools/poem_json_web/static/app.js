// Poem to JSON: everything happens on your computer (the Flask app reads the files).
(() => {
  const $ = (id) => document.getElementById(id);
  const entries = [];          // { id, name, status: "reading" | "ok" | "error", data, error }
  const TRANSLIT_KEY = "poemToJson.showTranscription";
  let selectedId = null;
  let nextId = 1;

  // ---------------------------------------------------------------- helpers
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // First letter of a sadr with its harakat. A zero-width joiner keeps it joined to the rest
  // of the word when the letter connects forward (not ا د ذ ر ز و ...).
  const NON_JOINING = "اأإآٱدذرزوؤةء";
  function splitInitial(sadr) {
    const m = sadr.match(/^([\u0621-\u064A][\u064B-\u065F\u0670]*)([\s\S]*)$/);
    if (!m) return { initial: "", zwj: "", rest: sadr };
    const joins = !NON_JOINING.includes(m[1][0]) && /^[\u0621-\u064A]/.test(m[2]);
    return { initial: m[1], zwj: joins ? "\u200D" : "", rest: m[2] };
  }

  function jsonText(data) { return JSON.stringify(data, null, 2); }
  function okPoems() { return entries.filter((e) => e.status === "ok").map((e) => e.data); }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = el("a");
    a.href = url; a.download = filename;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function notify(message, isError = false) {
    const n = $("notice");
    n.textContent = message;
    n.classList.toggle("is-error", isError);
    n.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { n.hidden = true; }, 6000);
  }

  async function postJson(url, body) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res;
  }

  // ---------------------------------------------------------------- reading poems
  function addResult(entry, data, error) {
    if (data) {
      // a poem read again replaces its older version
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i] !== entry && entries[i].status === "ok" && entries[i].data.code === data.code) {
          if (selectedId === entries[i].id) selectedId = entry.id;
          entries.splice(i, 1);
        }
      }
      Object.assign(entry, { status: "ok", data, error: null });
    } else {
      Object.assign(entry, { status: "error", error });
    }
    const selected = entries.find((e) => e.id === selectedId);
    if (!selected || selected.status !== "ok") selectedId = entry.id;   // show the first good poem, don't jump around after
    render();
  }

  async function readFile(file) {
    const entry = { id: nextId++, name: file.name, status: "reading" };
    entries.push(entry);
    render();
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/parse", { method: "POST", body: form });
      const body = await res.json();
      res.ok ? addResult(entry, body) : addResult(entry, null, body.error || `Error ${res.status}`);
    } catch (err) {
      addResult(entry, null, "The page could not reach the app. Is app.py still running?");
    }
  }

  async function readPasted() {
    const code = $("pasteCode").value.trim();
    const text = $("pasteText").value;
    const entry = { id: nextId++, name: code || "Pasted poem", status: "reading" };
    entries.push(entry);
    render();
    try {
      const res = await postJson("/api/parse-text", { code, text });
      const body = await res.json();
      res.ok ? addResult(entry, body) : addResult(entry, null, body.error || `Error ${res.status}`);
    } catch (err) {
      addResult(entry, null, "The page could not reach the app. Is app.py still running?");
    }
  }

  // ---------------------------------------------------------------- rendering
  function select(id) {
    selectedId = id;
    render();
  }

  function render() {
    renderList();
    renderDetail();
    $("batchActions").hidden = okPoems().length === 0;
  }

  function renderList() {
    const list = $("poemList");
    list.replaceChildren();
    const sorted = [...entries].sort((a, b) => (a.data?.code || a.name).localeCompare(b.data?.code || b.name));
    for (const e of sorted) {
      const li = el("li", e.status === "error" ? "is-error" : "");
      const button = el("button");
      button.type = "button";
      button.setAttribute("aria-current", String(e.id === selectedId));
      button.addEventListener("click", () => select(e.id));

      if (e.status === "ok") {
        const d = e.data;
        button.append(el("span", "code", d.code), el("span", "incipit", d.title));
        const sub = el("span", "sub", `${d.bayt_count} abyat`);
        if (d.warnings.length) {
          sub.append(", ", el("span", "has-warn", `${d.warnings.length} warning${d.warnings.length > 1 ? "s" : ""}`));
        }
        button.append(sub);
      } else {
        button.append(el("span", "code", e.name), el("span"));
        button.append(el("span", "sub", e.status === "reading" ? "Reading…" : e.error));
      }
      li.append(button);
      list.append(li);
    }
    $("emptyList").hidden = entries.length > 0;
    $("count").textContent = entries.length ? `(${okPoems().length})` : "";
  }

  function renderDetail() {
    const entry = entries.find((e) => e.id === selectedId);
    const show = entry && entry.status === "ok";
    $("emptyDetail").hidden = !!show;
    $("poemView").hidden = !show;
    if (!show) {
      if (entry && entry.status === "error") {
        $("emptyDetail").replaceChildren(el("p", "", entry.error));
      }
      return;
    }
    const d = entry.data;
    $("pCode").textContent = d.code;
    $("pName").textContent = d.title;
    $("pFile").textContent = d.source_file;
    $("downloadJson").textContent = `Download ${d.code}.json`;

    $("fMuq").textContent = d.counts.muqaddima;
    const acr = $("fAcr");
    acr.className = d.is_acrostic ? "yes" : "";
    acr.textContent = d.title_source === "first_sadr" ? "First sadr"
      : d.is_acrostic ? `Own name, acrostic ${d.acrostic_match}%` : "Own name, not acrostic";
    $("fAbyat").textContent = d.hemistichs_per_bayt === 4 ? `${d.bayt_count} (4 hemistichs)` : d.bayt_count;
    $("fKha").textContent = d.counts.khatima;

    const warnings = $("warnings");
    warnings.replaceChildren(...d.warnings.map((w) => el("li", "", w)));

    renderManuscript(d);
    $("viewJson").textContent = jsonText(d);
  }

  function renderManuscript(d) {
    const page = $("viewPoem");
    page.replaceChildren();
    const labels = { muqaddima: "Muqaddima", title: "Name", matn: "Abyat", khatima: "Khatima" };
    const acrostic = !!d.is_acrostic;
    page.classList.toggle("is-acrostic", acrostic);

    let block = null, current = null;
    for (const line of d.lines) {
      if (line.section !== current) {
        current = line.section;
        block = el("section", `sec ${line.section}`);
        const body = el("div", "sec-body");
        body.lang = "ar";
        block.append(body, el("div", "sec-label", labels[line.section] || line.section));
        page.append(block);
      }
      const body = block.firstChild;

      if (line.kind === "bayt") {
        const row = el("div", line.hemistichs.length === 4 ? "bayt four" : "bayt");
        row.id = `bayt-${line.bayt_number}`;
        row.append(el("span", "n", line.bayt_number));
        line.hemistichs.forEach((h, i) => {
          const cell = el("span", "h");
          if (i === 0 && acrostic) {
            const { initial, zwj, rest } = splitInitial(h);
            cell.append(el("span", "initial", initial + zwj), zwj + rest);
          } else {
            cell.textContent = h;
          }
          row.append(cell);
        });
        row.append(translitLine(line));
        body.append(row);
      } else {
        body.append(el("p", "prose", line.hemistichs.join(" ")));
        body.append(translitLine(line));
      }
    }
  }

  // Latin transcription on one left-to-right line under the Arabic: sadr first, then ajz.
  function translitLine(line) {
    const div = el("div", "translit");
    div.lang = "fr";
    const parts = (line.transcription && line.transcription.local) || [];
    parts.forEach((part, i) => {
      if (i) div.append(el("span", "sep", "|"));
      div.append(el("span", "part", part));
    });
    return div;
  }

  function applyTranslit(on) {
    $("viewPoem").classList.toggle("with-translit", on);
    $("showTranslit").checked = on;
    try { localStorage.setItem(TRANSLIT_KEY, on ? "1" : "0"); } catch { /* private mode */ }
  }
  $("showTranslit").addEventListener("change", (e) => applyTranslit(e.target.checked));
  try { applyTranslit(localStorage.getItem(TRANSLIT_KEY) === "1"); } catch { applyTranslit(false); }

  // ---------------------------------------------------------------- tabs
  function wireTabs(pairs) {
    for (const [tabId, panelId] of pairs) {
      $(tabId).addEventListener("click", () => {
        for (const [t, p] of pairs) {
          const on = t === tabId;
          $(t).setAttribute("aria-selected", String(on));
          $(p).hidden = !on;
        }
      });
    }
  }
  wireTabs([["tabUpload", "panelUpload"], ["tabPaste", "panelPaste"]]);
  wireTabs([["tabPoem", "viewPoem"], ["tabJson", "viewJson"]]);
  $("tabJson").addEventListener("click", () => { $("translitToggle").hidden = true; });
  $("tabPoem").addEventListener("click", () => { $("translitToggle").hidden = false; });

  // ---------------------------------------------------------------- inputs
  $("fileInput").addEventListener("change", (event) => {
    [...event.target.files].forEach(readFile);
    event.target.value = "";
  });
  const drop = $("drop");
  ["dragenter", "dragover"].forEach((type) => drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((type) => drop.addEventListener(type, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    [...e.dataTransfer.files].forEach(readFile);
  });
  $("pasteGo").addEventListener("click", readPasted);

  // ---------------------------------------------------------------- outputs
  const selectedData = () => entries.find((e) => e.id === selectedId)?.data;

  $("downloadJson").addEventListener("click", () => {
    const d = selectedData();
    if (d) downloadBlob(new Blob([jsonText(d)], { type: "application/json" }), `${d.code}.json`);
  });

  $("copyJson").addEventListener("click", async () => {
    const d = selectedData();
    if (!d) return;
    try {
      await navigator.clipboard.writeText(jsonText(d));
      notify(`${d.code} JSON copied.`);
    } catch {
      notify("Copy is blocked by the browser. Open the JSON tab and select the text instead.", true);
    }
  });

  async function save(poems) {
    try {
      const res = await postJson("/api/save", { poems });
      const body = await res.json();
      if (!res.ok) return notify(body.error, true);
      notify(poems.length === 1 ? `Saved to ${body.saved[0]}` : `${body.saved.length} poems saved in ${body.folder}`);
    } catch {
      notify("Not saved: the page could not reach the app.", true);
    }
  }
  $("saveOne").addEventListener("click", () => { const d = selectedData(); if (d) save([d]); });
  $("saveAll").addEventListener("click", () => {
    const poems = okPoems();
    save(poems);
  });

  $("zipAll").addEventListener("click", async () => {
    const button = $("zipAll");
    button.disabled = true;
    try {
      const res = await postJson("/api/zip", { poems: okPoems() });
      if (!res.ok) throw new Error((await res.json()).error);
      downloadBlob(await res.blob(), "poems-json.zip");
    } catch (err) {
      notify(`Download failed: ${err.message}`, true);
    } finally {
      button.disabled = false;
    }
  });

  render();
})();
