if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/pwaApp/service-worker.js')
        .then(reg => {
          console.log('✅ Service Worker registered:', reg);
  
          // Listen for updates
          reg.onupdatefound = () => {
            const newWorker = reg.installing;
            newWorker.onstatechange = () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateMessage();
              }
            };
          };
        })
        .catch(err => console.error('❌ Service Worker registration failed:', err));
  
      // Refresh when new SW takes control
      let refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }
  
  let deferredPrompt;
  const installBtn = document.getElementById('installBtn');
  
  // Show install button when available
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
  });
  
  // Handle install button click
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
      }
      deferredPrompt = null;
      installBtn.style.display = 'none';
    }
  });
  
  // Hide button if app already installed
  window.addEventListener('appinstalled', () => {
    alert('✅ App installed successfully!');
    installBtn.style.display = 'none';
  });
  
  // Load version from version.json
  const appVersionID = document.getElementById("appVersion");
  fetch('/pwaApp/version.json?' + Date.now())
    .then(res => res.json())
    .then(data => {
      appVersionID.textContent = data.version || '1.0.0';
    })
    .catch(() => {
      appVersionID.textContent = 'offline';
    });
  
  // Show update message
  function showUpdateMessage() {
    const toastHtml = `
      <div class="toast show" role="alert" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: #28a745; color: white; padding: 12px 20px; border-radius: 4px; box-shadow: 0 0 10px rgba(0,0,0,0.2);">
        <strong>🔄 New version available.</strong>
        <div style="margin-top: 8px;"><button onclick="window.location.reload()" style="background:white; color:#28a745; border:none; padding:5px 10px; border-radius:3px;">Reload</button></div>
      </div>
    `;
    const toast = document.createElement('div');
    toast.innerHTML = toastHtml;
    document.body.appendChild(toast);
  }
  