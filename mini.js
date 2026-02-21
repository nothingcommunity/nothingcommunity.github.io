/* ================= FILE DROP FINAL LOGIC ================= */
let dropPeer = null;
let dropConn = null;
let dropScanner = null;
let dropResolveFile = null;
let dropParticleTimer = null;

function toggleDrop(tab) {
    document.getElementById('btnDropSend').style.background = tab === 'send' ? 'var(--text)' : 'var(--card)';
    document.getElementById('btnDropSend').style.color = tab === 'send' ? 'var(--bg)' : 'var(--text)';
    document.getElementById('btnDropRecv').style.background = tab === 'recv' ? 'var(--text)' : 'var(--card)';
    document.getElementById('btnDropRecv').style.color = tab === 'recv' ? 'var(--bg)' : 'var(--text)';
    
    document.getElementById('dropSenderUI').style.display = tab === 'send' ? 'block' : 'none';
    document.getElementById('dropReceiverUI').style.display = tab === 'recv' ? 'block' : 'none';
    
    if (tab === 'recv') {
        if (!dropPeer) generateDropReceiver();
    } else if (tab === 'send') {
        if (!dropPeer) dropPeer = new Peer();
    }
}

function dropReset() {
    if (dropConn) dropConn.close();
    if (dropPeer) { dropPeer.destroy(); dropPeer = null; }
    if (dropScanner && dropScanner.isScanning) dropScanner.stop();
    dropConn = null; dropScanner = null;
    
    document.getElementById('recvInitBox').style.display = 'block';
    document.getElementById('recvProgBox').style.display = 'none';
    document.getElementById('senderConnectBox').style.display = 'block';
    document.getElementById('senderDashBox').style.display = 'none';
    document.getElementById('dropReader').style.display = 'none';
    document.getElementById('dropScanBtn').style.display = 'grid';
    document.getElementById('dropInputPin').value = '';
    document.getElementById('dropTextMsg').value = '';
    document.getElementById('dropFileLabel').innerText = 'SELECT FILES';
    document.getElementById('dropSenderProgress').style.display = 'none';
    document.getElementById('dropConnectBtnAction').innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
    stopParticleStream();
}

// ================= DOT PARTICLE SYSTEM =================
function spawnParticles(type) {
    const container = document.getElementById('particle-container');
    if (!container) return;
    
    const particleCount = Math.floor(Math.random() * 3) + 2; 

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('data-particle');
        particle.style.left = `${Math.random() * window.innerWidth}px`;
        
        const duration = Math.random() * 1.5 + 1.2; 
        if (type === 'send') particle.classList.add('particle-send');
        else if (type === 'recv') particle.classList.add('particle-recv');
        
        particle.style.animationDuration = `${duration}s`;
        
        setTimeout(() => { if(particle.parentNode) particle.remove(); }, (duration * 1000) + 100);
        container.appendChild(particle);
    }
}

function startParticleStream(type) {
    if(dropParticleTimer) clearInterval(dropParticleTimer);
    spawnParticles(type); 
    dropParticleTimer = setInterval(() => spawnParticles(type), 300); 
}

function stopParticleStream() {
    if(dropParticleTimer) { clearInterval(dropParticleTimer); dropParticleTimer = null; }
}

function generateDropReceiver() {
    if(navigator.vibrate) navigator.vibrate(30);
    if (dropPeer) { dropPeer.destroy(); dropPeer = null; }
    
    let code = Math.floor(10000000 + Math.random() * 90000000).toString();
    document.getElementById('dropRecvCode').innerText = code;
    document.getElementById("dropQrCode").innerHTML = "";
    
    new QRCode(document.getElementById("dropQrCode"), { 
        text: code, width: 200, height: 200, 
        colorDark: "#000000", colorLight: "#ffffff", 
        correctLevel: QRCode.CorrectLevel.L 
    });
    
    dropPeer = new Peer('airtrans-' + code);
    dropPeer.on('connection', (c) => { dropConn = c; setupDropReceiver(); });
}

function formatBytes(b) {
    if (b===0) return '0 B';
    let k=1024, s=['B','KB','MB','GB'], i=Math.floor(Math.log(b)/Math.log(k));
    return parseFloat((b/Math.pow(k,i)).toFixed(2)) + ' ' + s[i];
}

function setupDropReceiver() {
    if(navigator.vibrate) navigator.vibrate([50,50]);
    document.getElementById('recvInitBox').style.display = 'none';
    document.getElementById('recvProgBox').style.display = 'block';
    
    let buffers = [], rSize = 0, meta = null, lastT = Date.now(), lastS = 0;
    
    dropConn.on('data', (d) => {
        if (d.type === 'meta') {
            startParticleStream('recv'); // DOTS NICHE AAYENGE!
            meta = d; buffers = []; rSize = 0;
            document.getElementById('dropRFilename').innerText = meta.name;
        } else if (d.type === 'chunk') {
            buffers.push(d.data); rSize += d.data.byteLength;
            let now = Date.now();
            if (now - lastT >= 500) {
                let spd = (rSize - lastS) / ((now - lastT) / 1000);
                document.getElementById('dropRSpeed').innerText = formatBytes(spd) + '/s';
                lastT = now; lastS = rSize;
            }
            let pct = Math.min(100, Math.round((rSize / meta.size) * 100));
            document.getElementById('dropRFill').style.width = pct + '%';
            document.getElementById('dropRStatus').innerText = `RECEIVING ${pct}%`;
            
            if (rSize === meta.size) {
                if(navigator.vibrate) navigator.vibrate([50,100]);
                stopParticleStream(); // DOTS RUK JAYENGE!
                
                const blob = new Blob(buffers, {type: meta.mime});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = meta.name; a.click();
                document.getElementById('dropRStatus').innerText = "SAVED!";
                document.getElementById('dropRSpeed').innerText = "";
                dropConn.send({type: 'ack'});
            }
        } else if (d.type === 'text') {
            if(navigator.vibrate) navigator.vibrate(50);
            alert("MESSAGE RECEIVED:\n\n" + d.content);
        }
    });
    dropConn.on('close', () => { alert("SENDER DISCONNECTED"); dropReset(); toggleDrop('recv'); });
}

