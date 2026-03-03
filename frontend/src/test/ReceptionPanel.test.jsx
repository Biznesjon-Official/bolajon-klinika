import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ──────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Test Admin', role_name: 'receptionist' } })
}))

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn()
  }),
  Toaster: () => null
}))

vi.mock('../services/prescriptionService', () => ({
  prescriptionService: {
    getUrgentPending: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}))

vi.mock('../services/admissionRequestService', () => ({
  default: {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    reject: vi.fn().mockResolvedValue({ success: true }),
    approve: vi.fn().mockResolvedValue({ success: true })
  }
}))

vi.mock('../services/ambulatorInpatientService', () => ({
  default: {
    getRooms: vi.fn().mockResolvedValue({ success: true, data: [] }),
    createAdmission: vi.fn().mockResolvedValue({ success: true })
  }
}))

vi.mock('../services/inpatientRoomService', () => ({
  default: { getRooms: vi.fn().mockResolvedValue({ success: true, data: [] }) }
}))

vi.mock('../services/patientService', () => ({
  default: {
    getPatients: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}))

vi.mock('../services/laboratoryService', () => ({
  default: {
    getTests: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}))

vi.mock('../services/billingService', () => ({
  default: { printAdmissionReceipt: vi.fn().mockResolvedValue(undefined) }
}))

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

vi.mock('../components/laboratory/NewOrderModal', () => ({
  default: () => null
}))

// ──────────────────────────────────────────────────────────
// Import mocked modules
// ──────────────────────────────────────────────────────────
import admissionRequestService from '../services/admissionRequestService'
import ambulatorInpatientService from '../services/ambulatorInpatientService'
import billingService from '../services/billingService'
import toast from 'react-hot-toast'
import ReceptionPanel from '../pages/ReceptionPanel'

const renderPanel = () =>
  render(<MemoryRouter><ReceptionPanel /></MemoryRouter>)

const SAMPLE_REQUEST = {
  _id: 'req1',
  admission_type: 'ambulator',
  diagnosis: 'Bronxit',
  reason: 'Davolash',
  patient_id: { _id: 'p1', first_name: 'Ali', last_name: 'Valiyev', patient_number: 'B-0001' },
  doctor_id: { first_name: 'Doktor', last_name: 'Eshmatov' }
}

// ──────────────────────────────────────────────────────────
describe('ReceptionPanel', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    admissionRequestService.getAll.mockResolvedValue({ success: true, data: [] })
    admissionRequestService.approve.mockResolvedValue({ success: true })
    admissionRequestService.reject.mockResolvedValue({ success: true })
    ambulatorInpatientService.getRooms.mockResolvedValue({ success: true, data: [] })
    ambulatorInpatientService.createAdmission.mockResolvedValue({ success: true })
    billingService.printAdmissionReceipt.mockResolvedValue(undefined)
  })

  // ── Render ──────────────────────────────────────────────
  describe('Render', () => {
    it('renders panel header', () => {
      renderPanel()
      expect(screen.getByText('QABULXONA PANELI')).toBeInTheDocument()
    })

    it('renders welcome message with user name', () => {
      renderPanel()
      expect(screen.getByText(/Test Admin/)).toBeInTheDocument()
    })

    it('renders all 4 stats cards', () => {
      renderPanel()
      expect(screen.getByText('Bugungi bemorlar')).toBeInTheDocument()
      expect(screen.getByText('Navbatda')).toBeInTheDocument()
      expect(screen.getByText('Yakunlangan')).toBeInTheDocument()
      expect(screen.getByText(/Bugungi tushum/)).toBeInTheDocument()
    })

    it('renders quick action buttons', () => {
      renderPanel()
      expect(screen.getByText('Ambulatorga yotqizish')).toBeInTheDocument()
      expect(screen.getByText('Statsionarga yotqizish')).toBeInTheDocument()
      expect(screen.getByText('Lab Buyurtma')).toBeInTheDocument()
    })
  })

  // ── Mount data loading ───────────────────────────────────
  describe('On mount', () => {
    it('calls getAll with pending status', async () => {
      renderPanel()
      await waitFor(() => {
        expect(admissionRequestService.getAll).toHaveBeenCalledWith({ status: 'pending' })
      })
    })

    it('shows admission requests section when data exists', async () => {
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [SAMPLE_REQUEST] })
      renderPanel()
      await waitFor(() => {
        expect(screen.getByText("Statsionar so'rovlari")).toBeInTheDocument()
      })
      expect(screen.getByText('Ali Valiyev')).toBeInTheDocument()
      expect(screen.getByText('Bronxit')).toBeInTheDocument()
    })

    it('hides admission section when no requests', async () => {
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [] })
      renderPanel()
      await waitFor(() => expect(admissionRequestService.getAll).toHaveBeenCalled())
      expect(screen.queryByText("Statsionar so'rovlari")).not.toBeInTheDocument()
    })
  })

  // ── handleRejectAdmissionRequest ────────────────────────
  describe('handleRejectAdmissionRequest', () => {
    it('calls reject service after confirm', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [SAMPLE_REQUEST] })
      renderPanel()

      await waitFor(() => screen.getByText("Statsionar so'rovlari"))
      // Reject button text is "Rad" (with icon)
      fireEvent.click(screen.getByText('Rad'))

      await waitFor(() => {
        expect(admissionRequestService.reject).toHaveBeenCalledWith('req1', '')
      })
      expect(toast.success).toHaveBeenCalledWith('Rad etildi')
    })

    it('does NOT call reject when confirm cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [SAMPLE_REQUEST] })
      renderPanel()

      await waitFor(() => screen.getByText("Statsionar so'rovlari"))
      fireEvent.click(screen.getByText('Rad'))

      expect(admissionRequestService.reject).not.toHaveBeenCalled()
    })

    it('reloads admission requests after reject', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [SAMPLE_REQUEST] })
      renderPanel()

      await waitFor(() => screen.getByText('Rad'))
      fireEvent.click(screen.getByText('Rad'))

      await waitFor(() => {
        // Called once on mount + once after reject
        expect(admissionRequestService.getAll).toHaveBeenCalledTimes(2)
      })
    })
  })

  // ── handleOpenAdmitFromRequest ───────────────────────────
  describe('handleOpenAdmitFromRequest', () => {
    it('opens admit modal when Yotqizish clicked', async () => {
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [SAMPLE_REQUEST] })
      renderPanel()

      await waitFor(() => screen.getByText('Ali Valiyev'))
      // Use role query to find the Yotqizish button in the request card
      const yotqizishBtn = screen.getByRole('button', { name: /Yotqizish/ })
      fireEvent.click(yotqizishBtn)

      // Modal is open when patient input and Bekor qilish appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ism yoki raqam...')).toBeInTheDocument()
        expect(screen.getByText('Bekor qilish')).toBeInTheDocument()
      })
    })

    it('loads ambulator rooms for ambulator type', async () => {
      ambulatorInpatientService.getRooms.mockResolvedValue({
        success: true,
        data: [{ _id: 'r1', room_number: '101', room_name: 'Ambulator 1', beds: [] }]
      })
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [SAMPLE_REQUEST] })
      renderPanel()

      await waitFor(() => screen.getByText('Ali Valiyev'))
      const yotqizishBtns = screen.getAllByText('Yotqizish')
      fireEvent.click(yotqizishBtns[0])

      await waitFor(() => {
        expect(ambulatorInpatientService.getRooms).toHaveBeenCalled()
      })
    })

    it('loads inpatient rooms for inpatient type', async () => {
      const { default: inpatientRoomService } = await import('../services/inpatientRoomService')
      const inpatientReq = { ...SAMPLE_REQUEST, _id: 'req-inp', admission_type: 'inpatient' }
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [inpatientReq] })
      renderPanel()

      await waitFor(() => screen.getByText('Ali Valiyev'))
      const yotqizishBtns = screen.getAllByText('Yotqizish')
      fireEvent.click(yotqizishBtns[0])

      await waitFor(() => {
        expect(inpatientRoomService.getRooms).toHaveBeenCalled()
      })
    })

    it('pre-fills patient from request', async () => {
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [SAMPLE_REQUEST] })
      renderPanel()

      await waitFor(() => screen.getByText('Ali Valiyev'))
      const yotqizishBtns = screen.getAllByText('Yotqizish')
      fireEvent.click(yotqizishBtns[0])

      await waitFor(() => {
        // Patient input should be pre-filled with patient name
        const input = screen.getByPlaceholderText('Ism yoki raqam...')
        expect(input.value).toContain('Ali')
      })
    })
  })

  // ── Submit button disabled state ─────────────────────────
  describe('Submit button disabled state', () => {
    it('submit button is disabled when modal opens (no patient or bed)', async () => {
      // Open modal via quick action (no pre-filled patient)
      renderPanel()
      fireEvent.click(screen.getByText('Ambulatorga yotqizish'))

      await waitFor(() => expect(ambulatorInpatientService.getRooms).toHaveBeenCalled())

      // Find the modal submit button (not the section header)
      const submitBtns = screen.getAllByText('Yotqizish')
      const modalSubmit = submitBtns[submitBtns.length - 1]
      expect(modalSubmit).toBeDisabled()
    })
  })

  // ── handleOpenAdmitModal — quick actions ─────────────────
  describe('Quick action admit modal', () => {
    it('opens ambulator modal from quick action button', async () => {
      renderPanel()
      fireEvent.click(screen.getByText('Ambulatorga yotqizish'))

      await waitFor(() => {
        expect(ambulatorInpatientService.getRooms).toHaveBeenCalled()
      })
    })

    it('closes modal when Bekor qilish clicked', async () => {
      renderPanel()
      fireEvent.click(screen.getByText('Ambulatorga yotqizish'))
      await waitFor(() => expect(ambulatorInpatientService.getRooms).toHaveBeenCalled())

      // Modal should show patient input
      expect(screen.getByPlaceholderText('Ism yoki raqam...')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Bekor qilish'))
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Ism yoki raqam...')).not.toBeInTheDocument()
      })
    })
  })

  // ── Patient search ────────────────────────────────────────
  describe('Patient search in admit modal', () => {
    it('does NOT call getPatients for single char input', async () => {
      const { default: patientService } = await import('../services/patientService')
      renderPanel()
      fireEvent.click(screen.getByText('Ambulatorga yotqizish'))
      await waitFor(() => expect(ambulatorInpatientService.getRooms).toHaveBeenCalled())

      const input = screen.getByPlaceholderText('Ism yoki raqam...')
      await userEvent.type(input, 'A')
      expect(patientService.getPatients).not.toHaveBeenCalled()
    })

    it('calls getPatients when input has 2+ chars', async () => {
      const { default: patientService } = await import('../services/patientService')
      renderPanel()
      fireEvent.click(screen.getByText('Ambulatorga yotqizish'))
      await waitFor(() => expect(ambulatorInpatientService.getRooms).toHaveBeenCalled())

      const input = screen.getByPlaceholderText('Ism yoki raqam...')
      await userEvent.type(input, 'Al')

      await waitFor(() => {
        expect(patientService.getPatients).toHaveBeenCalledWith({ search: 'Al', limit: 5 })
      })
    })
  })

  // ── printAdmissionReceipt ────────────────────────────────
  describe('printAdmissionReceipt', () => {
    it('is NOT called on initial mount', async () => {
      renderPanel()
      await waitFor(() => expect(admissionRequestService.getAll).toHaveBeenCalled())
      expect(billingService.printAdmissionReceipt).not.toHaveBeenCalled()
    })

    it('is NOT called before form submission', async () => {
      admissionRequestService.getAll.mockResolvedValue({ success: true, data: [SAMPLE_REQUEST] })
      renderPanel()
      await waitFor(() => screen.getByText('Ali Valiyev'))
      // Just open modal, don't submit
      const yotqizishBtns = screen.getAllByText('Yotqizish')
      fireEvent.click(yotqizishBtns[0])
      await waitFor(() => expect(ambulatorInpatientService.getRooms).toHaveBeenCalled())
      expect(billingService.printAdmissionReceipt).not.toHaveBeenCalled()
    })
  })
})
