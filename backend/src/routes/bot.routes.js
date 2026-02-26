import express from 'express'
import Staff from '../models/Staff.js'
import Patient from '../models/Patient.js'

const router = express.Router()

// Bot API key authentication middleware
const botAuth = (req, res, next) => {
  const apiKey = req.headers['x-bot-api-key']
  if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  next()
}

// Apply bot auth to all routes
router.use(botAuth)

/**
 * GET /api/v1/bot/staff/by-access-code/:code
 */
router.get('/staff/by-access-code/:code', async (req, res) => {
  try {
    const { code } = req.params

    if (!code || !/^LI\d{8}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Noto'g'ri kod formati"
      })
    }

    const staff = await Staff.findOne({ access_code: code })

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Xodim topilmadi' })
    }

    res.json({
      success: true,
      data: {
        _id: staff._id,
        id: staff._id,
        first_name: staff.first_name,
        last_name: staff.last_name,
        role: staff.role,
        department: staff.department,
        phone: staff.phone,
        email: staff.email,
        access_code: staff.access_code,
        telegram_chat_id: staff.telegram_chat_id,
        telegram_username: staff.telegram_username,
        telegram_notifications_enabled: staff.telegram_notifications_enabled
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * PUT /api/v1/bot/staff/telegram/:id
 */
router.put('/staff/telegram/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { telegram_chat_id, telegram_username, telegram_notifications_enabled } = req.body

    const staff = await Staff.findByIdAndUpdate(
      id,
      { telegram_chat_id, telegram_username, telegram_notifications_enabled },
      { new: true }
    )

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Xodim topilmadi' })
    }

    res.json({
      success: true,
      message: "Telegram ma'lumotlari yangilandi",
      data: {
        telegram_chat_id: staff.telegram_chat_id,
        telegram_username: staff.telegram_username,
        telegram_notifications_enabled: staff.telegram_notifications_enabled
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * GET /api/v1/bot/patients/by-access-code/:code
 */
router.get('/patients/by-access-code/:code', async (req, res) => {
  try {
    const { code } = req.params

    if (!code || !/^\d{8}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Noto'g'ri kod formati"
      })
    }

    const patient = await Patient.findOne({ access_code: code })

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Bemor topilmadi' })
    }

    res.json({
      success: true,
      data: {
        _id: patient._id,
        id: patient._id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        patient_number: patient.patient_number,
        phone: patient.phone,
        access_code: patient.access_code,
        telegram_chat_id: patient.telegram_chat_id,
        telegram_username: patient.telegram_username,
        telegram_notifications_enabled: patient.telegram_notifications_enabled
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * PUT /api/v1/bot/patients/telegram/:id
 */
router.put('/patients/telegram/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { telegram_chat_id, telegram_username, telegram_notifications_enabled } = req.body

    const patient = await Patient.findByIdAndUpdate(
      id,
      { telegram_chat_id, telegram_username, telegram_notifications_enabled },
      { new: true }
    )

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Bemor topilmadi' })
    }

    res.json({
      success: true,
      message: "Telegram ma'lumotlari yangilandi",
      data: {
        telegram_chat_id: patient.telegram_chat_id,
        telegram_username: patient.telegram_username,
        telegram_notifications_enabled: patient.telegram_notifications_enabled
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * GET /api/v1/bot/patient/:patientId/admission
 */
router.get('/patient/:patientId/admission', async (req, res) => {
  try {
    const { patientId } = req.params

    const Admission = (await import('../models/Admission.js')).default
    const Bed = (await import('../models/Bed.js')).default

    // Check inpatient admission
    const admission = await Admission.findOne({
      patient_id: patientId,
      status: 'active'
    })
      .populate('room_id', 'room_number floor department')
      .populate('bed_id', 'bed_number')
      .lean()

    if (admission) {
      return res.json({
        success: true,
        data: {
          location: 'inpatient',
          room_number: admission.room_id?.room_number || admission.room_number,
          room_floor: admission.room_id?.floor,
          bed_number: admission.bed_id?.bed_number || admission.bed_number,
          department: admission.room_id?.department === 'inpatient' ? 'Statsionar' : 'Ambulatorxona'
        }
      })
    }

    // Check bed assignment
    const bed = await Bed.findOne({
      current_patient_id: patientId,
      status: 'occupied'
    })
      .populate('room_id', 'room_number floor department')
      .lean()

    if (bed) {
      return res.json({
        success: true,
        data: {
          location: bed.room_id?.department === 'ambulator' ? 'ambulator' : 'inpatient',
          room_number: bed.room_id?.room_number,
          room_floor: bed.room_id?.floor,
          bed_number: bed.bed_number,
          department: bed.room_id?.department === 'ambulator' ? 'Ambulatorxona' : 'Statsionar'
        }
      })
    }

    return res.status(404).json({
      success: false,
      message: 'Bemor hech qayerda topilmadi'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * POST /api/v1/bot/call-nurse
 */
router.post('/call-nurse', async (req, res) => {
  try {
    const { patientId, patientName, patientNumber, roomNumber, roomFloor, bedNumber, department } = req.body

    if (!patientId || !patientName) {
      return res.status(400).json({ success: false, message: 'patientId va patientName majburiy' })
    }

    const TreatmentSchedule = (await import('../models/TreatmentSchedule.js')).default

    const treatments = await TreatmentSchedule.find({
      patient_id: patientId,
      status: 'pending'
    })
      .populate('nurse_id', 'first_name last_name telegram_chat_id telegram_username telegram_notifications_enabled')
      .sort({ created_at: -1 })
      .limit(10)
      .lean()

    // Collect unique nurses
    const nurseMap = new Map()
    treatments.forEach(treatment => {
      if (treatment.nurse_id?.telegram_chat_id && treatment.nurse_id?.telegram_notifications_enabled) {
        nurseMap.set(treatment.nurse_id._id.toString(), treatment.nurse_id)
      }
    })

    const nurses = Array.from(nurseMap.values())

    // WebSocket notification
    if (global.io) {
      global.io.emit('nurse-call', {
        patientId, patientName, patientNumber,
        roomNumber, roomFloor, bedNumber, department,
        timestamp: new Date()
      })
    }

    if (nurses.length === 0) {
      // Fallback: all nurses with telegram
      const allNurses = await Staff.find({
        role: 'nurse',
        status: 'active',
        telegram_chat_id: { $exists: true, $ne: null },
        telegram_notifications_enabled: true
      }).lean()

      if (allNurses.length === 0) {
        return res.json({
          success: true,
          message: 'Telegram ulangan hamshiralar topilmadi',
          data: { notified_count: 0 }
        })
      }

      nurses.push(...allNurses)
    }

    const botToken = process.env.BOT_TOKEN
    if (!botToken) {
      return res.json({
        success: true,
        message: 'BOT_TOKEN sozlanmagan',
        data: { notified_count: 0 }
      })
    }

    const TelegramBot = (await import('node-telegram-bot-api')).default
    const bot = new TelegramBot(botToken)

    let message = `🚨🔔 *BEMOR CHAQIRYAPTI!* 🔔🚨\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`
    message += `👤 *Bemor:* ${patientName}\n`
    message += `📋 *Bemor №:* ${patientNumber}\n\n`
    if (department) message += `🏥 *Bo'lim:* ${department}\n`
    message += `🚪 *Xona:* ${roomNumber}\n`
    message += `🛏 *Ko'rpa:* ${bedNumber}\n\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n`
    message += `⏰ *Vaqt:* ${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}\n\n`
    message += `⚡️ *TEZKOR YORDAM KERAK!* ⚡️\n`
    message += `💡 Iltimos, bemorga darhol yordam bering!`

    let notifiedCount = 0
    for (const nurse of nurses) {
      try {
        await bot.sendMessage(nurse.telegram_chat_id, message, { parse_mode: 'Markdown' })
        notifiedCount++
      } catch (_) {
        // Telegram send failed silently
      }
    }

    res.json({
      success: true,
      message: `${notifiedCount} ta hamshiraga xabar yuborildi`,
      data: { notified_count: notifiedCount, total_nurses: nurses.length }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * POST /api/v1/bot/send-message-to-staff
 */
router.post('/send-message-to-staff', async (req, res) => {
  try {
    const { staffId, subject, content, senderName, senderRole } = req.body

    if (!staffId || !content) {
      return res.status(400).json({ success: false, message: 'staffId va content majburiy' })
    }

    const staff = await Staff.findById(staffId)
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Xodim topilmadi' })
    }

    const Communication = (await import('../models/Communication.js')).default

    const communication = new Communication({
      recipient_id: staffId,
      recipient_type: 'staff',
      recipient_name: `${staff.first_name} ${staff.last_name}`,
      recipient_phone: staff.phone,
      sender_name: senderName,
      sender_role: senderRole,
      subject,
      content,
      channel: 'telegram',
      status: 'pending'
    })

    await communication.save()

    if (staff.telegram_chat_id && staff.telegram_notifications_enabled) {
      const botToken = process.env.BOT_TOKEN
      if (botToken) {
        try {
          const TelegramBot = (await import('node-telegram-bot-api')).default
          const bot = new TelegramBot(botToken)

          let message = '📨 *Yangi xabar!*\n\n'
          if (subject) message += `📌 *${subject}*\n\n`
          message += `💬 ${content}\n\n`
          if (senderName) {
            message += `👤 Yuboruvchi: ${senderName}`
            if (senderRole) message += ` (${senderRole})`
            message += '\n'
          }
          message += `\n📅 ${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`

          await bot.sendMessage(staff.telegram_chat_id, message, { parse_mode: 'Markdown' })
          communication.status = 'sent'
          communication.sent_at = new Date()
        } catch (telegramError) {
          communication.status = 'failed'
          communication.error_message = telegramError.message
        }
        await communication.save()
      }
    }

    res.json({
      success: true,
      message: 'Xabar yuborildi',
      data: { id: communication._id, status: communication.status }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * GET /api/v1/bot/messages/staff/:staffId
 */
router.get('/messages/staff/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params
    const Communication = (await import('../models/Communication.js')).default

    const messages = await Communication.find({
      recipient_id: staffId,
      recipient_type: 'staff'
    })
      .sort({ created_at: -1 })
      .limit(20)
      .lean()

    res.json({
      success: true,
      data: messages.map(msg => ({
        id: msg._id,
        subject: msg.subject,
        content: msg.content,
        sender_name: msg.sender_name,
        sender_role: msg.sender_role,
        status: msg.status,
        created_at: msg.created_at || msg.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * GET /api/v1/bot/messages/patient/:patientId
 */
router.get('/messages/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const Communication = (await import('../models/Communication.js')).default

    const messages = await Communication.find({
      recipient_id: patientId,
      recipient_type: 'patient'
    })
      .sort({ created_at: -1 })
      .limit(20)
      .lean()

    res.json({
      success: true,
      data: messages.map(msg => ({
        id: msg._id,
        subject: msg.subject,
        content: msg.content,
        sender_name: msg.sender_name,
        sender_role: msg.sender_role,
        status: msg.status,
        created_at: msg.created_at || msg.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

/**
 * GET /api/v1/bot/tasks/staff/:staffId
 */
router.get('/tasks/staff/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params
    const Task = (await import('../models/Task.js')).default

    const tasks = await Task.find({
      assigned_to: staffId,
      status: { $in: ['pending', 'in_progress', 'completed', 'verified'] }
    })
      .populate('created_by', 'first_name last_name')
      .sort({ created_at: -1 })
      .limit(50)
      .lean()

    res.json({
      success: true,
      data: tasks.map(task => ({
        id: task._id,
        title: task.title,
        description: task.description,
        task_type: task.task_type,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        location_details: task.location_details,
        started_at: task.started_at,
        completed_at: task.completed_at,
        verified_at: task.verified_at,
        completion_notes: task.completion_notes,
        rejection_reason: task.rejection_reason,
        creator_name: task.created_by ? `${task.created_by.first_name} ${task.created_by.last_name}` : 'N/A',
        created_at: task.created_at
      }))
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server xatosi' })
  }
})

export default router
