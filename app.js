// Mengakses kontainer API yang telah Anda buat
const API_URL_TRACKER = 'http://localhost:8080';
const API_URL_SSO = 'http://localhost:8081';

const isAuthPage = window.location.pathname.includes('auth.html');

document.addEventListener('DOMContentLoaded', () => {
    // JWT Token adalah tiket masuk yang diterbitkan oleh SSO
    const token = localStorage.getItem('jwt_token');

    if (isAuthPage) {
        if (token) window.location.href = 'index.html'; // Usir jika sudah login
        else setupAuthPage();
    } else {
        if (!token) window.location.href = 'auth.html'; // Usir jika belum login
        else setupDashboard(token);
    }
});

// LOGIKA HALAMAN LOGIN & REGISTER
function setupAuthPage() {
    const authForm = document.getElementById('auth-form');
    const authMessage = document.getElementById('auth-message');

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = localStorage.getItem('authMode') || 'login';
        const username = document.getElementById('auth-username').value;
        const password = document.getElementById('auth-password').value;
        const endpoint = mode === 'login' ? '/login' : '/register';
        
        try {
            const response = await fetch(`${API_URL_SSO}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                authMessage.style.color = 'var(--danger)';
                authMessage.textContent = data.error || 'Autentikasi Gagal!';
                return;
            }

            if (mode === 'login') {
                // Simpan JWT ke brankas browser
                localStorage.setItem('jwt_token', data.token);
                // Bongkar sedikit isinya untuk mengambil username
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                localStorage.setItem('username', payload.username);
                window.location.href = 'index.html'; // Masuk ke Dashboard
            } else {
                authMessage.style.color = 'var(--secondary)';
                authMessage.textContent = 'Registrasi berhasil! Silakan Login.';
                switchTab('login');
            }
        } catch (err) {
            authMessage.style.color = 'var(--danger)';
            authMessage.textContent = 'Server SSO sedang tidak aktif.';
        }
    });
}

function switchTab(mode) {
    localStorage.setItem('authMode', mode);
    const tabs = document.querySelectorAll('.tab');
    tabs[0].classList.toggle('active', mode === 'login');
    tabs[1].classList.toggle('active', mode === 'register');
    document.getElementById('auth-submit').textContent = mode === 'login' ? 'Masuk ke Dashboard' : 'Buat Akun Baru';
    document.getElementById('auth-message').textContent = '';
}

// LOGIKA HALAMAN DASHBOARD
function setupDashboard(token) {
    const username = localStorage.getItem('username') || 'Tamu';
    document.getElementById('username-display').textContent = `👋 Hai, ${username}`;

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'auth.html';
    });

    // 1. Tampilkan daftar website saat pertama kali buka
    loadWebsites(token);

    // 2. Mendaftarkan website baru
    document.getElementById('add-website-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const urlInput = document.getElementById('website-url');
        const url = urlInput.value;

        try {
            const response = await fetch(`${API_URL_TRACKER}/websites`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Selipkan Kunci JWT!
                },
                body: JSON.stringify({ url })
            });

            if (response.ok) {
                urlInput.value = '';
                loadWebsites(token); // Muat ulang tabel
            } else {
                alert('Akses Ditolak (Mungkin URL kembar atau Token Kedaluwarsa)');
                if(response.status === 401) document.getElementById('logout-btn').click();
            }
        } catch (err) {
            alert('Gagal terhubung ke Server Tracker.');
        }
    });

    // 3. Tombol Cek Manual (Memicu Goroutines di Backend)
    document.getElementById('check-now-btn').addEventListener('click', async () => {
        const btn = document.getElementById('check-now-btn');
        btn.innerHTML = '⏳ Menghubungi Worker...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_URL_TRACKER}/check`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const statuses = await response.json();
                updateStatusesInTable(statuses);
            }
        } catch (err) {
            console.error(err);
        } finally {
            btn.innerHTML = '⚡ Cek Status';
            btn.disabled = false;
        }
    });
}

async function loadWebsites(token) {
    try {
        const response = await fetch(`${API_URL_TRACKER}/websites`);
        const websites = await response.json();

        const tbody = document.getElementById('websites-tbody');
        tbody.innerHTML = '';

        if (!websites || websites.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted)">Belum ada website yang Anda pantau.</td></tr>`;
            return;
        }

        websites.forEach(web => {
            tbody.innerHTML += `
                <tr id="row-${web.id}" data-url="${web.url}">
                    <td>#${web.id}</td>
                    <td style="font-weight: 600">${web.url}</td>
                    <td class="status-cell">
                        <span class="status-badge status-unknown">❓ Menunggu Pengecekan</span>
                    </td>
                </tr>
            `;
        });

        // Langsung klik tombol cek status secara rahasia untuk mengisi data terbaru!
        document.getElementById('check-now-btn').click();

    } catch (err) {
        console.error("Gagal memuat:", err);
    }
}

function updateStatusesInTable(statuses) {
    if (!statuses) return;
    
    const rows = document.querySelectorAll('#websites-tbody tr');
    
    rows.forEach(row => {
        const url = row.getAttribute('data-url');
        const statusData = statuses.find(s => s.url === url);
        
        if (statusData) {
            const cell = row.querySelector('.status-cell');
            if (statusData.status === 'UP') {
                cell.innerHTML = `<span class="status-badge status-up">🟢 ONLINE</span>`;
            } else {
                cell.innerHTML = `<span class="status-badge status-down">🔴 OFFLINE / DOWN</span>`;
            }
        }
    });
}
