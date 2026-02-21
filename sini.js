/* ================= SECRET FILE DROP LOGIC & ANTI-LAG PARTICLE ENGINE ================= */
let dropPeer = null;
let dropConn = null;
let directHtml5Qrcode = null; 
let resolveCurrentFile = null; 

let receiveBuffer = [];
let receivedSize = 0;
let expectedSize = 0;
let incomingFileInfo = null;
let statusTimeoutTimer = null; 
let particleTimer = null;
let transferStartTime = 0; 

function formatDropBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// PREMIUM CARD STYLE FOR RECEIVED FILES
function appendReceivedFile(blob, filename, filetype) {
    const container = document.getElementById('dropTextLogs');
    const div = document.createElement('div');
    
    // Updated to Card Style
    div.style.cssText = "background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 12px; position: relative; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s;";
    
    div.onmouseover = () => { div.style.borderColor = "var(--text)"; div.style.backgroundColor = "rgba(255,255,255,0.05)"; };
    div.onmouseout = () => { div.style.borderColor = "var(--border)"; div.style.backgroundColor = "rgba(255,255,255,0.02)"; };

    let isImage = filetype.startsWith('image/');
    let objectUrl = URL.createObjectURL(blob);
    let iconHtml = '<i class="fa-solid fa-file" style="font-size: 2rem; opacity: 0.6;"></i>';

    if (isImage) {
        iconHtml = `<img src="${objectUrl}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">`;
    }

    div.innerHTML = `
        ${iconHtml}
        <div style="flex: 1; min-width: 0; text-align: left;">
            <div style="font-family: 'VT323', monospace; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 1.1rem; color: var(--text);">${filename}</div>
            <div style="font-family: monospace; font-size: 0.8rem; opacity: 0.5; margin-top: 2px;">${formatDropBytes(blob.size)}</div>
        </div>
    `;
    
    // Tap to re-download
    div.onclick = () => {
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        a.click();
    };

    container.prepend(div);
}

function spawnParticles(type) {
    const container = document.getElementById('particle-container');
    if (!container) return;
    
    const particleCount = Math.floor(Math.random() * 5) + 4; 

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('data-particle');
        
        const startX = Math.random() * window.innerWidth;
        particle.style.left = `${startX}px`;
        
        const duration = Math.random() * 1.5 + 1.5; 

        if (type === 'send') {
            particle.classList.add('particle-send');
        } else if (type === 'recv') {
            particle.classList.add('particle-recv');
        }

        particle.style.animationDuration = `${duration}s`;
        
        particle.onanimationend = () => { if(particle.parentNode) particle.remove(); };
        setTimeout(() => { if(particle.parentNode) particle.remove(); }, (duration * 1000) + 100);

        container.appendChild(particle);
    }
}

function startParticleStream(type) {
    if(particleTimer) clearInterval(particleTimer);
    spawnParticles(type); 
    particleTimer = setInterval(() => spawnParticles(type), 300); 
}

function stopParticleStream() {
    if(particleTimer) { clearInterval(particleTimer); particleTimer = null; }
}

function initDropSystem(forceNew = false) {
    if (forceNew && dropPeer) { dropPeer.destroy(); dropPeer = null; }
    if (dropPeer) return; 
    
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    dropPeer = new Peer(randomId);

    dropPeer.on('open', (id) => {
        document.getElementById('dropMyCode').innerText = id;
        document.getElementById('dropQrCode').innerHTML = ""; 
        new QRCode(document.getElementById("dropQrCode"), {
            text: id, width: 140, height: 140, colorDark: "#000000", colorLight: "#ffffff"
        });
    });

    dropPeer.on('connection', (conn) => {
        if (dropConn) { conn.close(); return; }
        dropConn = conn; 
        
        conn.on('open', () => {
            if(navigator.vibrate) navigator.vibrate([30, 30]);
            document.getElementById('recvInitialUI').style.display = 'none';
            document.getElementById('recvConnectedUI').style.display = 'block';
            showDropStatus("Waiting for sender⏳", "var(--text)", "radar", 0, false);
        });

        conn.on('data', (data) => {
            if (data.type === 'text') {
                if(navigator.vibrate) navigator.vibrate([30, 30]);
                spawnParticles('recv'); 
                appendReceivedText(data.content);
                showDropStatus("Text received successfully 🎉", "#28a745", "none", 0, true);
            }
            else if (data.type === 'header') {
                startParticleStream('recv'); 
                receiveBuffer = [];
                receivedSize = 0;
                expectedSize = data.size;
                incomingFileInfo = data;
                transferStartTime = performance.now(); 
                showDropStatus(`PREPARING FILE...`, "var(--text)", "progress", 0, false);
            } 
            else if (data.type === 'chunk') {
                receiveBuffer.push(data.data);
                receivedSize += data.data.byteLength;

                if (receivedSize === expectedSize || receiveBuffer.length % 5 === 0) {
                    let percent = Math.round((receivedSize / expectedSize) * 100);
                    let timeElapsed = (performance.now() - transferStartTime) / 1000;
                    let speed = timeElapsed > 0 ? formatDropBytes(receivedSize / timeElapsed) + "/s" : "...";
                    showDropStatus(`DOWNLOADING: ${percent}% | ${speed}`, "var(--text)", "progress", percent, false);
                }

                if (receivedSize === expectedSize) {
                    stopParticleStream(); 
                    if(navigator.vibrate) navigator.vibrate([50, 50]);
                    
                    const blob = new Blob(receiveBuffer, { type: incomingFileInfo.filetype });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a'); 
                    a.href = url; 
                    a.download = incomingFileInfo.filename; 
                    a.click();
                    
                    appendReceivedFile(blob, incomingFileInfo.filename, incomingFileInfo.filetype);
                    
                    conn.send({ type: 'ack' });
                    showDropStatus("File received successfully 🎉", "#28a745", "none", 0, true);
                }
            }
        });
        
        conn.on('close', () => { disconnectDrop(true); });
    });
}

