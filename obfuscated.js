/* ================= CONFIG & GLOBALS ================= */
    const CONFIG = {
        BETA_TOOL_URL: "https://github.com/nothingcommunity/Testing/raw/refs/heads/main/Apps/Beta%20Updates%20Hub.apk",
        SOFTWARE: {}, SERVICE_DB: {}, WALLPAPERS: []
    };
    const DB_URL = "https://nothingcommunity-7664f-default-rtdb.firebaseio.com/chat.json";
    const SETUP_DB_URL = "https://nothingcommunity-7664f-default-rtdb.firebaseio.com/setups.json";
    const ADMIN_UUID = "uid_mkkuzv0gqnf16fsd3fe";
    
    let SERVICE_DB = {}; 
    let currentPlaylist = [], currentIndex = 0, lastPlayedArt = "";
    let imgStore = { ssHome: null, ssLock: null, wallHome: null, wallLock: null };
    let currentReply = null; 

    // ================= INITIALIZATION =================
    window.addEventListener('load', () => {
        applyAutoTheme();
        createStars(); 
        createMoon();
        checkVerifyStatus(); 
        setTimeout(() => { initSoftwareData(); initServiceData(); loadMessages(); }, 100);
    });

    /* ================= THEME & UI ================= */
    function applyAutoTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        updateThemeIcon(prefersDark ? 'dark' : 'light');
    }
    function toggleTheme() {
        const root = document.documentElement;
        const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
    }
    function updateThemeIcon(theme) { document.getElementById('t-icon').className = theme === 'dark' ? "fa-solid fa-circle" : "fa-solid fa-sun"; }

    function createStars() {
        requestAnimationFrame(() => {
            const field = document.getElementById('starField'); field.innerHTML = ''; const fragment = document.createDocumentFragment();
            const count = window.innerWidth < 768 ? 80 : 250; 
            for(let i=0; i < count; i++) {
                const s = document.createElement('div'); s.className = 'star';
                const size = Math.random() * 3;
                s.style.cssText = `width:${size}px; height:${size}px; top:${Math.random()*100}%; left:${Math.random()*100}%; animation: blink ${2+Math.random()*3}s infinite; opacity:${Math.random()}`;
                fragment.appendChild(s);
            }
            field.appendChild(fragment);
        });
    }
    function createMoon() { if(!document.querySelector('.moon')) { const moon = document.createElement('div'); moon.className = 'moon'; document.body.appendChild(moon); } }

    function attachScrollAnimation() {
        const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('hidden-state'); entry.target.classList.add('scroll-active'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 });
        document.querySelectorAll('.wp-card').forEach(card => { card.classList.add('hidden-state'); observer.observe(card); });
    }

    /* ================= NAVIGATION ================= */
    function openScreen(id) {
        const s = document.getElementById(id); if (!s) return;
        s.style.display = 'flex'; setTimeout(() => { s.classList.add('active'); }, 10);
        if(id === 'wpScr') initWallpaperData();
        if(id === 'presetScr') initPresetData();
        if(id === 'setupScr') loadSetups();
    }

    function closeScreen(id) {
        const s = document.getElementById(id); if (!s) return;
        s.classList.remove('active'); 
        setTimeout(() => { s.style.display = 'none'; if(id === 'wpScr') { const aiSec = document.getElementById('aiSection'); if(aiSec) aiSec.style.display = 'none'; } }, 400);
    }
    function toggleAI() { const section = document.getElementById('aiSection'); section.style.display = (section.style.display === 'none') ? 'block' : 'none'; }
    function toggleUpload() { const f = document.getElementById('setupUploadForm'); f.style.display = (f.style.display === 'none') ? 'block' : 'none'; }

    /* ================= CUSTOM SELECTOR LOGIC ================= */
    function openDeviceMenu() {
        const devices = [
            { name: "Nothing PHONE (1)", val: "p1" }, { name: "Nothing PHONE (2)", val: "p2" }, { name: "Nothing PHONE (2A)", val: "p2a" },
            { name: "Nothing PHONE (2A) PLUS", val: "p2aplus" }, { name: "Nothing PHONE (3)", val: "p3" }, { name: "Nothing PHONE (3A)", val: "p3a" },
            { name: "Nothing PHONE (3A) PRO", val: "p3apro" }, { name: "Nothing PHONE (3A) LITE", val: "p3alite" }, { name: "CMF PHONE 1", val: "cmf1" }, { name: "CMF PHONE 2 PRO", val: "cmf2pro" }
        ];
        openUniversalSelector("CHOOSE DEVICE", devices, (selected) => {
            document.getElementById('swSelect').value = selected.val;
            document.getElementById('deviceTriggerText').innerText = selected.name;
            showLogs(); 
        });
    }

    function openStateMenu() {
        const states = ["ANDHRA PRADESH", "ASSAM", "BIHAR", "CHANDIGARH", "CHHATTISGARH", "DELHI", "GOA", "GUJARAT", "HARYANA", "HIMACHAL PRADESH", "JAMMU & KASHMIR", "JHARKHAND", "KARNATAKA", "KERALA", "MADHYA PRADESH", "MAHARASHTRA", "MEGHALAYA", "NAGALAND", "ODISHA", "PUDUCHERRY", "PUNJAB", "RAJASTHAN", "TAMIL NADU", "TELANGANA", "TRIPURA", "UTTAR PRADESH", "UTTARAKHAND", "WEST BENGAL"].map(s => ({ name: s, val: s }));
        openUniversalSelector("SELECT STATE", states, (selected) => {
            document.getElementById('state').value = selected.val;
            document.getElementById('stateTriggerText').innerText = selected.name;
            document.getElementById('city').value = ""; document.getElementById('cityTriggerText').innerText = "SELECT CITY"; document.getElementById('scInfo').innerHTML = "";
            loadCitiesCustom(); 
        });
    }

    function openCityMenu() {
        const s = document.getElementById('state').value; if(!s || !SERVICE_DB[s]) return;
        const rawCities = [...new Set(Object.keys(SERVICE_DB[s]).map(c => c.split('_')[0]))].sort();
        const cityList = rawCities.map(c => ({ name: c, val: c }));
        openUniversalSelector("SELECT CITY", cityList, (selected) => {
            document.getElementById('city').value = selected.val;
            document.getElementById('cityTriggerText').innerText = selected.name;
            showDetails(); 
        });
    }
    function loadCitiesCustom() { const s = document.getElementById('state').value; document.getElementById('cityGroup').style.display = (!s || !SERVICE_DB[s]) ? 'none' : 'block'; }

    function openUniversalSelector(title, items, callback) {
        const titleEl = document.getElementById('selectorTitle'); const listEl = document.getElementById('selectorList');
        titleEl.innerText = title; listEl.innerHTML = "";
        items.forEach(item => {
            const div = document.createElement('div'); div.className = "selector-item";
            div.innerHTML = `<span>${item.name}</span> <i class="fa-solid fa-arrow-right" style="font-size:0.8rem; opacity:0.5;"></i>`;
            div.onclick = () => { if(navigator.vibrate) navigator.vibrate(30); callback(item); closeScreen('selectorScr'); };
            listEl.appendChild(div);
        });
        openScreen('selectorScr');
    }
/* ================= HARDWARE LOGIC ================= */
let HW_DATA = [];
let currentImgs = [];
let currentModel = "";
let hwTimer = null;
let is3d = false;

function vibrate(ms = 15) { if(navigator.vibrate) navigator.vibrate(ms); }

