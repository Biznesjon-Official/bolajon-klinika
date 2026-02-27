/**
 * Database Clean Script
 * Removes ALL data except admin user
 * Usage: node scripts/clean-db.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const MONGODB_URI = process.env.MONGODB_URI

async function cleanDB() {
  console.log('========================================')
  console.log('  DATABASE CLEAN — faqat admin qoladi')
  console.log('========================================\n')

  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    })
    console.log('✅ MongoDB ulandi:', mongoose.connection.db.databaseName)

    const db = mongoose.connection.db

    // Admin ni saqlab qolish uchun avval topamiz
    const staffCol = db.collection('staffs')
    const admin = await staffCol.findOne({ role: 'admin' })

    if (!admin) {
      console.log('⚠️  Admin topilmadi! Barcha kolleksiyalar tozalanadi.')
    } else {
      console.log(`✅ Admin topildi: ${admin.username} (${admin.first_name} ${admin.last_name})`)
    }

    // Barcha kolleksiyalarni olish
    const collections = await db.listCollections().toArray()
    const skipCollections = ['roles'] // roles collection saqlanadi

    for (const col of collections) {
      const colName = col.name

      if (skipCollections.includes(colName)) {
        console.log(`⏭️  ${colName} — o'tkazildi`)
        continue
      }

      if (colName === 'staffs' && admin) {
        // Staff dan faqat admin qoladi
        const result = await db.collection(colName).deleteMany({ _id: { $ne: admin._id } })
        console.log(`🗑️  ${colName} — ${result.deletedCount} ta o'chirildi (admin qoldi)`)
      } else if (colName === 'staffs' && !admin) {
        // Admin yo'q bo'lsa hammasi o'chadi
        const result = await db.collection(colName).deleteMany({})
        console.log(`🗑️  ${colName} — ${result.deletedCount} ta o'chirildi`)
      } else {
        // Qolgan barcha kolleksiyalar to'liq tozalanadi
        const result = await db.collection(colName).deleteMany({})
        console.log(`🗑️  ${colName} — ${result.deletedCount} ta o'chirildi`)
      }
    }

    console.log('\n========================================')
    console.log('  ✅ DB TOZALANDI! Faqat admin qoldi.')
    if (admin) {
      console.log(`  Login: ${admin.username} / (parolingiz)`)
    }
    console.log('========================================\n')

  } catch (error) {
    console.error('\n❌ XATO:', error.message)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

cleanDB()