function appendReceivedText(text) {
    const container = document.getElementById('dropTextLogs');
    const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    const div = document.createElement('div');
    div.style.cssText = "background: var(--card); border: 1px solid var(--border); padding: 18px; border-radius: 12px; position: relative; word-wrap: break-word;";
    
    const textSpan = document.createElement('span');
    textSpan.style.cssText = "display:block; font-family:'VT323', monospace; font-size:1.1rem; padding-right:35px; white-space: pre-wrap;";
    textSpan.innerHTML = safeText;
    
    const copyBtn = document.createElement('button');
    copyBtn.style.cssText = "position:absolute; right:8px; top:8px; background:var(--card); border:1px solid var(--border); color:var(--text); width:30px; height:30px; border-radius:8px; cursor:pointer; transition: 0.2s;";
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    
    copyBtn.onclick = function() {
        if(navigator.vibrate) navigator.vibrate(15);
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.innerHTML = '<i class="fa-solid fa-check" style="color:#00ff00;"></i>';
                setTimeout(() => { this.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 2000);
            }).catch(() => { alert("Copy failed! Please select text manually."); });
        } else {
            alert("Copy not supported on this browser context.");
        }
    };
    
    div.appendChild(textSpan);
    div.appendChild(copyBtn);
    container.prepend(div);
}

function switchDropTab(tab) {
    if(navigator.vibrate) navigator.vibrate(10);
    if (!dropPeer) initDropSystem(false); 
    
    document.getElementById('recvTab').style.display = tab === 'recv' ? 'block' : 'none';
    document.getElementById('sendTab').style.display = tab === 'send' ? 'block' : 'none';
    if(tab === 'recv') stopDirectScanner();
}

function showDropStatus(msg, color, animType = "none", percent = 0, autoHide = false) {
    const d = document.getElementById('dropStatus');
    clearTimeout(statusTimeoutTimer); 

    d.style.display = 'block'; 
    d.style.color = color; 
    let animHtml = "";
    
    if (animType === "radar") {
        animHtml = `<div class="radar-box"><div class="radar-core"></div><div class="radar-pulse"></div></div>`;
    } else if (animType === "progress") {
        animHtml = `
        <div style="width:100%; max-width:250px; height:8px; background:var(--border); border-radius:10px; margin:10px auto; overflow:hidden;">
            <div style="width:${percent}%; height:100%; background:var(--text); transition:width 0.1s ease-out;"></div>
        </div>`;
    }
    d.innerHTML = `${animHtml} <div style="margin-top:5px;">${msg}</div>`;

    if (autoHide) statusTimeoutTimer = setTimeout(() => { d.style.display = 'none'; }, 3000);
}

function startDirectScanner() {
    const trigger = document.getElementById('scannerTrigger');
    const reader = document.getElementById('dropReader');
    const loader = document.getElementById('scannerLoader');

    trigger.style.display = 'none'; loader.style.display = 'block';
    if (!directHtml5Qrcode) directHtml5Qrcode = new Html5Qrcode("dropReader");
    const config = { fps: 30, qrbox: { width: 250, height: 250 } };

    directHtml5Qrcode.start({ facingMode: "environment" }, config,
        (decodedText) => {
            if(navigator.vibrate) navigator.vibrate(50);
            stopDirectScanner(); 
            connectDropManual(decodedText); 
        },
        (errorMessage) => {}
    ).then(() => {
        loader.style.display = 'none'; reader.style.display = 'block';
    }).catch((err) => {
        loader.style.display = 'none'; trigger.style.display = 'flex';
        alert("Camera access denied or error occurred.");
    });
}

function stopDirectScanner() {
    if (directHtml5Qrcode && directHtml5Qrcode.isScanning) {
        directHtml5Qrcode.stop().then(() => {
            document.getElementById('dropReader').style.display = 'none';
            document.getElementById('scannerTrigger').style.display = 'flex';
        }).catch(err => console.log(err));
    }
}

