import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Disease from '../models/Disease.js'

dotenv.config()

const diseases = [
  {
    name: 'ORVI (O\'tkir respirator virusli infeksiya)',
    category: 'Nafas yo\'llari',
    can_be_secondary: true,
    diagnoses: [
      { text: 'Burun bitishi va oqishi', is_default: true },
      { text: 'Tomoq og\'rig\'i', is_default: true },
      { text: 'Yo\'tal (quruq yoki nam)', is_default: true },
      { text: 'Tana harorati ko\'tarilishi (37.5-39°C)', is_default: true },
      { text: 'Umumiy holsizlik', is_default: false },
      { text: 'Bosh og\'rig\'i', is_default: false }
    ],
    recommendations: [
      { text: 'Ko\'p suyuqlik ichish (kuniga 1.5-2 litr)', is_default: true },
      { text: 'Karavotda dam olish rejimi', is_default: true },
      { text: 'Xona havosini namlab turish', is_default: false },
      { text: 'Burunni sho\'r suv bilan yuvish', is_default: true },
      { text: '3 kundan so\'ng qayta ko\'rik', is_default: false }
    ]
  },
  {
    name: 'Bronxit (O\'tkir)',
    category: 'Nafas yo\'llari',
    can_be_secondary: true,
    diagnoses: [
      { text: 'Kuchli yo\'tal (dastlab quruq, keyin balg\'amli)', is_default: true },
      { text: 'Ko\'krak qafasida og\'riq', is_default: true },
      { text: 'Nafas olish qiyinlashishi', is_default: false },
      { text: 'Tana harorati ko\'tarilishi', is_default: true },
      { text: 'Umumiy zaiflik', is_default: false }
    ],
    recommendations: [
      { text: 'Ko\'p iliq suyuqlik ichish', is_default: true },
      { text: 'Dam olish rejimi', is_default: true },
      { text: 'Chekishni to\'xtatish', is_default: false },
      { text: 'Ingalyatsiya qilish (kuniga 2-3 marta)', is_default: true },
      { text: '5-7 kundan so\'ng nazorat ko\'rik', is_default: true }
    ]
  },
  {
    name: 'Pnevmoniya (O\'pka yallig\'lanishi)',
    category: 'Nafas yo\'llari',
    can_be_secondary: false,
    diagnoses: [
      { text: 'Yuqori tana harorati (38-40°C)', is_default: true },
      { text: 'Kuchli yo\'tal balg\'am bilan', is_default: true },
      { text: 'Nafas qisishi', is_default: true },
      { text: 'Ko\'krak og\'rig\'i (nafas olganda kuchayadi)', is_default: true },
      { text: 'Terlash va titroq', is_default: false },
      { text: 'Ishtaha yo\'qolishi', is_default: false }
    ],
    recommendations: [
      { text: 'Statsionar davolash tavsiya etiladi', is_default: true },
      { text: 'Antibiotik kursi to\'liq bajarilsin', is_default: true },
      { text: 'Karavotda dam olish', is_default: true },
      { text: 'Ko\'p suyuqlik ichish', is_default: true },
      { text: 'Rentgen nazorat 10-14 kundan so\'ng', is_default: true }
    ]
  },
  {
    name: 'Angina (Tonzillit)',
    category: 'Nafas yo\'llari',
    can_be_secondary: false,
    diagnoses: [
      { text: 'Tomoqda kuchli og\'riq (yutishda kuchayadi)', is_default: true },
      { text: 'Tana harorati 38-40°C', is_default: true },
      { text: 'Bodomsimon bezlar shishgan va qizargan', is_default: true },
      { text: 'Limfa tugunlari kattalashgan', is_default: false },
      { text: 'Bosh og\'rig\'i va umumiy zaiflik', is_default: false }
    ],
    recommendations: [
      { text: 'Antibiotik kursini to\'liq bajarish (7-10 kun)', is_default: true },
      { text: 'Tomoqni iliq tuz eritmasi bilan chayqash', is_default: true },
      { text: 'Yumshoq va iliq ovqat iste\'mol qilish', is_default: true },
      { text: 'Dam olish rejimi', is_default: true },
      { text: '3 kundan so\'ng nazorat', is_default: false }
    ]
  },
  {
    name: 'Gastrit (Oshqozon yallig\'lanishi)',
    category: 'Oshqozon-ichak',
    can_be_secondary: true,
    diagnoses: [
      { text: 'Oshqozon sohasida og\'riq', is_default: true },
      { text: 'Ko\'ngil aynishi va qayt qilish', is_default: true },
      { text: 'Ishtaha buzilishi', is_default: true },
      { text: 'Qorin dam bo\'lishi', is_default: false },
      { text: 'Og\'izda achchiq ta\'m', is_default: false }
    ],
    recommendations: [
      { text: 'Parhez: achchiq, nordon, qovurilgan ovqatlarni cheklash', is_default: true },
      { text: 'Ovqatni kichik porsiyalarda kuniga 5-6 marta iste\'mol qilish', is_default: true },
      { text: 'Spirtli ichimliklar va chekishni to\'xtatish', is_default: true },
      { text: 'Stress darajasini kamaytirish', is_default: false },
      { text: 'Fibrogastroskopiya tavsiya etiladi', is_default: false }
    ]
  },
  {
    name: 'Ich ketish (Diareya)',
    category: 'Oshqozon-ichak',
    can_be_secondary: true,
    diagnoses: [
      { text: 'Suyuq ich ketish (kuniga 3+ marta)', is_default: true },
      { text: 'Qorin og\'rig\'i va buralishi', is_default: true },
      { text: 'Ko\'ngil aynishi', is_default: false },
      { text: 'Tana harorati ko\'tarilishi', is_default: false },
      { text: 'Suvsizlanish belgilari', is_default: true }
    ],
    recommendations: [
      { text: 'Ko\'p suyuqlik ichish (regidron eritmasi)', is_default: true },
      { text: 'BRAT parhezi (banan, guruch, olma, tost)', is_default: true },
      { text: 'Sut mahsulotlarini vaqtincha cheklash', is_default: true },
      { text: 'Qo\'l gigiyenasiga rioya qilish', is_default: false },
      { text: '2 kundan so\'ng yaxshilanmasa qayta murojaat', is_default: true }
    ]
  },
  {
    name: 'Otit (Quloq yallig\'lanishi)',
    category: 'LOR',
    can_be_secondary: true,
    diagnoses: [
      { text: 'Quloqda og\'riq', is_default: true },
      { text: 'Eshitish pasayishi', is_default: true },
      { text: 'Tana harorati ko\'tarilishi', is_default: false },
      { text: 'Quloqdan ajralma kelishi', is_default: false },
      { text: 'Bosh og\'rig\'i', is_default: false }
    ],
    recommendations: [
      { text: 'Quloqqa tomchi dorini vrachning ko\'rsatmasiga ko\'ra ishlatish', is_default: true },
      { text: 'Quloqqa suv tushirmaslik', is_default: true },
      { text: 'Dam olish rejimi', is_default: true },
      { text: '5-7 kundan so\'ng qayta ko\'rik', is_default: true }
    ]
  },
  {
    name: 'Allergik rinit',
    category: 'Allergiya',
    can_be_secondary: true,
    diagnoses: [
      { text: 'Burundan tiniq suyuqlik oqishi', is_default: true },
      { text: 'Burun bitishi', is_default: true },
      { text: 'Aksirish (seriyali)', is_default: true },
      { text: 'Ko\'z qichishi va yosh oqishi', is_default: false },
      { text: 'Burun qichishi', is_default: false }
    ],
    recommendations: [
      { text: 'Allergen bilan kontaktni kamaytirish', is_default: true },
      { text: 'Xonani tez-tez shamollatish va nam tozalash', is_default: true },
      { text: 'Antihistamin preparatlarni muntazam qabul qilish', is_default: true },
      { text: 'Allergolog konsultatsiyasi', is_default: false }
    ]
  },
  {
    name: 'Gipertoniya (Yuqori qon bosimi)',
    category: 'Yurak-qon tomir',
    can_be_secondary: false,
    diagnoses: [
      { text: 'Qon bosimi 140/90 mm.sim.ust dan yuqori', is_default: true },
      { text: 'Bosh og\'rig\'i (ko\'pincha ensa sohasida)', is_default: true },
      { text: 'Bosh aylanishi', is_default: false },
      { text: 'Ko\'z oldida qorong\'ilashish', is_default: false },
      { text: 'Yurak urishi tezlashishi', is_default: false }
    ],
    recommendations: [
      { text: 'Tuz iste\'molini kamaytirish (kuniga 5g gacha)', is_default: true },
      { text: 'Vazn nazorati', is_default: true },
      { text: 'Muntazam jismoniy faollik (kuniga 30 daqiqa yurish)', is_default: true },
      { text: 'Dorilarni to\'xtatmasdan muntazam qabul qilish', is_default: true },
      { text: 'Stress darajasini kamaytirish', is_default: false },
      { text: 'Qon bosimini har kuni o\'lchab yozib borish', is_default: true }
    ]
  },
  {
    name: 'Temir tanqisligi anemiyasi',
    category: 'Qon',
    can_be_secondary: true,
    diagnoses: [
      { text: 'Umumiy holsizlik va tez charchash', is_default: true },
      { text: 'Teri va shilliq qavatlar rangpar', is_default: true },
      { text: 'Bosh aylanishi', is_default: true },
      { text: 'Yurak urishi tezlashishi', is_default: false },
      { text: 'Tirnoqlar mo\'rtlashishi', is_default: false },
      { text: 'Soch to\'kilishi', is_default: false }
    ],
    recommendations: [
      { text: 'Temirga boy ovqatlar iste\'mol qilish (go\'sht, jigar, ko\'katlar)', is_default: true },
      { text: 'Temir preparatlarini vrach ko\'rsatmasiga ko\'ra qabul qilish', is_default: true },
      { text: 'Choy va qahvani ovqat bilan birga ichmaslik', is_default: true },
      { text: 'Vitamin C ga boy mevalar iste\'mol qilish', is_default: true },
      { text: '1 oydan so\'ng qon tahlili qayta topshirish', is_default: true }
    ]
  },
  {
    name: 'Sistit (Siydik pufagi yallig\'lanishi)',
    category: 'Urologiya',
    can_be_secondary: false,
    diagnoses: [
      { text: 'Tez-tez siydik ajratish', is_default: true },
      { text: 'Siydik ajratishda og\'riq va achishish', is_default: true },
      { text: 'Qorin pastki qismida og\'riq', is_default: true },
      { text: 'Siydik loyqalanishi', is_default: false },
      { text: 'Tana harorati ko\'tarilishi', is_default: false }
    ],
    recommendations: [
      { text: 'Ko\'p suyuqlik ichish (kuniga 2-3 litr)', is_default: true },
      { text: 'Antibiotik kursini to\'liq bajarish', is_default: true },
      { text: 'Sovuq o\'tirmaslik', is_default: true },
      { text: 'Siydik tahlilini qayta topshirish (5-7 kundan so\'ng)', is_default: true }
    ]
  },
  {
    name: 'Dermatit (Teri yallig\'lanishi)',
    category: 'Dermatologiya',
    can_be_secondary: true,
    diagnoses: [
      { text: 'Teridagi qizarish', is_default: true },
      { text: 'Qichishish', is_default: true },
      { text: 'Teri quruqligi va po\'stlashishi', is_default: true },
      { text: 'Toshma', is_default: false },
      { text: 'Shishish', is_default: false }
    ],
    recommendations: [
      { text: 'Allergen va ta\'sirlovchi moddalardan qochish', is_default: true },
      { text: 'Namlovchi kremlardan foydalanish', is_default: true },
      { text: 'Issiq suv bilan cho\'milmaslik', is_default: true },
      { text: 'Paxta kiyimlar kiyish', is_default: false },
      { text: 'Dermatolog konsultatsiyasi', is_default: false }
    ]
  }
]

const seedDiseases = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB ga ulandi')

    // Oldingi ma'lumotlarni o'chirish
    await Disease.deleteMany({})
    console.log('Eski kasalliklar o\'chirildi')

    // Yangi ma'lumotlarni kiritish
    const result = await Disease.insertMany(diseases)
    console.log(`${result.length} ta kasallik kiritildi:`)
    result.forEach(d => console.log(`  ✓ ${d.name} (${d.diagnoses.length} tashxis, ${d.recommendations.length} maslahat)`))

    await mongoose.disconnect()
    console.log('\nSeed muvaffaqiyatli yakunlandi!')
    process.exit(0)
  } catch (error) {
    console.error('Seed xatolik:', error.message)
    process.exit(1)
  }
}

seedDiseases()
