// API base URL
const API_URL = 'http://localhost:3000/api';

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', () => {
    loadDoctors();
    setupChatbot();
    setupForm();
});

// Shifokorlarni yuklash
async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}/xodimlar/shifokorlar/royxat`);
        const data = await response.json();

        if (data.success) {
            const container = document.getElementById('doctors-container');
            const select = document.querySelector('#appointment-form select');

            data.data.forEach(doctor => {
                // Doctors grid uchun
                const card = document.createElement('div');
                card.className = 'doctor-card';
                card.innerHTML = `
                    <div class="doctor-info">
                        <h3>${doctor.ism} ${doctor.familiya}</h3>
                        <p class="specialty">Shifokor</p>
                        <p>${doctor.telefon || ''}</p>
                    </div>
                `;
                container.appendChild(card);

                // Form select uchun
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `${doctor.ism} ${doctor.familiya}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Shifokorlarni yuklashda xato:', error);
    }
}

// Chatbot sozlash
function setupChatbot() {
    const chatbot = document.getElementById('chatbot');
    const openBtn = document.getElementById('open-chatbot');
    const closeBtn = document.getElementById('close-chatbot');
    const sendBtn = document.getElementById('send-message');
    const input = document.getElementById('chatbot-input-field');

    openBtn.addEventListener('click', () => {
        chatbot.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        chatbot.classList.remove('active');
    });

    sendBtn.addEventListener('click', () => sendMessage());
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Xabar yuborish (AI chatbot)
async function sendMessage() {
    const input = document.getElementById('chatbot-input-field');
    const messagesContainer = document.getElementById('chatbot-messages');
    const message = input.value.trim();

    if (!message) return;

    // Foydalanuvchi xabarini ko'rsatish
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.textContent = message;
    messagesContainer.appendChild(userMsg);

    input.value = '';

    // AI javobini olish (bu yerda oddiy javoblar, real AI uchun API kerak)
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        botMsg.textContent = getAIResponse(message);
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 500);
}

// AI javobi (sodda versiya, real ChatGPT/Groq API integratsiya kerak)
function getAIResponse(message) {
    message = message.toLowerCase();

    if (message.includes('narx') || message.includes('pul')) {
        return 'Narxlar xizmatlarga qarab turlicha. Aniq ma\'lumot uchun +998 (71) 123-45-67 raqamiga qo\'ng\'iroq qiling.';
    } else if (message.includes('vaqt') || message.includes('ish')) {
        return 'Biz Dushanba-Juma 8:00-20:00, Shanba 9:00-15:00 gacha ishlaymiz.';
    } else if (message.includes('shifokor')) {
        return 'Bizda tajribali shifokorlar bor. Yuqorida "Shifokorlar" bo\'limida ko\'rishingiz mumkin.';
    } else if (message.includes('navbat') || message.includes('yozil')) {
        return 'Navbatga yozilish uchun pastdagi formani to\'ldiring yoki +998 (71) 123-45-67 raqamiga qo\'ng\'iroq qiling.';
    } else if (message.includes('manzil') || message.includes('joy')) {
        return 'Bizning manzilimiz: Toshkent shahar, Yunusobod tumani.';
    } else if (message.includes('tahlil')) {
        return 'Biz barcha turdagi laboratoriya tahlillarini olib boramiz. Natijalar telegram bot orqali ham keladi.';
    } else {
        return 'Savolingiz bo\'yicha aniq ma\'lumot uchun +998 (71) 123-45-67 raqamiga qo\'ng\'iroq qiling yoki navbatga yozilib tashrif buyuring.';
    }
}

// Form sozlash
function setupForm() {
    const form = document.getElementById('appointment-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            ism: form.elements[0].value,
            telefon: form.elements[1].value,
            shifokor_id: form.elements[2].value,
            izoh: form.elements[3].value
        };

        // Bu yerda backend ga yuborish kerak
        alert('Arizangiz qabul qilindi! Tez orada siz bilan bog\'lanamiz.');
        form.reset();
    });
}

// Smooth scroll
function scrollTo(selector) {
    document.querySelector(selector).scrollIntoView({ behavior: 'smooth' });
}