function startDropScanner() {
    document.getElementById('dropReader').style.display = 'block';
    document.getElementById('dropScanBtn').style.display = 'none';
    
    if(!dropScanner) dropScanner = new Html5Qrcode("dropReader");
    
    dropScanner.start(
        { facingMode: "environment" }, 
        { fps: 15, qrbox: { width: 220, height: 220 } }, 
        (txt) => {
            if(navigator.vibrate) navigator.vibrate(50);
            dropScanner.stop();
            document.getElementById('dropReader').style.display = 'none';
            document.getElementById('dropScanBtn').style.display = 'grid';
            document.getElementById('dropInputPin').value = txt;
            connectDrop();
        }, 
        (err) => { }
    ).catch(e => {
        alert("Camera Permission Denied.");
        document.getElementById('dropReader').style.display = 'none';
        document.getElementById('dropScanBtn').style.display = 'grid';
    });
}

function connectDrop() {
    let pin = document.getElementById('dropInputPin').value.trim();
    if (pin.length !== 8) return alert("ENTER 8 DIGIT PIN");
    
    if (!dropPeer) dropPeer = new Peer();
    
    let btn = document.getElementById('dropConnectBtnAction');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    dropConn = dropPeer.connect('airtrans-' + pin);
    
    dropConn.on('open', () => {
        if(navigator.vibrate) navigator.vibrate([50,50]);
        document.getElementById('senderConnectBox').style.display = 'none';
        document.getElementById('senderDashBox').style.display = 'block';
        btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
        
        dropConn.on('data', (d) => { if (d.type === 'ack' && dropResolveFile) dropResolveFile(); });
    });
    
    dropConn.on('error', (err) => { 
        alert("CONNECTION FAILED. CHECK PIN."); 
        btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
    });
}

function updateDropFileLabel() {
    let files = document.getElementById('dropFileInput').files;
    document.getElementById('dropFileLabel').innerText = files.length > 0 ? (files.length === 1 ? files[0].name.substring(0,15)+"..." : files.length + " FILES SELECTED") : "SELECT FILES";
}

async function sendDropData() {
    let txt = document.getElementById('dropTextMsg').value.trim();
    let files = document.getElementById('dropFileInput').files;
    if (!txt && !files.length) return alert("SELECT FILE OR TYPE MESSAGE");
    
    document.getElementById('dropSendBtn').innerText = "SENDING...";
    if (txt) { dropConn.send({type: 'text', content: txt}); document.getElementById('dropTextMsg').value = ''; }
    
    if (files.length > 0) {
        document.getElementById('dropSenderProgress').style.display = 'block';
        startParticleStream('send'); // DOTS UPAR JAYENGE!
        
        for (let i = 0; i < files.length; i++) await sendSingleDrop(files[i], i+1, files.length);
        
        stopParticleStream(); // DOTS RUK JAYENGE!
        document.getElementById('dropSStatus').innerText = "ALL FILES SENT!";
        document.getElementById('dropSSpeed').innerText = "";
        document.getElementById('dropFileInput').value = '';
        document.getElementById('dropFileLabel').innerText = "SELECT FILES";
    }
    
    setTimeout(() => { document.getElementById('dropSendBtn').innerText = "SEND DATA"; }, 1500);
}

function sendSingleDrop(file, idx, tot) {
    return new Promise((res) => {
        dropResolveFile = res;
        dropConn.send({type: 'meta', name: file.name, size: file.size, mime: file.type});
        let off = 0, rd = new FileReader(), lastT = Date.now(), lastO = 0;
        
        rd.onload = (e) => {
            dropConn.send({type: 'chunk', data: e.target.result});
            off += 65536;
            let now = Date.now();
            if (now - lastT >= 500) {
                document.getElementById('dropSSpeed').innerText = formatBytes((off-lastO)/((now-lastT)/1000)) + '/s';
                lastT = now; lastO = off;
            }
            let pct = Math.min(100, Math.round((off/file.size)*100));
            document.getElementById('dropSFill').style.width = pct + '%';
            document.getElementById('dropSStatus').innerText = `FILE ${idx}/${tot} (${pct}%)`;
            
            if (off < file.size) {
                if (dropConn.dataChannel.bufferedAmount > 2097152) setTimeout(nxt, 20); else nxt();
            }
        };
        function nxt() { rd.readAsArrayBuffer(file.slice(off, off + 65536)); }
        nxt();
    });
}
