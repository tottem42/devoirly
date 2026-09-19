(() => {
  const MONTHS = { janvier:1, fevrier:2, février:2, mars:3, avril:4, mai:5, juin:6, juillet:7, aout:8, août:8, septembre:9, octobre:10, novembre:11, decembre:12, décembre:12 };
  const normalizeSpaces = (value="") => value.replace(/\u00a0/g," ").replace(/[ \t]+/g," ").trim();

  function extractHomeworkLines(card) {
    const content = card.querySelector(".truncate-text");
    if (!content) return [];
    const tmp = document.createElement("div");
    tmp.innerHTML = content.innerHTML.replace(/<br\s*\/?\s*>/gi,"\n");
    tmp.querySelectorAll("div").forEach(node => { node.insertAdjacentText("beforebegin","\n"); node.insertAdjacentText("afterend","\n"); });
    return (tmp.textContent || "").split(/\n+/).map(normalizeSpaces).map(line => line.replace(/^[-–•]\s*/,"")).filter(Boolean);
  }

  function buildYearIndex() {
    const text = document.body?.innerText || "";
    const index = new Map();
    const monthNames = Object.keys(MONTHS).join("|");
    const regex = new RegExp(`(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\\s*(\\d{1,2})\\s+(${monthNames})\\s+(20\\d{2})`,"giu");
    let match;
    while ((match = regex.exec(text)) !== null) {
      const month = MONTHS[match[2].toLowerCase()];
      if (month) index.set(`${Number(match[1])}/${month}`, Number(match[3]));
    }
    return index;
  }

  function parseDate(title, yearIndex) {
    const match = title.match(/(\d{1,2})\/(\d{1,2})/);
    if (!match) return null;
    const day = Number(match[1]), month = Number(match[2]);
    const year = yearIndex.get(`${day}/${month}`) || new Date().getFullYear();
    return { day, month, year, iso:`${String(year).padStart(4,"0")}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}` };
  }

  function parseCard(card, yearIndex) {
    const title = normalizeSpaces(card.querySelector(".text-bold p")?.textContent || "");
    const weekday = normalizeSpaces(card.querySelector(".e-icon-date-day")?.textContent || "");
    const completed = card.querySelector('[role="checkbox"]')?.getAttribute("aria-checked") === "true";
    const homework = extractHomeworkLines(card);
    const date = parseDate(title, yearIndex);
    if (!title || !date || homework.length === 0) return null;
    // Stable even if the teacher edits the homework text: important for Google Calendar updates.
    const sourceKey = `educartable:${date.iso}:${title.toLowerCase()}`;
    return { id:sourceKey, sourceKey, title, weekday, completed, date, homework };
  }

  function extractAll() {
    const yearIndex = buildYearIndex();
    return [...document.querySelectorAll(".e-homework.card.task")].map(card => parseCard(card, yearIndex)).filter(Boolean).sort((a,b) => a.date.iso.localeCompare(b.date.iso));
  }

  chrome.runtime.onMessage.addListener((message,_sender,sendResponse) => {
    if (message?.type === "GET_HOMEWORK") {
      try { sendResponse({ success:true, homework:extractAll() }); }
      catch (error) { sendResponse({ success:false, error:error?.message || String(error) }); }
    }
  });
})();