function connectDropManual(scannedCode = null) {
    if(navigator.vibrate) navigator.vibrate(15);
    const code = scannedCode || document.getElementById('manualDropCode').value.trim();
    if(!code || code.length !== 6) return alert("Please enter the full 6-digit secure PIN!");
    
    showDropStatus("VERIFYING... ⏳", "var(--text)", "radar", 0, false);
    dropConn = dropPeer.connect(code);
    
    dropConn.on('open', () => {
        if(navigator.vibrate) navigator.vibrate(30);
        document.getElementById('senderInitialUI').style.display = 'none';
        document.getElementById('dropSendSection').style.display = 'block';
        showDropStatus("CONNECTION SECURED! 🔗", "#28a745", "none", 0, true);
    });
    
    dropConn.on('data', (data) => { if (data.type === 'ack' && resolveCurrentFile) resolveCurrentFile(); });
    dropConn.on('error', () => { showDropStatus("INVALID PIN OR EXPIRED ❌", "var(--accent)", "none", 0, true); });
    dropConn.on('close', () => { disconnectDrop(true); });
}

function updateDropFileLabel() {
    const fileInput = document.getElementById('dropFileInput');
    const label = document.getElementById('dropFileLabel');
    const icon = document.getElementById('dropFileIcon');
    
    if (fileInput.files.length > 0) {
        if (fileInput.files.length === 1) {
            let name = fileInput.files[0].name;
            if(name.length > 20) name = name.substring(0, 18) + "...";
            label.innerText = name;
        } else {
            label.innerText = `${fileInput.files.length} FILES SELECTED`;
        }
        label.style.color = "var(--text)";
        icon.className = "fa-solid fa-file-circle-check";
    } else {
        label.innerText = "TAP TO SELECT FILES";
        label.style.color = "var(--text)";
        icon.className = "fa-solid fa-file-circle-plus";
    }
}

async function sendDropData() {
    const fileInput = document.getElementById('dropFileInput');
    const textInput = document.getElementById('dropTextInput');
    const files = fileInput.files;
    const textData = textInput.value.trim();

    if(files.length === 0 && textData === "") return alert("Please enter text or select a file to send!");
    
    const btn = document.getElementById('dropSendBtn');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> SENDING...`; 
    btn.disabled = true;

    startParticleStream('send');

    if (textData !== "") {
        dropConn.send({ type: 'text', content: textData });
        textInput.value = ""; 
    }

    if (files.length > 0) {
        const CHUNK_SIZE = 64 * 1024; 
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            dropConn.send({ type: 'header', filename: file.name, filetype: file.type, size: file.size });

            let offset = 0; let chunkCount = 0;
            let sendStartTime = performance.now(); 
            
            while (offset < file.size) {
                if (dropConn.dataChannel.bufferedAmount > 1048576) await new Promise(r => setTimeout(r, 10));

                const slice = file.slice(offset, offset + CHUNK_SIZE);
                const buffer = await slice.arrayBuffer();
                dropConn.send({ type: 'chunk', data: buffer });
                
                offset += buffer.byteLength; chunkCount++;

                if (offset === file.size || chunkCount % 4 === 0) {
                    let percent = Math.round((offset / file.size) * 100);
                    let timeElapsed = (performance.now() - sendStartTime) / 1000;
                    let speed = timeElapsed > 0 ? formatDropBytes(offset / timeElapsed) + "/s" : "...";
                    showDropStatus(`SENDING: ${percent}% | ${speed}`, "var(--text)", "progress", percent, false);
                }
            }
            await new Promise(resolve => { resolveCurrentFile = resolve; });
        }
        fileInput.value = ""; 
        updateDropFileLabel(); 
    }
    
    stopParticleStream();
    
    if(navigator.vibrate) navigator.vibrate([20, 20]);
    showDropStatus(`Data sent successfully 🎉`, "#28a745", "none", 0, true); 
    
    btn.innerHTML = `<i class="fa-solid fa-paper-plane" style="margin-right: 8px;"></i> SEND DATA`; 
    btn.disabled = false;
}

function disconnectDrop(auto = false) {
    if(dropConn) { dropConn.close(); dropConn = null; }
    stopDirectScanner(); 
    stopParticleStream(); 
    
    const sendBtn = document.getElementById('dropSendBtn');
    if (sendBtn) {
        sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane" style="margin-right: 8px;"></i> SEND DATA`; 
        sendBtn.disabled = false;
    }

    document.getElementById('dropTextLogs').innerHTML = "";
    document.getElementById('dropTextInput').value = "";
    document.getElementById('recvInitialUI').style.display = 'block';
    document.getElementById('recvConnectedUI').style.display = 'none';
    document.getElementById('senderInitialUI').style.display = 'block';
    document.getElementById('dropSendSection').style.display = 'none';
    document.getElementById('manualDropCode').value = '';
    document.getElementById('dropFileInput').value = ""; 
    updateDropFileLabel();

    if(!auto) {
        if(navigator.vibrate) navigator.vibrate([20, 20, 20]);
        showDropStatus("SESSION DESTROYED 🔴", "var(--accent)", "none", 0, true);
    } else {
        document.getElementById('dropStatus').style.display = 'none';
    }
    initDropSystem(true);

