# Auto-Discharge Guide (Ambulatorxona)

## Feature
When a nurse completes ALL treatments for a patient in **ambulatorxona** (outpatient), the system automatically:
1. Discharges the patient
2. Releases the bed
3. Updates room status to available

## How It Works

### Trigger
Auto-discharge happens when:
- Treatment is completed via `/api/v1/nurse/treatments/:id/complete`
- Patient has an active admission with `admission_type: 'outpatient'`
- ALL pending treatments (Tasks + TreatmentSchedules) for that patient = 0

### Process
1. **Check admission type**: Only for `outpatient` (ambulatorxona)
2. **Count pending treatments**: Both Task and TreatmentSchedule with `status: 'pending'`
3. **If all completed**:
   - Update admission: `status: 'discharged'`, set `discharge_date`, calculate `total_days`
   - Release bed: `status: 'available'`, clear `current_patient_id` and `current_admission_id`
   - Update room: If any bed is available, set room `status: 'available'`

### Code Location
**backend/src/routes/nurse.routes.js** - Line ~540-600

```javascript
// ===== AMBULATORXONADA AVTOMATIK CHIQARISH =====
if (treatment.patient_id) {
  const patientId = treatment.patient_id._id || treatment.patient_id;
  
  const activeAdmission = await Admission.findOne({
    patient_id: patientId,
    status: 'active'
  });
  
  if (activeAdmission && activeAdmission.admission_type === 'outpatient') {
    // Count pending treatments
    const [pendingTasks, pendingSchedules] = await Promise.all([
      Task.countDocuments({ patient_id: patientId, status: 'pending' }),
      TreatmentSchedule.countDocuments({ patient_id: patientId, status: 'pending' })
    ]);
    
    const totalPending = pendingTasks + pendingSchedules;
    
    if (totalPending === 0) {
      // Auto-discharge logic...
    }
  }
}
```

## Debugging
If auto-discharge is not working, check backend logs for:

```
=== CHECKING FOR AUTO-DISCHARGE (AMBULATORXONA) ===
Patient ID: ...
Admission ID: ...
Pending treatments: 0
✅ All treatments completed! Auto-discharging patient from ambulatorxona...
✅ Bed released: X
✅ Patient auto-discharged from ambulatorxona
```

If these logs don't appear:
1. Check if admission exists and is active
2. Check if `admission_type` is 'outpatient'
3. Check if there are still pending treatments
4. Verify `treatment.patient_id` is populated

## Important Notes
- **Only for ambulatorxona** (outpatient admissions)
- **Stasionar** (inpatient) does NOT auto-discharge - requires manual discharge
- Auto-discharge happens immediately after last treatment is completed
- Bed is freed automatically - no manual action needed
- Room status updates if any bed becomes available

## Testing
1. Admit patient to ambulatorxona
2. Create 1 URGENT prescription
3. Nurse completes the treatment
4. Check backend logs for auto-discharge messages
5. Verify bed is freed in frontend
6. Verify patient is discharged in admissions list