async function initHardware() {
    const grid = document.getElementById('hwGrid');
    if(HW_DATA.length > 0) return;
    
    grid.innerHTML = "<p style='padding:20px; opacity:0.5; text-align:center;'>CONNECTING...</p>";
    
    try {
        const res = await fetch("https://raw.githubusercontent.com/nothingtools/nothingtools.github.io/main/products/all.json?t=" + Date.now());
        HW_DATA = await res.json();
        renderHW('all');
    } catch(e) { 
        grid.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>LOAD FAILED</p>"; 
    }
}

function renderHW(cat) {
    const grid = document.getElementById('hwGrid');
    grid.innerHTML = "";
    const filtered = HW_DATA.filter(p => cat === 'all' || p.category === cat);
    
    if(filtered.length === 0) { grid.innerHTML = "<p style='padding:20px; opacity:0.5; text-align:center; grid-column:span 2;'>EMPTY</p>"; return; }

    filtered.forEach(p => {
        const div = document.createElement('div');
        div.className = 'hw-card';
        const img = p.variants && p.variants[0] ? p.variants[0].imgs[0] : (p.imgs ? p.imgs[0] : "");
        div.innerHTML = `<img src="${img}"><h3>${p.name}</h3>`;
        div.onclick = () => { vibrate(20); openProduct(p); };
        grid.appendChild(div);
    });
}

function filterHW(cat, el) {
    vibrate(10);
    document.querySelectorAll('.hw-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    renderHW(cat);
}

function openProduct(p) {
    document.getElementById('dTitle').innerText = p.name;
    
    // Color Picker
    const cBox = document.getElementById('colorPicker');
    cBox.innerHTML = "";
    
    if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v, idx) => {
            const dot = document.createElement('div');
            dot.className = `color-dot ${idx === 0 ? 'active' : ''}`;
            dot.style.background = v.colorCode;
            dot.onclick = () => {
                vibrate(10);
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                loadVariant(v);
            };
            cBox.appendChild(dot);
        });
        loadVariant(p.variants[0]);
    } else {
        // Fallback for non-variant products
        loadVariant({imgs: p.imgs, model3d: p.model3d});
    }

    // Specs
    const sBox = document.getElementById('dSpecs');
    sBox.innerHTML = "";
    if(p.specs) {
        Object.entries(p.specs).forEach(([k, v]) => {
            sBox.innerHTML += `<div class="row"><span>${k}</span><span>${v}</span></div>`;
        });
    }

    // Link
    const btn = document.getElementById('buyLink');
    btn.href = p.link || "#";

    openScreen('hwDetailScr');
}

function loadVariant(v) {
    currentImgs = v.imgs || [];
    currentModel = v.model3d || "";
    
    const track = document.getElementById('sliderTrack');
    track.innerHTML = currentImgs.map(src => `<div class="slide"><img src="${src}"></div>`).join('');
    track.scrollLeft = 0;
    
    document.getElementById('imgBadge').innerText = `1/${currentImgs.length}`;
    
    const showArrows = currentImgs.length > 1 ? 'flex' : 'none';
    document.getElementById('btnPrev').style.display = showArrows;
    document.getElementById('btnNext').style.display = showArrows;
}

function slide(dir) {
    vibrate(15);
    const track = document.getElementById('sliderTrack');
    track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
}

document.getElementById('sliderTrack').addEventListener('scroll', (e) => {
    const track = e.target;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    document.getElementById('imgBadge').innerText = `${idx + 1}/${currentImgs.length}`;
});

/* --- 3D HOLD LOGIC --- */
const box = document.getElementById('vBox');
let touchStartX = 0;

box.addEventListener('touchstart', (e) => {
    if(is3d) return;
    touchStartX = e.touches[0].clientX;
    holdStart();
}, {passive: true});

box.addEventListener('touchmove', (e) => {
    if(is3d) return;
    if(Math.abs(e.touches[0].clientX - touchStartX) > 10) holdCancel();
}, {passive: true});

box.addEventListener('touchend', holdCancel);
box.addEventListener('mousedown', holdStart);
box.addEventListener('mouseup', holdCancel);
box.addEventListener('mouseleave', holdCancel);

function holdStart() {
    if(is3d || !currentModel) return;
    document.getElementById('vBox').classList.add('loading');
    hwTimer = setTimeout(() => {
        vibrate(60); 
        const mv = document.getElementById('mv');
        mv.src = currentModel;
        document.getElementById('l3d').style.display = 'block';
        is3d = true;
    }, 600);
}

function holdCancel() {
    if(hwTimer) clearTimeout(hwTimer);
    document.getElementById('vBox').classList.remove('loading');
}

function exit3d() {
    vibrate(10);
    is3d = false;
    document.getElementById('l3d').style.display = 'none';
}

