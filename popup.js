const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");
const selectAllButton = document.getElementById("selectAll");
const exportIcsButton = document.getElementById("exportIcs");
const syncGoogleButton = document.getElementById("syncGoogle");
const connectGoogleButton = document.getElementById("connectGoogle");
const disconnectGoogleButton = document.getElementById("disconnectGoogle");
const calendarSelect = document.getElementById("calendarSelect");
const calendarArea = document.getElementById("calendarArea");
const googleStatus = document.getElementById("googleStatus");
const syncInfo = document.getElementById("syncInfo");
const dayOffsetEl = document.getElementById("dayOffset");
const startTimeEl = document.getElementById("startTime");
const endTimeEl = document.getElementById("endTime");

let items = [];
let existingByKey = new Map();
let isGoogleConnected = false;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
}

function simpleHash(value = "") {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function parseIsoLocal(iso) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y,m-1,d,12,0,0,0);
}
function isoFromDate(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function addDays(iso, days) { const dt=parseIsoLocal(iso); dt.setDate(dt.getDate()+Number(days)); return isoFromDate(dt); }
function formatDate(iso) { return new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(parseIsoLocal(iso)); }

function settings() {
  return { dayOffset:Number(dayOffsetEl.value), startTime:startTimeEl.value || "18:00", endTime:endTimeEl.value || "19:00" };
}
function timesAreValid() { return settings().endTime > settings().startTime; }
async function saveSettings() {
  await chrome.storage.local.set({ agendaSettings:settings() });
  updateEventDates();
  refreshSyncBadges();
  updateButtonState();
}

function getSelectedGroups() {
  return items.map((item,index) => {
    const homework = [...document.querySelectorAll(`input[data-line-day="${index}"]:checked`)]
      .map(input => item.homework[Number(input.dataset.lineIndex)]).filter(Boolean);
    return { item, homework, index };
  }).filter(group => group.homework.length > 0);
}
function selectedLinesForIndex(index) {
  return [...document.querySelectorAll(`input[data-line-day="${index}"]:checked`)]
    .map(input => items[index]?.homework[Number(input.dataset.lineIndex)]).filter(Boolean);
}
function stableKey(item) { return simpleHash(item.sourceKey || item.id || `${item.date.iso}|${item.title}`); }
function fingerprint(item, homework) {
  const {dayOffset,startTime,endTime}=settings();
  const eventIso=addDays(item.date.iso,dayOffset);
  return simpleHash(JSON.stringify({source:item.sourceKey || item.id,target:eventIso,startTime,endTime,homework}));
}

function updateButtonState() {
  const hasAny = getSelectedGroups().length > 0;
  exportIcsButton.disabled = !hasAny || !timesAreValid();
  syncGoogleButton.disabled = !isGoogleConnected || !calendarSelect.value || !hasAny || !timesAreValid();
  if (!timesAreValid()) showSyncInfo("L’heure de fin doit être après l’heure de début.", true);
}

function syncDayCheckbox(dayIndex) {
  const dayCheckbox=document.querySelector(`input[data-day-index="${dayIndex}"]`);
  const lineCheckboxes=[...document.querySelectorAll(`input[data-line-day="${dayIndex}"]`)];
  const checkedCount=lineCheckboxes.filter(x=>x.checked).length;
  dayCheckbox.checked=checkedCount===lineCheckboxes.length && checkedCount>0;
  dayCheckbox.indeterminate=checkedCount>0 && checkedCount<lineCheckboxes.length;
}

function updateEventDates() {
  const {dayOffset,startTime,endTime}=settings();
  items.forEach((item,index)=>{
    const label=document.querySelector(`[data-event-date="${index}"]`);
    if (!label) return;
    label.textContent=`Événement : ${formatDate(addDays(item.date.iso,dayOffset))}, ${startTime}–${endTime}`;
  });
}

function badgeStateFor(index) {
  if (!isGoogleConnected || !calendarSelect.value) return {text:"",cls:""};
  const item=items[index];
  const homework=selectedLinesForIndex(index);
  const events=existingByKey.get(stableKey(item)) || [];
  if (!homework.length) return events.length ? {text:"À supprimer",cls:"change"} : {text:"Ignoré",cls:""};
  if (!events.length) return {text:"Nouveau",cls:"change"};
  const expected=fingerprint(item,homework);
  const same=events.length===1 && events[0]?.extendedProperties?.shared?.devoirlyFingerprint===expected;
  return same ? {text:"Synchronisé",cls:"ok"} : {text:"À mettre à jour",cls:"change"};
}

function refreshSyncBadges() {
  items.forEach((_item,index)=>{
    const badge=document.querySelector(`[data-sync-badge="${index}"]`);
    if (!badge) return;
    const state=badgeStateFor(index);
    badge.textContent=state.text;
    badge.className=`sync-badge ${state.cls}`.trim();
    badge.classList.toggle("hidden", !state.text);
  });
}

function render() {
  statusEl.classList.add("hidden");
  listEl.innerHTML=items.map((item,index)=>{
    const checked=!item.completed;
    return `<article class="day-card">
      <div class="day-head">
        <input type="checkbox" data-day-index="${index}" ${checked?"checked":""}>
        <div class="day-copy">
          <p class="day-title">Pour ${escapeHtml(formatDate(item.date.iso))}</p>
          <p class="day-meta">${item.homework.length} ligne${item.homework.length>1?"s":""}${item.completed?" · marqué terminé dans Educartable":""}</p>
          <p class="event-date" data-event-date="${index}"></p>
        </div>
        <span class="sync-badge hidden" data-sync-badge="${index}"></span>
      </div>
      <div class="homework-lines">${item.homework.map((line,lineIndex)=>`<label class="line"><input type="checkbox" data-line-day="${index}" data-line-index="${lineIndex}" ${checked?"checked":""}><span class="line-text">${escapeHtml(line)}</span></label>`).join("")}</div>
    </article>`;
  }).join("");

  listEl.querySelectorAll("input[data-day-index]").forEach(input=>input.addEventListener("change",()=>{
    const dayIndex=input.dataset.dayIndex;
    document.querySelectorAll(`input[data-line-day="${dayIndex}"]`).forEach(line=>{line.checked=input.checked;});
    input.indeterminate=false; refreshSyncBadges(); updateButtonState();
  }));
  listEl.querySelectorAll("input[data-line-day]").forEach(input=>input.addEventListener("change",()=>{
    syncDayCheckbox(input.dataset.lineDay); refreshSyncBadges(); updateButtonState();
  }));
  updateEventDates(); refreshSyncBadges(); updateButtonState();
}

function toGoogleLocalIso(iso,time) {
  const [y,m,d]=iso.split("-").map(Number), [hh,mm]=time.split(":").map(Number);
  const dt=new Date(y,m-1,d,hh,mm,0,0);
  const pad=n=>String(Math.abs(n)).padStart(2,"0");
  const off=-dt.getTimezoneOffset();
  const sign=off>=0?"+":"-";
  const oh=Math.floor(Math.abs(off)/60), om=Math.abs(off)%60;
  return `${iso}T${pad(hh)}:${pad(mm)}:00${sign}${pad(oh)}:${pad(om)}`;
}
function rfc3339Boundary(iso, endOfDay=false) {
  const [y,m,d]=iso.split("-").map(Number);
  const dt=new Date(y,m-1,d,endOfDay?23:0,endOfDay?59:0,endOfDay?59:0,0);
  return dt.toISOString();
}

function escapeIcs(value="") { return String(value).replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;"); }
function icsLocalDateTime(iso,time) { const [h,m]=time.split(":"); return `${iso.replaceAll("-","")}T${h}${m}00`; }
function buildIcs(groups) {
  const {dayOffset,startTime,endTime}=settings();
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Devoirly//FR","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
  groups.forEach(group=>{
    const eventIso=addDays(group.item.date.iso,dayOffset);
    lines.push("BEGIN:VEVENT",`UID:devoirly-${stableKey(group.item)}@local`,`DTSTART;TZID=${tz}:${icsLocalDateTime(eventIso,startTime)}`,`DTEND;TZID=${tz}:${icsLocalDateTime(eventIso,endTime)}`,`SUMMARY:${escapeIcs(`📚 Devoirs – pour ${formatDate(group.item.date.iso)}`)}`,`DESCRIPTION:${escapeIcs(group.homework.map(h=>`• ${h}`).join("\n"))}`,"END:VEVENT");
  });
  lines.push("END:VCALENDAR"); return lines.join("\r\n");
}

async function getGoogleToken(interactive=false) {
  const result=await chrome.identity.getAuthToken({interactive, enableGranularPermissions:true});
  const token=typeof result==="string" ? result : result?.token;
  if (!token) throw new Error("Connexion Google annulée ou impossible.");
  return token;
}
async function googleFetch(path,options={},interactive=false) {
  let token=await getGoogleToken(interactive);
  const doCall=()=>fetch(`https://www.googleapis.com/calendar/v3${path}`,{...options,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",...(options.headers||{})}});
  let response=await doCall();
  if (response.status===401) {
    await chrome.identity.removeCachedAuthToken({token});
    token=await getGoogleToken(true);
    response=await doCall();
  }
  if (!response.ok) throw new Error(`Google Calendar : ${response.status} ${await response.text()}`);
  return response.status===204 ? null : response.json();
}


async function loadCalendars(interactive=false) {
  const data=await googleFetch("/users/me/calendarList?minAccessRole=writer&showHidden=false",{},interactive);
  const calendars=(data.items||[]).filter(c=>!c.deleted && !c.hidden);
  calendarSelect.innerHTML=calendars.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.summary||c.id)}${c.primary?" (principal)":""}</option>`).join("");
  const stored=await chrome.storage.local.get("devoirlyCalendarId");
  if (stored.devoirlyCalendarId && calendars.some(c=>c.id===stored.devoirlyCalendarId)) calendarSelect.value=stored.devoirlyCalendarId;
  calendarSelect.disabled=calendars.length===0;
  isGoogleConnected=true;
  calendarArea.classList.remove("hidden"); connectGoogleButton.classList.add("hidden"); disconnectGoogleButton.classList.remove("hidden");
  googleStatus.textContent="Compte Google connecté.";
  updateButtonState();
  await refreshExistingEvents();
}

async function trySilentGoogle() {
  try { await getGoogleToken(false); await loadCalendars(false); }
  catch { setDisconnectedUi(); }
}
function setDisconnectedUi() {
  isGoogleConnected=false; existingByKey=new Map(); calendarArea.classList.add("hidden"); connectGoogleButton.classList.remove("hidden"); disconnectGoogleButton.classList.add("hidden"); googleStatus.textContent="Non connecté."; calendarSelect.disabled=true; refreshSyncBadges(); updateButtonState();
}

async function fetchExistingEvents() {
  if (!items.length || !calendarSelect.value) return new Map();
  const {dayOffset}=settings();
  const eventDates=items.map(i=>addDays(i.date.iso,dayOffset)).sort();
  const minIso=addDays(eventDates[0],-3), maxIso=addDays(eventDates[eventDates.length-1],3);
  const params=new URLSearchParams({
    singleEvents:"true", maxResults:"2500", showDeleted:"false",
    timeMin:rfc3339Boundary(minIso), timeMax:rfc3339Boundary(maxIso,true),
    sharedExtendedProperty:"devoirlyApp=devoirly"
  });
  const data=await googleFetch(`/calendars/${encodeURIComponent(calendarSelect.value)}/events?${params.toString()}`,{},false);
  const map=new Map();
  for (const event of (data.items||[])) {
    const key=event?.extendedProperties?.shared?.devoirlyKey;
    if (!key) continue;
    if (!map.has(key)) map.set(key,[]);
    map.get(key).push(event);
  }
  return map;
}
async function refreshExistingEvents() {
  if (!isGoogleConnected || !calendarSelect.value) return;
  try { existingByKey=await fetchExistingEvents(); refreshSyncBadges(); }
  catch (e) { showSyncInfo(`Impossible de vérifier la synchronisation : ${e.message}`,true); }
}

function eventBody(group) {
  const {dayOffset,startTime,endTime}=settings();
  const eventIso=addDays(group.item.date.iso,dayOffset);
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
  const fp=fingerprint(group.item,group.homework);
  return {
    summary:`📚 Devoirs – pour ${formatDate(group.item.date.iso)}`,
    description:group.homework.map(h=>`• ${h}`).join("\n"),
    start:{dateTime:toGoogleLocalIso(eventIso,startTime),timeZone:tz},
    end:{dateTime:toGoogleLocalIso(eventIso,endTime),timeZone:tz},
    extendedProperties:{shared:{devoirlyApp:"devoirly",devoirlyKey:stableKey(group.item),devoirlyFingerprint:fp,devoirlyTargetDate:group.item.date.iso}}
  };
}

function showSyncInfo(message,isError=false) {
  syncInfo.textContent=message; syncInfo.className=`sync-info${isError?" error":""}`; syncInfo.classList.remove("hidden");
}

async function syncGoogle() {
  if (!timesAreValid()) return;
  const calendarId=calendarSelect.value;
  if (!calendarId) return;
  syncGoogleButton.disabled=true;
  showSyncInfo("Vérification du calendrier…");
  existingByKey=await fetchExistingEvents();
  let created=0,updated=0,removed=0,unchanged=0,duplicates=0;

  for (let index=0; index<items.length; index++) {
    const item=items[index], homework=selectedLinesForIndex(index), key=stableKey(item);
    const existing=existingByKey.get(key)||[];
    if (!homework.length) {
      for (const ev of existing) {
        await googleFetch(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(ev.id)}`,{method:"DELETE"},true);
        removed++;
      }
      continue;
    }

    const group={item,homework,index}, body=eventBody(group), expected=body.extendedProperties.shared.devoirlyFingerprint;
    if (!existing.length) {
      await googleFetch(`/calendars/${encodeURIComponent(calendarId)}/events`,{method:"POST",body:JSON.stringify(body)},true);
      created++;
    } else {
      const primary=existing[0];
      const same=primary?.extendedProperties?.shared?.devoirlyFingerprint===expected;
      if (same) unchanged++;
      else {
        await googleFetch(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(primary.id)}`,{method:"PATCH",body:JSON.stringify(body)},true);
        updated++;
      }
      for (const duplicate of existing.slice(1)) {
        await googleFetch(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(duplicate.id)}`,{method:"DELETE"},true);
        duplicates++;
      }
    }
    showSyncInfo(`Synchronisation ${index+1}/${items.length}…`);
  }

  existingByKey=await fetchExistingEvents();
  refreshSyncBadges(); updateButtonState();
  const parts=[];
  if (created) parts.push(`${created} créé${created>1?"s":""}`);
  if (updated) parts.push(`${updated} mis à jour`);
  if (removed) parts.push(`${removed} supprimé${removed>1?"s":""}`);
  if (duplicates) parts.push(`${duplicates} doublon${duplicates>1?"s":""} supprimé${duplicates>1?"s":""}`);
  if (unchanged) parts.push(`${unchanged} déjà à jour`);
  showSyncInfo(parts.length ? `Synchronisation terminée : ${parts.join(" · ")}.` : "Rien à synchroniser.");
}

