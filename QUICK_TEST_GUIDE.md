# Quick Testing Guide - Laboratory Custom Table

## 🚀 Quick Start

### Step 1: Check Database
```bash
cd Bolajon_klinik/backend
node scripts/check-test-parameters.js
```

### Step 2: Create Test with Parameters
1. Login as **laborant**
2. Go to **Laboratoriya** page
3. Click **"Xizmat qo'shish"**
4. Fill in:
   - Xizmat nomi: `Test Tahlil`
   - Narxi: `50000`
5. Scroll down to **"Qo'lda jadval yaratish"**
6. Click **"Qator qo'shish"** 3 times
7. Fill in table:
   ```
   Параметр номи    | Бирлик  | Меъёр
   ----------------|---------|--------
   УМУМИЙ ОКСИЛ    | Г/Л     | 66-85
   АЛБУМН          | Г/Л     | 38-51
   ГЛЮКОЗА         | Ммоль/л | 4,2-6,4
   ```
8. Click **"Saqlash"**

### Step 3: Create Order
1. Go to **Qabulxona** or **Kassir** page
2. Create new order for patient
3. Select the test you just created
4. Save order

### Step 4: Enter Result
1. Go back to **Laboratoriya** page
2. Find the order in **"Buyurtmalar"** tab
3. Click **"Natija kiritish"**
4. **Watch for**:
   - ⏳ Loading spinner: "Тест маълумотлари юкланмоқда..."
   - ✅ Custom table appears with 5 columns
   - ✅ Only "НАТИЖА" column has input fields
   - ✅ "МЕ'ЁР" and "ЎЛЧОВ БИРЛИГИ" in blue text
5. Fill in results:
   ```
   УМУМИЙ ОКСИЛ: 70
   АЛБУМН: 45
   ГЛЮКОЗА: 5.5
   ```
6. Click **"Saqlash"**

## ✅ What to Check

### Console Logs (F12)
```
=== MODAL OPENED, LOADING TEST ===
=== LOADING TEST DETAILS START ===
=== FETCHING TEST DETAILS ===
Test ID: 507f1f77bcf86cd799439011
=== TEST DETAILS RESPONSE ===
Response.success: true
=== TEST DATA ===
Test name: Test Tahlil
Test parameters: Array(3)
=== SETTING CUSTOM PARAMS ===
Custom params: Array(3)
=== RENDER CHECK ===
loadingTest: false
customParams: Array(3)
hasCustomParams: true
```

### Visual Check
- [ ] Loading spinner shows briefly
- [ ] Table has 5 columns
- [ ] Column headers in Cyrillic
- [ ] Only НАТИЖА column editable
- [ ] МЕ'ЁР and ЎЛЧОВ БИРЛИГИ in blue
- [ ] All parameters from test creation show up

## 🐛 Troubleshooting

### Problem: Generic table shows instead of custom table
**Check:**
1. Console logs - is `hasCustomParams` true?
2. Console logs - is `customParams` array populated?
3. Console logs - is `test_id` present in order?

**Solution:**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check if test has `test_parameters` in database

### Problem: Loading spinner never disappears
**Check:**
1. Console logs - any errors?
2. Network tab - is API call successful?
3. Backend logs - is endpoint working?

**Solution:**
- Check backend is running
- Check MongoDB connection
- Check test_id is valid ObjectId

### Problem: Test parameters not saving
**Check:**
1. Console logs during test creation
2. MongoDB - check test document has `test_parameters` field

**Solution:**
- Run diagnostic script: `node scripts/check-test-parameters.js`
- Check backend logs for errors
- Verify test creation endpoint is working

## 📝 Database Check

### MongoDB Query
```javascript
// Connect to MongoDB
use clinic_db

// Find tests with parameters
db.labtests.find({ 
  test_parameters: { $exists: true, $ne: [] } 
}).pretty()

// Find recent orders
db.laborders.find()
  .sort({ createdAt: -1 })
  .limit(5)
  .pretty()
```

### Expected Test Document
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Test Tahlil",
  "price": 50000,
  "test_parameters": [
    {
      "name": "УМУМИЙ ОКСИЛ",
      "unit": "Г/Л",
      "normal_range": "66-85"
    },
    {
      "name": "АЛБУМН",
      "unit": "Г/Л",
      "normal_range": "38-51"
    },
    {
      "name": "ГЛЮКОЗА",
      "unit": "Ммоль/л",
      "normal_range": "4,2-6,4"
    }
  ]
}
```

### Expected Order Document
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "order_number": "LAB000123",
  "test_id": "507f1f77bcf86cd799439011",
  "test_name": "Test Tahlil",
  "patient_id": "...",
  "status": "pending"
}
```

## 🎯 Success Indicators

### ✅ Everything Working
- Loading spinner shows for 0.5-2 seconds
- Custom table renders with correct parameters
- Only result column is editable
- Normal range and unit columns in blue
- Results save successfully
- Console logs show correct flow

### ❌ Something Wrong
- No loading spinner
- Generic table shows
- Console errors
- API errors
- Results don't save

## 📞 Support

If issues persist:
1. Check `PDF_TABLE_FINAL_FIX.md` for detailed documentation
2. Run diagnostic script: `node scripts/check-test-parameters.js`
3. Check console logs and network tab
4. Verify backend and MongoDB are running
5. Check backend logs for errors

---

**Last Updated:** 2026-02-14
**Status:** Ready for Testing ✅