function openScreen(id) {
    if(id === 'hwScr') initHardware();
    document.getElementById(id).classList.add('active');
}
function closeScreen(id) {
    document.getElementById(id).classList.remove('active');
    if(id === 'hwDetailScr') exit3d();
}

    /* ================= DOWNLOAD LOGIC ================= */
    async function runDownload(btn, input) {
        const bar = btn.querySelector('.progress-bar'); const txt = btn.querySelector('.btn-text'); const oldTxt = txt.innerText; let finalUrl = "";
        if (input === 'BETA_TOOL') finalUrl = CONFIG.BETA_TOOL_URL;
        else if (input === 'OTA_ZIP') { const device = document.getElementById('swSelect').value; if(!device) { alert("PLEASE SELECT A DEVICE!"); return; } finalUrl = CONFIG.SOFTWARE[device]?.url; } 
        else finalUrl = input;
        if (!finalUrl || finalUrl === "#") { alert("LINK NOT FOUND!"); return; }
        btn.style.pointerEvents = 'none'; txt.innerText = 'PROCESSING...'; bar.style.transition = 'width 1.5s linear'; bar.style.width = '100%';
        const isZip = finalUrl.toLowerCase().endsWith('.zip') || finalUrl.toLowerCase().endsWith('.apk');
        if (isZip) {
            setTimeout(() => { const link = document.createElement('a'); link.href = finalUrl; link.target = "_blank"; document.body.appendChild(link); link.click(); document.body.removeChild(link); finishDownload(btn, txt, bar, oldTxt); }, 1000);
        } else {
            try {
                const response = await fetch(finalUrl); const blob = await response.blob(); const blobUrl = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = blobUrl; link.download = "NothingSpace_" + Date.now() + ".png"; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl); finishDownload(btn, txt, bar, oldTxt);
            } catch (err) { window.open(finalUrl, '_blank'); finishDownload(btn, txt, bar, oldTxt); }
        }
    }
    function finishDownload(btn, txt, bar, oldTxt) { txt.innerText = "DONE ✓"; setTimeout(() => { bar.style.transition = 'none'; bar.style.width = '0%'; txt.innerText = oldTxt; btn.style.pointerEvents = 'all'; }, 1000); }

    /* ================= SOFTWARE & SERVICE DATA ================= */
    async function initSoftwareData() { try { const response = await fetch("https://nothingsoftware-3cc7c-default-rtdb.firebaseio.com/software_data.json"); const data = await response.json(); if (data) CONFIG.SOFTWARE = data; } catch (err) { console.error("SW Error:", err); } }
    function showLogs() {
        const m = document.getElementById('swSelect').value; const box = document.getElementById('logBox'), disp = document.getElementById('swDisplay');
        if(!m || !CONFIG.SOFTWARE[m]) { box.style.display = 'none'; disp.style.display = 'none'; return; }
        const data = CONFIG.SOFTWARE[m]; document.getElementById('swPhoneImg').src = data.img; document.getElementById('swPhoneTitle').innerText = data.disp;
        disp.style.display = 'flex'; document.getElementById('swList').innerHTML = (data.logs && Array.isArray(data.logs)) ? data.logs.map(l => `<li>${l}</li>`).join('') : "<li>Details not available</li>"; box.style.display = 'block';
    }
    function toggleAccordion() { document.getElementById('accContent').classList.toggle('open'); }
    async function initServiceData() { try { const response = await fetch("https://raw.githubusercontent.com/nothingcommunity/Testing/main/Service%20Centre/service_centre.json"); SERVICE_DB = await response.json(); } catch (err) { console.error("Service Data Error"); } }
    function showDetails() {
        const s = document.getElementById('state').value, c = document.getElementById('city').value, scInfo = document.getElementById('scInfo');
        if(!c || !SERVICE_DB[s]) return; scInfo.innerHTML = ''; 
        Object.keys(SERVICE_DB[s]).filter(key => key === c || key.startsWith(c + "_")).forEach(key => {
            const d = SERVICE_DB[s][key]; 
            scInfo.innerHTML += `<div class="detail-card"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><h3 style="font-size:1.4rem;">${d.n}</h3><span class="sc-badge">ID: ${d.c}</span></div><p style="text-transform:none;opacity:0.7;font-size:1rem;margin-bottom:15px;"><span style="font-size:1.2rem;">${d.a}</p><div style="font-size:0.9rem;margin-bottom:15px;"><p>🕒 TIME: ${d.t}</p><p>🚫 OFF : ${d.o}</p></div><div class="card-row"><button class="btn" style="flex:1;padding:12px;" onclick="window.open('tel:${d.p}')">CALL</button><button class="btn" style="flex:1;padding:12px;" onclick="window.open('${d.m}')">MAPS</button></div></div>`;
        });
    }
    let sw_timer; function startSoftwareLogic() { sw_timer = setTimeout(() => { if(navigator.vibrate) navigator.vibrate(50); openSoftwareMenu(); }, 500); }
    function cancelSoftwareLogic() { clearTimeout(sw_timer); }
    async function openSoftwareMenu() {
        // ADMIN CHECK FOR SOFTWARE TRIGGER
        if(userUUID !== ADMIN_UUID) return; 

        const id = document.getElementById('swSelect').value; const pass = prompt("🔐 SOFTWARE ADMIN PASSWORD:");
        if(stringToHash(pass) === "1540218401") {
            if(!id) { if(confirm("🆕 ADD NEW DEVICE?")) { const newId = prompt("Unique ID:"); if(!newId) return; const payload = { disp: prompt("Name:"), img: prompt("Img URL:"), url: prompt("Zip Link:"), logs: [prompt("Note:")] }; await fetch(`https://nothingsoftware-3cc7c-default-rtdb.firebaseio.com/software_data/${newId}.json`, {method:'PUT', body:JSON.stringify(payload)}); alert("ADDED!"); initSoftwareData(); } return; }
            const cur = CONFIG.SOFTWARE[id]; const choice = prompt(`EDIT ${cur.disp}:\n1.LINK\n2.NAME\n3.IMG\n4.NOTE`); let load = {};
            if(choice==="1") load={url:prompt("URL:", "")}; if(choice==="2") load={disp:prompt("NAME:", "")}; if(choice==="3") load={img:prompt("IMG:", "")};
            if(choice==="4") { const raw = prompt("NOTE (| for new line):", ""); if(raw) load={logs: raw.split('|').map(s=>s.trim())}; }
            if(Object.keys(load).length) { await fetch(`https://nothingsoftware-3cc7c-default-rtdb.firebaseio.com/software_data/${id}.json`, {method:'PATCH', body:JSON.stringify(load)}); alert("SAVED!"); initSoftwareData(); showLogs(); }
        } else { if(pass) alert("WRONG PASSWORD"); }
    }

    /* ================= MUSIC MODULE ================= */
    async function searchMusic() {
        const query = document.getElementById('mQuery').value; const btn = document.getElementById('mSearchBtn'); const card = document.getElementById('music-card');
        if (!query) return; const originalBtn = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        try {
            const _0x1 = "aHR0cHM6Ly9pdHVuZXMuYXBwbGUuY29tL3NlYXJjaD9saW1pdD0yNTAmZW50aXR5PXNvbmcmdGVybT0="; 
            const res = await fetch(`${atob(_0x1)}${encodeURIComponent(query)}`); 
            const data = await res.json();
            if (data.results.length > 0) { 
                currentPlaylist = data.results.map(song => ({ 
                    url: song.previewUrl, 
                    art: song.artworkUrl100.replace('100x100', '400x400'), 
                    title: song.trackName.replace(/mzaf_\d+/g, "Nothing TRACK").toUpperCase(), 
                    artist: song.artistName
                })); 
                currentIndex = 0; card.style.display = "block"; loadSong(0); 
            } else alert("Nothing FOUND");
        } catch (e) { console.error(e); } finally { btn.innerHTML = originalBtn; }
    }

    function loadSong(index) {
        if (!currentPlaylist[index]) return; const song = currentPlaylist[index]; const player = document.getElementById('mPlayer');
        document.getElementById('mArt').src = song.art; document.getElementById('mTitle').innerText = song.title; document.getElementById('mArtist').innerText = song.artist; lastPlayedArt = song.art; if(document.getElementById('mini-art')) document.getElementById('mini-art').src = lastPlayedArt; 
        player.src = song.url; player.load(); togglePlay(true);
        if ('mediaSession' in navigator) { navigator.mediaSession.metadata = new MediaMetadata({ title: song.title, artist: song.artist, album: "Nothing Space", artwork: [{ src: song.art, sizes: '512x512', type: 'image/jpeg' }] }); navigator.mediaSession.setActionHandler('play', function() { togglePlay(true); }); navigator.mediaSession.setActionHandler('pause', function() { togglePlay(false); }); navigator.mediaSession.setActionHandler('previoustrack', prevSong); navigator.mediaSession.setActionHandler('nexttrack', nextSong); }
    }

    function togglePlay(forcePlay = false) {
        const player = document.getElementById('mPlayer'); const icon = document.querySelector('#play-pause i'); const art = document.getElementById('mArt');
        if (player.paused || forcePlay) { player.play().catch(()=>{}); icon.className = "fa-solid fa-circle-pause"; art.classList.add('spinning'); if('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing"; } 
        else { player.pause(); icon.className = "fa-solid fa-circle-play"; art.classList.remove('spinning'); if('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused"; }
    }

    function nextSong() { if(currentPlaylist.length) { currentIndex = (currentIndex + 1) % currentPlaylist.length; loadSong(currentIndex); } }
    function prevSong() { if(currentPlaylist.length) { currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length; loadSong(currentIndex); } }
    function handleMusicClose() { closeScreen('musicScr'); if (!document.getElementById('mPlayer').paused) { document.getElementById('mini-player').style.display = 'block'; document.getElementById('mini-art').src = lastPlayedArt; document.getElementById('mini-art').classList.add('spinning'); } }
    function restorePlayer() { document.getElementById('mini-player').style.display = 'none'; openScreen('musicScr'); }

    async function downloadCurrentSong() {
        const song = currentPlaylist[currentIndex]; const btn = document.querySelector('#music-card .btn'); if(!song) return; btn.style.pointerEvents = "none"; btn.innerText = "FETCHING...";
        try { const response = await fetch(song.url); const blob = await response.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${song.title.replace(/[^a-zA-Z0-9\s]/g, '').trim()} - NothingSpace.mp3`; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url); btn.innerText = "DONE ✓"; } catch (e) { window.open(song.url, '_blank'); btn.innerText = "OPENED"; } setTimeout(() => { btn.innerText = "DOWNLOAD"; btn.style.pointerEvents = "all"; }, 2000); 
    }

/* ================= SETUP MODULE (FINAL: RANKING + DELETE FIXED) ================= */
    
    // 👇 CONFIGURATION
    const GH_USER = "nothingcommunity";
    const GH_REPO = "Testing";
    const DB_FILE = "setups.json"; 
    
    // 👇 ADMIN CONFIG (Apna Admin UUID yahan daalo agar fix hai, nahi to logic niche hai)
    // Example: const ADMIN_UUID = "tumhara_uuid_yahan"; 

    // 🔒 TOKEN SECURITY
    const P1 = "ghp_DVfuzTC01Wg0"; 
    const P2 = "X4jx2S7my7sTMRWFOe2y3Lsn";
    const GH_TOKEN = P1 + P2;

    // 1. Helper: Image Upload
    async function uploadToGitHub(base64Img, filename) {
        if (!base64Img) return null;
        const content = base64Img.split(',')[1];
        const cleanFileName = `${Date.now()}_${filename.replace(/\s/g, '_')}`;
        const apiUrl = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/Setups/${cleanFileName}`;

        try {
            const res = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Authorization': `token ${GH_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Upload Image", content: content })
            });
            if (res.ok) return `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/main/Setups/${cleanFileName}`;
        } catch (e) { console.error("Upload Error:", e); }
        return null;
    }

    // 2. Helper: Database Update (Add/Like/Delete)
    async function updateGitHubDatabase(action, payload) {
        const apiUrl = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${DB_FILE}`;
        let currentData = [];
        let sha = null; 

        try {
            const getRes = await fetch(apiUrl + `?t=${Date.now()}`, { 
                headers: { 'Authorization': `token ${GH_TOKEN}` } 
            });
            if (getRes.ok) {
                const json = await getRes.json();
                sha = json.sha;
                const decodedContent = new TextDecoder().decode(Uint8Array.from(atob(json.content), c => c.charCodeAt(0)));
                currentData = JSON.parse(decodedContent);
            }
        } catch (e) { console.error("DB Init Error"); }

        // --- ACTION LOGIC ---
        if (action === 'ADD') {
            currentData.push(payload);
        } 
        else if (action === 'LIKE') {
            const index = currentData.findIndex(x => x.id === payload.id);
            if (index !== -1) currentData[index].likes = (currentData[index].likes || 0) + 1;
        } 
        else if (action === 'DELETE') {
            // 🔥 DELETE LOGIC: Filter out the item
            currentData = currentData.filter(x => x.id !== payload.id);
        }

        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentData, null, 2))));

        await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GH_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Action: ${action}`,
                content: updatedContent,
                sha: sha
            })
        });
    }

    // 3. Main: Submit Setup
    async function submitSetup() {
        const title = document.getElementById('setupTitle').value;
        const btn = document.getElementById('submitBtn');

        if(!title || !imgStore.ssLock || !imgStore.ssHome || !imgStore.wallLock || !imgStore.wallHome) {
            alert("⚠️ Please select all 4 images!"); return;
        }

        btn.innerText = "UPLOADING..."; btn.style.pointerEvents = "none";

        try {
            const u1 = await uploadToGitHub(imgStore.ssLock, "lock_ss.jpg");
            const u2 = await uploadToGitHub(imgStore.ssHome, "home_ss.jpg");
            const u3 = await uploadToGitHub(imgStore.wallLock, "lock_wall.jpg");
            const u4 = await uploadToGitHub(imgStore.wallHome, "home_wall.jpg");

            if(!u1 || !u2 || !u3 || !u4) throw new Error("GitHub Upload Failed");

            if (!savedName || savedName === "USER") { 
                let n = prompt("ENTER YOUR NAME:"); 
                savedName = n ? n.toUpperCase() : "USER"; 
                localStorage.setItem('ns_user_fixed', savedName); 
            }
            
            const newSetup = {
                id: "id_" + Date.now(),
                title: title.toUpperCase(),
                desc: document.getElementById('setupDesc').value,
                ssLock: u1, ssHome: u2, wallLock: u3, wallHome: u4,
                likes: 0,
                uuid: userUUID, // 🔥 UUID Zaroori hai delete check ke liye
                author: savedName,
                date: Date.now()
            };

            await updateGitHubDatabase('ADD', newSetup);
            alert("Posted successfully 🎉 ,⏳ It will automatically appear on the website in a few minutes.!");
            location.reload();

        } catch(e) {
            alert("Error: " + e.message);
            btn.innerText = "POST NOW"; btn.style.pointerEvents = "all";
        }
    }

    // 4. Main: Load Setups (With Delete Button Logic)
    async function loadSetups() {
        const grid = document.getElementById('setupGrid');
        const modal = document.querySelector('#setupScr .modal');
        grid.innerHTML = "<p style='text-align:center; opacity:0.5;'>LOADING FEEDS...</p>";

        try {
            const rawUrl = `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/main/${DB_FILE}?t=${Date.now()}`;
            const res = await fetch(rawUrl);
            if(!res.ok) throw new Error();
            
            let list = await res.json();

            // Ranking Logic
            list.sort((a, b) => {
                const likesA = Math.max(a.likes || 0, parseInt(localStorage.getItem('count_' + a.id) || 0));
                const likesB = Math.max(b.likes || 0, parseInt(localStorage.getItem('count_' + b.id) || 0));
                if (likesB !== likesA) return likesB - likesA; 
                return (b.date || 0) - (a.date || 0); 
            });

            grid.innerHTML = list.map(p => {
                const isLiked = localStorage.getItem('l_' + p.id);
                let showLikes = p.likes || 0;
                const localCount = localStorage.getItem('count_' + p.id);
                if (localCount && parseInt(localCount) > showLikes) showLikes = parseInt(localCount);

                // 🔥 DELETE CHECK LOGIC 🔥
                // 1. Check if post belongs to me
                const isMine = (p.uuid === userUUID); 
                // 2. Check if I am Admin (ADMIN_UUID variable defined honi chahiye global scope me)
                const isAdmin = (typeof ADMIN_UUID !== 'undefined' && userUUID === ADMIN_UUID);
                
                const showDelete = isMine || isAdmin;

                return `
                <div class="setup-card">
                    <div class="setup-header">
                        <h3>${p.title}</h3>
                        <span style="opacity:0.5; font-size:0.8rem; border:1px solid #333; padding:2px 6px; border-radius:4px;">${p.author}</span>
                    </div>
                    <div class="phone-showcase">
                        <div class="phone-frame" onclick="selectFrame(this, '${p.wallHome}', '${p.title}_HOME')"><img src="${p.ssHome}"></div>
                        <div class="phone-frame" onclick="selectFrame(this, '${p.wallLock}', '${p.title}_LOCK')"><img src="${p.ssLock}"></div>
                    </div>
                    
                    <button class="dl-btn" onclick="forceDownload(this.dataset.url, this.dataset.name)" data-url="" data-name="">
                        DOWNLOAD WALLPAPER
                    </button>
                    
                    <p style="margin:15px 0 10px; opacity:0.8; font-size:0.9rem;">${p.desc || ''}</p>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #222; padding-top:15px;">
                        <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="doLike('${p.id}', ${showLikes}, this)">
                            <i class="fa-solid fa-heart"></i> <span>${showLikes}</span>
                        </button>
                        
                        ${showDelete ? `
                            <div onclick="deleteSetup('${p.id}', '${p.uuid}')" style="cursor:pointer; padding:8px; background:rgba(255,0,0,0.1); border-radius:8px;">
                                <i class="fa-solid fa-trash" style="color:#ff4444;"></i>
                            </div>` 
                        : ''}
                    </div>
                </div>`;
            }).join('');

            setTimeout(() => { if(typeof attachFocusScroll === "function") attachFocusScroll(modal); }, 200);

        } catch(e) { grid.innerHTML = "<p style='text-align:center; opacity:0.5;'>NO SETUPS FOUND</p>"; }
    }

    // 5. 🔥 DELETE FUNCTION (The Missing Logic)
    async function deleteSetup(id, postUUID) {
        const isMine = postUUID === userUUID;
        const isAdmin = (typeof ADMIN_UUID !== 'undefined' && userUUID === ADMIN_UUID);

        if (isAdmin) {
             const pass = prompt("ADMIN PASSWORD:");
             // Simple password check (Apna password yahan set kar lena)
             if (pass === "465630") { 
                await performDelete(id);
             } else {
                alert("WRONG PASSWORD");
             }
        } else if (isMine) {
            if(confirm("DELETE YOUR SETUP?")) {
                await performDelete(id);
            }
        }
    }

    async function performDelete(id) {
        // UI se turant hata do (Visual Feedback)
        document.getElementById('setupGrid').innerHTML = "<p style='text-align:center'>DELETING...</p>";
        
        try {
            await updateGitHubDatabase('DELETE', { id: id });
            alert("Deleted successfully 😢 ,⏳ It will automatically disappear on the website in a few minutes!");
          loadSetups(); // Refresh list
        } catch(e) {
            alert("Delete Failed: " + e.message);
            loadSetups();
        }
    }

    // 6. Image Preview Logic
    function handleImg(input, prevId, isScreen) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image(); img.src = e.target.result;
                img.onload = function() {
                    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
                    const maxWidth = isScreen ? 400 : 1080; const scale = maxWidth / img.width;
                    canvas.width = maxWidth; canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const res = canvas.toDataURL('image/jpeg', 0.7);
                    if(prevId === 'prevSsLock') imgStore.ssLock = res;
                    if(prevId === 'prevSsHome') imgStore.ssHome = res;
                    if(prevId === 'prevWallLock') imgStore.wallLock = res;
                    if(prevId === 'prevWallHome') imgStore.wallHome = res;
                    document.getElementById(prevId).innerHTML = `<img src="${res}" style="width:100%; height:100%; object-fit:contain;">`;
                }
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    // 7. Toggle Frame
    function selectFrame(frame, wallUrl, name) {
        const isAlreadyActive = frame.classList.contains('active');
        document.querySelectorAll('.phone-frame').forEach(f => f.classList.remove('active'));
        document.querySelectorAll('.dl-btn').forEach(b => b.style.display = 'none');
        if (!isAlreadyActive) {
            frame.classList.add('active');
            const card = frame.closest('.setup-card');
            const btn = card.querySelector('.dl-btn');
            if(btn) {
                btn.style.display = 'block';
                btn.dataset.url = wallUrl;
                btn.dataset.name = name + ".jpg";
            }
        }
    }

    // 8. Force Download
    async function forceDownload(url, filename) {
        if(!url) return;
        const btn = event.target;
        const oldText = btn.innerText;
        btn.innerText = "DOWNLOADING...";
        btn.style.pointerEvents = "none";
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            btn.innerText = "SAVED ✓";
        } catch (e) { window.open(url, '_blank'); btn.innerText = "OPENED"; }
        setTimeout(() => { btn.innerText = oldText; btn.style.pointerEvents = "all"; }, 2000);
    }

    // 9. Like Function
    async function doLike(id, currentLikes, btn) {
        if(localStorage.getItem('l_' + id)) return; 
        const newCount = parseInt(currentLikes) + 1;
        localStorage.setItem('l_' + id, '1');
        localStorage.setItem('count_' + id, newCount); 
        btn.classList.add('liked');
        btn.querySelector('span').innerText = newCount;
        updateGitHubDatabase('LIKE', { id: id }).catch(e => console.error("Sync Error"));
    }
    
    // 10. 3D Animation
    function attachFocusScroll(modal) {
        if(!modal) return;
        const handleScroll = () => {
            const cards = document.querySelectorAll('.setup-card');
            const modalCenter = modal.getBoundingClientRect().top + (modal.clientHeight / 2);
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.top + (rect.height / 2);
                const dist = Math.abs(modalCenter - cardCenter);
                if (dist < 200) card.classList.add('in-focus');
                else card.classList.remove('in-focus');
            });
        };
        modal.removeEventListener('scroll', handleScroll); 
        modal.addEventListener('scroll', handleScroll);
        handleScroll();
    }