async function load() {
  const stored=await chrome.storage.local.get("agendaSettings");
  const s=stored.agendaSettings||{};
  dayOffsetEl.value=String(s.dayOffset??-1); startTimeEl.value=s.startTime||"18:00"; endTimeEl.value=s.endTime||"19:00";

  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if (!tab?.id || !tab.url?.includes("educartable.com")) throw new Error("Ouvre d’abord la page Devoirs d’Educartable, puis clique sur Devoirly.");
  const response=await chrome.tabs.sendMessage(tab.id,{type:"GET_HOMEWORK"});
  if (!response?.success) throw new Error(response?.error||"Impossible de lire les devoirs.");
  items=response.homework||[];
  if (!items.length) throw new Error("Aucun devoir détecté. Vérifie que les cartes de devoirs sont visibles dans Educartable.");
  render();
  await trySilentGoogle();
}

[dayOffsetEl,startTimeEl,endTimeEl].forEach(el=>el.addEventListener("change",saveSettings));
selectAllButton.addEventListener("click",()=>{
  const lines=[...document.querySelectorAll("input[data-line-day]")];
  const shouldCheck=lines.some(c=>!c.checked); lines.forEach(c=>{c.checked=shouldCheck;}); items.forEach((_i,index)=>syncDayCheckbox(index)); refreshSyncBadges(); updateButtonState();
});
connectGoogleButton.addEventListener("click",()=>loadCalendars(true).catch(e=>showSyncInfo(e.message,true)));
disconnectGoogleButton.addEventListener("click",async()=>{ await chrome.identity.clearAllCachedAuthTokens(); setDisconnectedUi(); showSyncInfo("Compte Google déconnecté de Devoirly."); });
calendarSelect.addEventListener("change",async()=>{ await chrome.storage.local.set({devoirlyCalendarId:calendarSelect.value}); await refreshExistingEvents(); updateButtonState(); });
syncGoogleButton.addEventListener("click",()=>syncGoogle().catch(e=>{showSyncInfo(e.message,true); updateButtonState();}));
exportIcsButton.addEventListener("click",()=>{
  const groups=getSelectedGroups(); if (!groups.length || !timesAreValid()) return;
  const blob=new Blob([buildIcs(groups)],{type:"text/calendar;charset=utf-8"}), url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download=`devoirly-${new Date().toISOString().slice(0,10)}.ics`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
});

load().catch(error=>{ statusEl.textContent=error.message||String(error); statusEl.classList.add("error"); });
