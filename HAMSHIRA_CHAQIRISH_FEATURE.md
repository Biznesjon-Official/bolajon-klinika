# Hamshirani Chaqirish Funksiyasi

## Qilingan o'zgarishlar:

### 1. Bot menyusiga "Hamshirani chaqirish" tugmasi qo'shildi
- Bemor botda "🔔 Hamshirani chaqirish" tugmasini ko'radi
- Tugma bosil

ganda avtomatik hamshiralarga xabar boradi

### 2. Bemorning xona ma'lumotlarini olish
- Bemor statsionarda yoki ambulatorxonada bo'lishi mumkin
- API ikkalasini ham tekshiradi:
  - Admission model (statsionar)
  - Bed model (ambulator va statsionar)
- Xona raqami, qavat, ko'rpa raqami va bo'lim ma'lumotlari olinadi

### 3. Hamshiralarga xabar yuborish
- Barcha faol hamshiralarga avtomatik xabar yuboriladi
- Xabar diqqat jalb qiluvchi formatda:
  ```
  🚨🔔 BEMOR CHAQIRYAPTI! 🔔🚨
  ━━━━━━━━━━━━━━━━━━━━
  
  👤 Bemor: [Ism Familiya]
  📋 Bemor №: [Raqam]
  
  🏥 Bo'lim: [Statsionar/Ambulatorxona]
  🚪 Xona: [Raqam] ([Qavat]-qavat)
  🛏 Ko'rpa: [Raqam]
  
  ━━━━━━━━━━━━━━━━━━━━
  ⏰ Vaqt: [HH:MM]
  
  ⚡️ TEZKOR YORDAM KERAK! ⚡️
  💡 Iltimos, bemorga darhol yordam bering!
  ```

### 4. Bemorga tasdiq xabari
- Bemor hamshiralar chaqirilganini ko'radi
- Xona va ko'rpa ma'lumotlari ko'rsatiladi
- Hamshira tez orada kelishi haqida xabar

## API Endpoints:

### GET /api/v1/bot/patient/:patientId/admission
- Bemorning xona va ko'rpa ma'lumotlarini olish
- Statsionar va ambulatorxonani tekshiradi
- Response:
  ```json
  {
    "success": true,
    "data": {
      "location": "inpatient" | "ambulator",
      "room_number": 101,
      "room_floor": 2,
      "bed_number": 3,
      "department": "Statsionar" | "Ambulatorxona"
    }
  }
  ```

### POST /api/v1/bot/call-nurse
- Barcha hamshiralarga xabar yuborish
- Request body:
  ```json
  {
    "patientId": "...",
    "patientName": "...",
    "patientNumber": "...",
    "roomNumber": 101,
    "roomFloor": 2,
    "bedNumber": 3,
    "department": "Statsionar"
  }
  ```

## Test qilish:

1. Bemorni statsionarga yoki ambulatorxonaga joylashtiring
2. Bemor botga kirsin (8-xonali kod bilan)
3. "🔔 Hamshirani chaqirish" tugmasini bossin
4. Hamshiralarga avtomatik xabar boradi
5. Bemor tasdiq xabarini ko'radi

## Xususiyatlar:
- ✅ Statsionar va ambulatorxonani qo'llab-quvvatlaydi
- ✅ Xona, qavat, ko'rpa ma'lumotlarini ko'rsatadi
- ✅ Diqqat jalb qiluvchi format
- ✅ Barcha hamshiralarga avtomatik yuboriladi
- ✅ Telegram orqali real-time xabarnoma