/* ================= COMMUNITY PROJECTS ENGINE (FINAL TOTAL CODE) ================= */

// 1. 👇 CONFIGURATION
const PRJ_GH_U = "nothingcommunity";
const PRJ_GH_R = "Testing";
const PRJ_GH_DB = "projects.json";

// 🔒 TOKEN SECURITY
const PRJ_T1 = "ghp_DVfuzTC01Wg0"; 
const PRJ_T2 = "X4jx2S7my7sTMRWFOe2y3Lsn";
const PRJ_TOKEN = PRJ_T1 + PRJ_T2;

// 🌍 STATE
let prjStore = { avatar: null, img1: null, img2: null, img3: null };

// --- 🛠️ HELPERS: DATABASE & UPLOAD ---

async function getPrjDB() {
    const url = `https://api.github.com/repos/${PRJ_GH_U}/${PRJ_GH_R}/contents/${PRJ_GH_DB}`;
    try {
        const res = await fetch(url + `?t=${Date.now()}`, { headers: { 'Authorization': `token ${PRJ_TOKEN}` } });
        if (res.ok) {
            const json = await res.json();
            const content = decodeURIComponent(escape(atob(json.content)));
            return { sha: json.sha, data: JSON.parse(content) };
        }
    } catch(e) { console.error("DB Error", e); }
    return { sha: null, data: [] };
}

