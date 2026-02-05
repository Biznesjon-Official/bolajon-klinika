const API_URL = 'http://localhost:3000/api';
let authToken = null;
let currentUser = null;

// Login functionality
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/xodimlar/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: username, parol: password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.xodim;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            showDashboard();
        } else {
            alert('Login yoki parol noto\'g\'ri!');
        }
    } catch (error) {
        console.error('Login xatosi:', error);
        alert('Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
});

// Show dashboard
function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'flex';
    document.getElementById('user-info').textContent = `${currentUser.ism} ${currentUser.familiya}`;
    document.body.classList.remove('login-page');

    loadDashboardStats();
    setupNavigation();
}

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    location.reload();
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active from all
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Hide all pages
            document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));

            // Show selected page
            const page = item.dataset.page;
            document.getElementById(`page-${page}`).classList.add('active');
            document.getElementById('page-title').textContent = item.textContent.trim();

            // Load page data
            loadPageData(page);
        });
    });
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        // Bemorlar soni
        const bemorlarRes = await fetch(`${API_URL}/bemorlar`);
        const bemorlarData = await bemorlarRes.json();
        document.getElementById('stat-bemorlar').textContent = bemorlarData.data?.length || 0;

        // Bugungi navbat
        const navbatRes = await fetch(`${API_URL}/navbat/kutish-zali/soni`);
        const navbatData = await navbatRes.json();
        document.getElementById('stat-navbat').textContent = navbatData.soni || 0;

        // Band koykalar
        const koykalarRes = await fetch(`${API_URL}/statsionar/koykalar`);
        const koykalarData = await koykalarRes.json();
        const bandKoykalar = koykalarData.data?.filter(k => k.holati !== 'bosh').length || 0;
        document.getElementById('stat-statsionar').textContent = bandKoykalar;

        // Bugungi to'lovlar
        const tolovlarRes = await fetch(`${API_URL}/tolovlar/hisobot/kunlik`);
        const tolovlarData = await tolovlarRes.json();
        const summa = (tolovlarData.data?.umumiy_summa || 0).toLocaleString();
        document.getElementById('stat-tolovlar').textContent = summa + ' so\'m';

        // Recent patients
        if (bemorlarData.data) {
            const recentContainer = document.getElementById('recent-patients');
            const recent = bemorlarData.data.slice(0, 5);
            recentContainer.innerHTML = recent.map(p => `
                <div style="padding: 12px; border-bottom: 1px solid var(--border);">
                    <strong>${p.ism} ${p.familiya}</strong><br>
                    <small class="text-muted">${p.telefon || 'N/A'}</small>
                </div>
            `).join('');
        }

        // Today's tests
        const tahlillarRes = await fetch(`${API_URL}/tahlillar/tayyor`);
        const tahlillarData = await tahlillarRes.json();
        if (tahlillarData.data) {
            const testsContainer = document.getElementById('today-tests');
            testsContainer.innerHTML = tahlillarData.data.slice(0, 5).map(t => `
                <div style="padding: 12px; border-bottom: 1px solid var(--border);">
                    <strong>${t.ism} ${t.familiya}</strong><br>
                    <small class="text-muted">${t.tahlil_turi}</small>
                    <span class="badge badge-success">Tayyor</span>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Stats yuklashda xato:', error);
    }
}

// Load page data
async function loadPageData(page) {
    switch (page) {
        case 'bemorlar':
            loadPatients();
            break;
        case 'statsionar':
            loadBeds();
            break;
        case 'navbat':
            loadQueue();
            break;
        case 'tahlillar':
            loadTests();
            break;
        case 'muolajalar':
            loadTreatments();
            break;
        case 'xodimlar':
            loadEmployees();
            break;
        case 'tolovlar':
            loadPayments();
            break;
    }
}

// Load patients
async function loadPatients() {
    try {
        const response = await fetch(`${API_URL}/bemorlar`);
        const data = await response.json();

        if (data.success) {
            const tbody = document.querySelector('#patients-table tbody');
            tbody.innerHTML = data.data.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.ism} ${p.familiya}</td>
                    <td>${p.jshshir || 'N/A'}</td>
                    <td>${p.telefon || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm" onclick="viewPatient(${p.id})">Ko'rish</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Bemorlarni yuklashda xato:', error);
    }
}

// Load beds (statsionar)
async function loadBeds() {
    try {
        const response = await fetch(`${API_URL}/statsionar/koykalar`);
        const data = await response.json();

        if (data.success) {
            const grid = document.getElementById('beds-grid');
            grid.innerHTML = data.data.map(bed => {
                const statusClass = bed.holati === 'bosh' ? 'available' :
                    bed.holati === 'band' ? 'occupied' : 'unpaid';
                const statusText = bed.holati === 'bosh' ? 'Bo\'sh' :
                    bed.holati === 'band' ? 'Band' : 'To\'lanmagan';

                return `
                    <div class="bed-card ${statusClass}">
                        <div style="font-size: 2rem;">🛏️</div>
                        <h4>Palata ${bed.palata_raqami}</h4>
                        <p>Koyka ${bed.koyka_raqami}</p>
                        <p>Qavat: ${bed.qavat}</p>
                        <span class="badge badge-${statusClass === 'available' ? 'success' : 'warning'}">
                            ${statusText}
                        </span>
                        ${bed.bemor_ismi ? `<p style="margin-top: 8px;"><small>${bed.bemor_ismi}</small></p>` : ''}
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Koykalarni yuklashda xato:', error);
    }
}

// Load queue
async function loadQueue() {
    const container = document.getElementById('queue-list');
    container.innerHTML = '<p class="text-muted">Navbat ma\'lumotlari yuklanmoqda...</p>';
    // Implementation here
}

// Load tests
async function loadTests() {
    const container = document.getElementById('tests-list');
    container.innerHTML = '<p class="text-muted">Tahlillar yuklanmoqda...</p>';
    // Implementation here
}

// Load treatments
async function loadTreatments() {
    const container = document.getElementById('treatments-list');
    container.innerHTML = '<p class="text-muted">Muolajalar yuklanmoqda...</p>';
    // Implementation here
}

// Load employees
async function loadEmployees() {
    const container = document.getElementById('employees-list');
    container.innerHTML = '<p class="text-muted">Xodimlar yuklanmoqda...</p>';
    // Implementation here
}

// Load payments
async function loadPayments() {
    const container = document.getElementById('payments-list');
    container.innerHTML = '<p class="text-muted">To\'lovlar yuklanmoqda...</p>';
    // Implementation here
}

// View patient details
function viewPatient(id) {
    // Show modal with patient details
    alert(`Bemor ID: ${id} - Tafsilotlar yuklanmoqda...`);
}

// Add patient button
document.getElementById('add-patient-btn')?.addEventListener('click', () => {
    alert('Yangi bemor qo\'shish funksiyasi');
});

console.log('Admin panel yuklandi');