async function savePrjDB(data, sha, msg) {
    const url = `https://api.github.com/repos/${PRJ_GH_U}/${PRJ_GH_R}/contents/${PRJ_GH_DB}`;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    await fetch(url, {
        method: 'PUT', headers: { 'Authorization': `token ${PRJ_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, content: content, sha: sha })
    });
}

async function uploadPrjImg(base64, namePrefix) {
    if(!base64) return null;
    const content = base64.split(',')[1];
    const filename = `PRJ_${Date.now()}_${namePrefix}.jpg`;
    const url = `https://api.github.com/repos/${PRJ_GH_U}/${PRJ_GH_R}/contents/Projects/${filename}`;
    try {
        const res = await fetch(url, {
            method: 'PUT', headers: { 'Authorization': `token ${PRJ_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Img Upload", content: content })
        });
        if(res.ok) return `https://raw.githubusercontent.com/${PRJ_GH_U}/${PRJ_GH_R}/main/Projects/${filename}`;
    } catch(e) { console.error(e); }
    return null;
}

// --- 📱 UI & TAB LOGIC (FLASH FIXED) ---

function openProjectScreen() {
    const s = document.getElementById('projectScr');
    if(s) {
        s.style.display = 'flex';
        setTimeout(() => s.classList.add('active'), 10);
        loadPrjFeed(); // Start loading/caching
    }
}

function switchProjectTab(tab) {
    const feed = document.getElementById('projectFeed');
    const form = document.getElementById('projectForm');
    const b1 = document.getElementById('btnFeed');
    const b2 = document.getElementById('btnUpload');

    if(tab === 'feed') {
        if(b1 && b1.classList.contains('active')) return;
        feed.style.display = 'block'; form.style.display = 'none';
        if(b1) b1.classList.add('active'); if(b2) b2.classList.remove('active');
        loadPrjFeed(); 
    } else {
        feed.style.display = 'none'; form.style.display = 'block';
        if(b2) b2.classList.add('active'); if(b1) b1.classList.remove('active');
    }
}

function handlePrjFile(input, prvId, key) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            prjStore[key] = e.target.result;
            if(key === 'avatar') {
                document.getElementById('pfpPrv').src = e.target.result;
                document.getElementById('pfpPrv').style.display = 'block';
                document.getElementById('pfpIcon').style.display = 'none';
            } else {
                document.getElementById(prvId).innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
            }
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// --- 🚀 MAIN LOGIC: FAST LOAD (CACHE) & RENDER ---

async function loadPrjFeed() {
    const feed = document.getElementById('projectFeed');
    
    // 1. ⚡ INSTANT LOAD from Cache
    const cachedData = localStorage.getItem('prj_cache');
    if (cachedData) {
        renderProjects(JSON.parse(cachedData));
    } else {
        feed.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>FETCHING PROJECTS...</p>";
    }

    // 2. 🌍 BACKGROUND FETCH
    try {
        const res = await fetch(`https://raw.githubusercontent.com/${PRJ_GH_U}/${PRJ_GH_R}/main/${PRJ_GH_DB}?t=${Date.now()}`);
        if(!res.ok) throw new Error();
        let data = await res.json();
        
        localStorage.setItem('prj_cache', JSON.stringify(data));
        renderProjects(data);
    } catch(e) { 
        if(!cachedData) feed.innerHTML = "<p style='text-align:center; opacity:0.5;'>ERROR LOADING FEED</p>"; 
    }
}

function renderProjects(data) {
    const feed = document.getElementById('projectFeed');
    if(!data || data.length === 0) { 
        feed.innerHTML = "<p style='text-align:center; opacity:0.5;'>NO PROJECTS YET</p>"; 
        return; 
    }

    feed.innerHTML = data.reverse().map(p => {
        const pfp = p.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        const tick = p.verified ? `<i class="fa-solid fa-circle-check" style="color:#3b82f6; margin-left:5px;"></i>` : ``;

        // Permissions
        const isMine = (p.uuid === userUUID); 
        const isAdmin = (typeof ADMIN_UUID !== 'undefined' && userUUID === ADMIN_UUID);
        
        let controls = "";
        if (isMine || isAdmin) {
            controls += `<button onclick="deleteProject('${p.id}', '${p.uuid}')" style="background:rgba(255,0,0,0.1); color:#ff4444; border:none; padding:6px 12px; border-radius:6px; font-size:0.75rem; cursor:pointer;"><i class="fa-solid fa-trash"></i> DELETE</button>`;
        }
        if (isAdmin) {
            controls += `<button onclick="toggleVerifyProject('${p.id}')" style="background:rgba(0,218,255,0.1); color:#00daff; border:none; padding:6px 12px; border-radius:6px; font-size:0.75rem; cursor:pointer; margin-left:8px;"><i class="fa-solid fa-shield-check"></i> ${p.verified ? 'UNVERIFY' : 'VERIFY'}</button>`;
        }

        let imgs = "";
        if(p.images && p.images.length > 0) {
            imgs = `<div class="p-imgs" style="display:flex; gap:8px; overflow-x:auto; margin:12px 0; padding-bottom:5px;">
                ${p.images.map(url => `<img src="${url}" style="height:110px; border-radius:10px; object-fit:cover; pointer-events:none;">`).join('')}
            </div>`;
        }

        return `
        <div class="project-card" style="background:var(--card); padding:16px; border-radius:18px; margin-bottom:16px; border:1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <img src="${pfp}" style="width:42px; height:42px; border-radius:50%; border:1px solid var(--border); object-fit:cover;">
                <div>
                    <h3 style="margin:0; font-size:1.35rem; color:var(--text); letter-spacing:0.4px;">${p.title}${tick} </h3>
                    <span style="font-size:0.8rem; color:#777;">DEV : ${p.author}</span>
                </div>
            </div>
            <p style="color:#bbb; font-size:0.9rem; line-height:1.2; margin:0;">${p.desc}</p>
            ${imgs}
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; border-top:1px solid var(--border); padding-top:12px;">
                ${p.link ? `<a href="${p.link}" target="_blank" style="color:var(--card); text-decoration:none; background:var(--text); padding:6px 14px; border-radius:20px; font-size:0.8rem; border:1px solid #333;">GET PROJECT</a>` : '<span></span>'}
                <div style="display:flex;">${controls}</div>
            </div>
        </div>`;
    }).join('');
}

// --- 🚀 UPLOAD ACTION ---

async function pushProjectData() {
    const author = document.getElementById('prjAuthor').value;
    const title = document.getElementById('prjTitle').value;
    const desc = document.getElementById('prjDesc').value;
    const link = document.getElementById('prjUrl').value;
    const btn = document.getElementById('prjPushBtn');
    const txt = btn.querySelector('.btn-text');
    const bar = btn.querySelector('.progress-bar');

    if(!author || !title || !prjStore.img1) { alert("⚠️ NAME, TITLE & 1 IMAGE REQUIRED!"); return; }

    btn.style.pointerEvents = "none"; txt.innerText = "UPLOADING..."; bar.style.width = "30%";

    try {
        const uAv = await uploadPrjImg(prjStore.avatar, "pfp");
        const u1 = await uploadPrjImg(prjStore.img1, "s1");
        bar.style.width = "60%";
        const u2 = await uploadPrjImg(prjStore.img2, "s2");
        const u3 = await uploadPrjImg(prjStore.img3, "s3");
        
        const { sha, data } = await getPrjDB();
        const newPost = {
            id: "prj_" + Date.now(),
            uuid: userUUID, 
            title: title.toUpperCase(), author: author.toUpperCase(),
            avatar: uAv, desc: desc, link: link, images: [u1, u2, u3].filter(x => x),
            verified: false, date: Date.now()
        };
        data.push(newPost);
        await savePrjDB(data, sha, `Hub: ${title}`);
        bar.style.width = "100%"; txt.innerText = "SUCCESS!"; 
        alert("Project Published 🎉 ,⏳ It will automatically appear on the website in a few minutes.!");
       location.reload();
    } catch(e) { 
        alert("Error: " + e.message); btn.style.pointerEvents = "all"; bar.style.width = "0%"; txt.innerText = "RETRY"; 
    }
}

// --- 🛡️ ADMIN ACTIONS ---

async function deleteProject(id, postUUID) {
    const isMine = postUUID === userUUID;
    const isAdmin = (typeof ADMIN_UUID !== 'undefined' && userUUID === ADMIN_UUID);
    if (!isMine && !isAdmin) return;

    if(confirm("Want to delete this project?😢")) {
        const { sha, data } = await getPrjDB();
        const filtered = data.filter(x => x.id !== id);
        await savePrjDB(filtered, sha, "Project Removed");
        localStorage.removeItem('prj_cache'); // Clear cache
        loadPrjFeed(); 
    }
}

async function toggleVerifyProject(id) {
    if (typeof ADMIN_UUID === 'undefined' || userUUID !== ADMIN_UUID) return;
    const { sha, data } = await getPrjDB();
    const idx = data.findIndex(x => x.id === id);
    if(idx > -1) {
        data[idx].verified = !data[idx].verified;
        await savePrjDB(data, sha, "Verify Status Updated");
        localStorage.removeItem('prj_cache');
        loadPrjFeed();
    }
}

    /* ================= CHAT MODULE ================= */
    let userUUID = localStorage.getItem('ns_user_uuid');
    if (!userUUID) { userUUID = 'uid_' + Date.now().toString(36) + Math.random().toString(36).substr(2); localStorage.setItem('ns_user_uuid', userUUID); }
    let savedName = localStorage.getItem('ns_user_fixed') || "";
    let selectedImgBase64 = "";

    async function checkVerifyStatus() {
        try {
            const res = await fetch("https://nothingcommunity-7664f-default-rtdb.firebaseio.com/verified_users.json");
            const v = await res.json() || {};
            if(v[userUUID] === true) {
                document.getElementById('imgUploadBtn').style.display = 'block';
            } else {
                document.getElementById('imgUploadBtn').style.display = 'none';
            }
        } catch(e) {}
    }

    function handleFileSelect() {
        const fileInput = document.getElementById('imgInput');
        const file = fileInput.files[0];
        if (!file) return;

        fetch("https://nothingcommunity-7664f-default-rtdb.firebaseio.com/verified_users.json")
        .then(res => res.json())
        .then(verifiedList => {
            verifiedList = verifiedList || {};
            if (verifiedList[userUUID] !== true) {
                alert("🔒 ONLY VERIFIED USERS CAN SEND PHOTOS.");
                fileInput.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; 
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    selectedImgBase64 = canvas.toDataURL('image/jpeg', 0.7); 
                    const preview = document.getElementById('imgPreview');
                    preview.src = selectedImgBase64;
                    preview.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        })
        .catch(() => {
            alert("ERROR CHECKING PERMISSIONS");
            fileInput.value = "";
        });
    }
    function clearImage() { document.getElementById('imgInput').value = ""; document.getElementById('imgPreview').style.display = 'none'; selectedImgBase64 = ""; }
    
    // NEW REPLY FUNCTIONS
    function initReply(id, name, text) {
        currentReply = { id: id, name: name, text: text };
        document.getElementById('replyBanner').style.display = 'flex';
        document.getElementById('replyText').innerText = name + ": " + text;
        document.getElementById('userMsg').focus();
    }

    function cancelReply() {
        currentReply = null;
        document.getElementById('replyBanner').style.display = 'none';
    }

    // SCROLL TO MSG FUNCTION
    function scrollToMsg(id) {
        const target = document.getElementById(`msg-${id}`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.style.transition = "background 0.5s ease";
            const originalBg = target.style.background;
            target.style.background = "rgba(255, 0, 0, 0.2)"; 
            setTimeout(() => { target.style.background = originalBg; }, 1000);
        } else {
            alert("Message not found (might be deleted or not loaded).");
        }
    }

    async function sendMsg() {
        const input = document.getElementById('userMsg'); const btn = document.getElementById('sendBtn'); 
        let msg = input.value.trim();
        
        if (!msg && !selectedImgBase64) return;
        if (msg === "/reset") { localStorage.removeItem('ns_user_fixed'); savedName = ""; alert("NAME RESET!"); input.value = ""; return; }
        if (!savedName || savedName === "USER") { let enterName = prompt("ENTER YOUR NAME:"); if (!enterName || enterName.trim() === "") return; savedName = enterName.trim().toUpperCase(); localStorage.setItem('ns_user_fixed', savedName); }
        
        const payload = { 
            userName: savedName, 
            text: msg, 
            image: selectedImgBase64, 
            reply: "", 
            timestamp: Date.now(), 
            uuid: userUUID, 
            isVerified: false,
            quoted: currentReply ? { id: currentReply.id, name: currentReply.name, text: currentReply.text } : null 
        };

        const originalHTML = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="red-dot-loader"></span>';
        try {
            const banCheck = await fetch(`https://nothingcommunity-7664f-default-rtdb.firebaseio.com/banned/${userUUID}.json`); const isBanned = await banCheck.json(); if (isBanned === true) { alert("🚫 YOU ARE BANNED."); return; }
            await fetch(DB_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
            input.value = ""; clearImage(); cancelReply(); await loadMessages(); 
        } catch (e) { alert("FAILED"); } finally { btn.disabled = false; btn.innerHTML = originalHTML; }
    }

    function toggleMsgActions(bubble) {
        const isActive = bubble.classList.contains('active-actions');
        document.querySelectorAll('.msg-bubble').forEach(b => b.classList.remove('active-actions'));
        if(!isActive) bubble.classList.add('active-actions');
    }

    async function deleteMyMsg(id) {
        if(!confirm("DELETE?")) return;
        try {
            await fetch(`https://nothingcommunity-7664f-default-rtdb.firebaseio.com/chat/${id}.json`, { method: 'DELETE' });
            loadMessages();
        } catch(e) { alert("ERROR"); }
    }

    async function loadMessages() {
        try {
            const [chatRes, verifyRes] = await Promise.all([ fetch(DB_URL), fetch("https://nothingcommunity-7664f-default-rtdb.firebaseio.com/verified_users.json") ]);
            const data = await chatRes.json(); const verifiedData = await verifyRes.json() || {}; const board = document.getElementById('msgBoard');
            if (!data) { board.innerHTML = '<p style="opacity:0.4; text-align:center;">NO MESSAGES YET.</p>'; return; }
            const messages = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            
            board.innerHTML = messages.map(m => {
                const isUserVerified = (m.uuid && verifiedData[m.uuid] === true);
                const tickHtml = isUserVerified ? '<i class="fa-solid fa-circle-check" style="color:#1da1f2; margin-left:4px; font-size:0.8rem;"></i>' : '';
                const isMe = m.uuid === userUUID; const alignClass = isMe ? 'self' : '';
                const deleteBtn = isMe ? `<span class="action-btn del-btn" onclick="event.stopPropagation(); deleteMyMsg('${m.id}')"><i class="fa-solid fa-trash"></i> DELETE</span>` : '';
                
                let quotedHtml = ''; 
                if (m.quoted) { 
                    const replyId = m.quoted.id || ''; 
                    const clickAction = replyId ? `onclick="event.stopPropagation(); scrollToMsg('${replyId}')"` : '';
                    quotedHtml = `<div class="quoted-block" ${clickAction} style="${replyId ? 'cursor:pointer;' : ''}">
                                        <span class="q-name">${m.quoted.name}</span>
                                        <span class="q-text">${m.quoted.text}</span>
                                      </div>`; 
                }

                return `
                <div id="msg-${m.id}" class="msg-bubble ${alignClass}" style="user-select: none;" 
                     onclick="toggleMsgActions(this)">
                    
                    <span class="u-badge" onclick="handleAdminTap(event, '${m.id}', '${m.userName}', ${isUserVerified}, '${m.uuid}')">
                        ${m.userName || 'USER'} ${tickHtml}
                    </span>

                    ${quotedHtml}
                    ${m.image ? `<img src="${m.image}" class="msg-img" onclick="openImageViewer(this.src)">` : ''}
                    
                    <p style="text-transform:none; margin:5px 0;">${m.text}</p>

                    ${m.reply ? `<div class="admin-reply-box"><span class="admin-tag">● ADMIN REPLY</span><p style="text-transform:none; opacity:0.8;">${m.reply}</p></div>` : ''}
                    
                    <div class="msg-footer">
                        <span class="action-btn" onclick="event.stopPropagation(); initReply('${m.id}', '${m.userName}', '${m.text.replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-reply"></i> REPLY
                        </span>
                        ${deleteBtn}
                    </div>
                </div>`;
            }).join(''); board.scrollTop = board.scrollHeight;
        } catch (e) { console.log(e); }
    }

    /* === NEW TAP LOGIC FOR ADMIN === */
    let adminTapCount = 0;
    let adminTapTimer;

    function handleAdminTap(event, id, name, verified, uuid) {
        event.stopPropagation(); 

        // STRICT ADMIN CHECK HERE
        if (userUUID !== ADMIN_UUID) return;

        adminTapCount++;
        
        clearTimeout(adminTapTimer);

        if (adminTapCount === 2) {
            adminTapCount = 0; 
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]); 
            adminControl(id, name, verified, uuid); 
        } else {
            adminTapTimer = setTimeout(() => {
                adminTapCount = 0;
            }, 400);
        }
    }

    async function adminControl(msgId, currentName, currentStatus, targetUUID) {
        const pass = prompt("ADMIN PASSWORD:"); if (!pass) return;
        if (stringToHash(pass) === "1540218370") {
            const action = prompt(`MANAGE: ${currentName}\nUUID: ${targetUUID ? 'FOUND' : 'MISSING'}\n\n1.REPLY 2.DELETE ALL 3.DELETE SINGLE 4.${currentStatus ? 'UNVERIFY' : 'VERIFY'} 5.BAN 6.UNBAN`);
            const url = `https://nothingcommunity-7664f-default-rtdb.firebaseio.com/chat/${msgId}.json`;
            const banUrl = `https://nothingcommunity-7664f-default-rtdb.firebaseio.com/banned/${targetUUID}.json`;
            const verifyUrl = `https://nothingcommunity-7664f-default-rtdb.firebaseio.com/verified_users/${targetUUID}.json`;
            
            if (action === "1") { const txt = prompt("REPLY:"); if(txt) await fetch(url, { method: 'PATCH', body: JSON.stringify({ reply: txt }) }); }
            else if (action === "2") { 
                if(targetUUID && confirm("⚠️ DELETE ALL MESSAGES FROM THIS USER?")) {
                    const allMsgRes = await fetch(DB_URL);
                    const allData = await allMsgRes.json();
                    if(allData) {
                        const promises = [];
                        Object.keys(allData).forEach(key => {
                            if(allData[key].uuid === targetUUID) {
                                promises.push(fetch(`https://nothingcommunity-7664f-default-rtdb.firebaseio.com/chat/${key}.json`, { method: 'DELETE' }));
                            }
                        });
                        await Promise.all(promises);
                        alert("ALL MESSAGES DELETED!");
                    }
                }
            }
            else if (action === "3") { if(confirm("DELETE THIS MESSAGE?")) await fetch(url, { method: 'DELETE' }); }
            else if (action === "4") { if (!targetUUID) { alert("NO UUID"); return; } if (currentStatus) { await fetch(verifyUrl, { method: 'DELETE' }); alert("UNVERIFIED"); } else { await fetch(verifyUrl, { method: 'PUT', body: JSON.stringify(true) }); alert("VERIFIED"); } }
            else if (action === "5") { if(targetUUID && confirm("BAN?")) { await fetch(banUrl, { method: 'PUT', body: JSON.stringify(true) }); alert("BANNED"); } }
            else if (action === "6") { if(targetUUID) { await fetch(banUrl, { method: 'DELETE' }); alert("UNBANNED"); } }
            loadMessages();
        } else alert("WRONG PASSWORD!");
    }

    function stringToHash(string) { let hash = 0; if (string.length === 0) return hash; for (let i = 0; i < string.length; i++) { const char = string.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return hash.toString(); }
    async function initPresetData() { const grid = document.getElementById('presetGrid'); grid.innerHTML = "<p style='padding:20px; text-align:center;'>LOADING PRESETS...</p>"; try { const res = await fetch("https://raw.githubusercontent.com/nothingcommunity/Testing/main/Camera%20Presets/Presets/presets.json"); const data = await res.json(); grid.innerHTML = data.map(p => `<div class="wp-card"><img src="${p.img}" loading="lazy" width="200" height="250"><div class="wp-overlay"><p>${p.id || 'PRESET'}</p><button class="btn" onclick="runDownload(this, '${p.url}')"><div class="progress-bar"></div><span class="btn-text">GET</span></button></div></div>`).join(''); setTimeout(attachScrollAnimation, 100); } catch(e) { grid.innerHTML = "ERROR"; } }
    async function initWallpaperData() { const grid = document.getElementById('wallpaperGrid'); grid.innerHTML = "<p style='padding:20px; text-align:center;'>LOADING WALLPAPERS...</p>"; try { const res = await fetch("https://raw.githubusercontent.com/nothingcommunity/Testing/main/Wallpapers/Walls/wallpapers.json"); const data = await res.json(); const walls = Array.isArray(data) ? data : data.wallpapers; grid.innerHTML = walls.map(w => `<div class="wp-card"><img src="${w.img}" loading="lazy" width="200" height="250"><div class="wp-overlay"><button class="btn" onclick="runDownload(this, '${w.url}')"><div class="progress-bar"></div><span class="btn-text">DOWNLOAD</span></button></div></div>`).join(''); setTimeout(attachScrollAnimation, 100); } catch(e) { grid.innerHTML = "ERROR LOADING"; } }
    async function generateAIWall() {
        const prompt = document.getElementById('aiPrompt').value.trim(); const ratio = document.getElementById('aiRatio').value; const btn = document.getElementById('genBtn'), aiImg = document.getElementById('aiImg'), resultDiv = document.getElementById('aiResult'), bar = btn.querySelector('.progress-bar'), txt = btn.querySelector('.btn-text');
        if (!prompt) { alert("PLEASE ENTER SOMETHING"); return; }
        btn.style.pointerEvents = 'none'; txt.innerText = 'IMAGINING...'; bar.style.transition = 'width 60s cubic-bezier(0.4, 0, 0.2, 1)'; bar.style.width = '90%'; resultDiv.style.display = 'none'; aiImg.style.opacity = '0';
        let w = 1080, h = 1920; if (ratio === "16:9") { w = 1920; h = 1080; } else if (ratio === "1:1") { w = 1080; h = 1080; }
        const seed = Math.floor(Math.random() * 100000); const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", nothing style, minimal, 8k")}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;
        try { const res = await fetch(url); if (!res.ok) throw new Error("Error"); const blob = await res.blob(); if (blob.size > 1000000) throw new Error("Rate Limit"); aiImg.src = URL.createObjectURL(blob); resultDiv.style.display = 'block'; setTimeout(() => { aiImg.style.opacity = '1'; resultDiv.scrollIntoView({behavior:'smooth'}); }, 100); bar.style.width = '0%'; bar.style.transition = 'none'; txt.innerText = 'GENERATE AGAIN'; } catch (e) { alert("SERVER BUSY. TRY LATER."); bar.style.width = '0%'; bar.style.transition = 'none'; txt.innerText = 'TRY AGAIN'; } finally { btn.style.pointerEvents = 'all'; }
    }
    async function downloadAIWall(btn) { runDownload(btn, document.getElementById('aiImg').src); }

    function openImageViewer(src) {
        const viewer = document.getElementById('imgViewer');
        const img = document.getElementById('viewImg');
        img.src = src;
        viewer.style.display = 'flex';
        setTimeout(() => viewer.classList.add('active'), 10);
    }

    function closeImageViewer() {
        const viewer = document.getElementById('imgViewer');
        viewer.classList.remove('active');
        setTimeout(() => { viewer.style.display = 'none'; document.getElementById('viewImg').src = ""; }, 300);
    }

    function downloadViewImage() {
        const src = document.getElementById('viewImg').src;
        const a = document.createElement('a');
        a.href = src;
        a.download = "Nothing_Community_Img_" + Date.now() + ".jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    document.addEventListener('contextmenu', function(e) { if (e.target.tagName === 'IMG') { e.preventDefault(); } }, false);
    window.ondragstart = function() { return false; };</script>
