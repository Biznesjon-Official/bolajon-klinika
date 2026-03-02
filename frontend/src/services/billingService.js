import api from './api';

const billingService = {
  // Get billing statistics
  getStats: async () => {
    const response = await api.get('/billing/stats');
    return response.data;
  },

  // Get all services
  getServices: async (params = {}) => {
    const response = await api.get('/billing/services', { params });
    return response.data;
  },

  // Get service categories
  getServiceCategories: async () => {
    const response = await api.get('/billing/service-categories');
    return response.data;
  },

  // Create new invoice
  createInvoice: async (invoiceData) => {
    const response = await api.post('/billing/invoices', invoiceData);
    return response.data;
  },

  // Get all invoices
  getInvoices: async (params = {}) => {
    const response = await api.get('/billing/invoices', { params });
    return response.data;
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    const response = await api.get(`/billing/invoices/${id}`);
    return response.data;
  },

  // Add payment to invoice
  addPayment: async (invoiceId, paymentData) => {
    const response = await api.post(`/billing/invoices/${invoiceId}/payment`, paymentData);
    return response.data;
  },

  // Get transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/billing/transactions', { params });
    return response.data;
  },

  // Cancel invoice
  cancelInvoice: async (invoiceId) => {
    const response = await api.put(`/billing/invoices/${invoiceId}/cancel`);
    return response.data;
  },

  // Get invoice by number (for QR scan)
  getInvoiceByNumber: async (invoiceNumber) => {
    const response = await api.get(`/billing/invoices/by-number/${invoiceNumber}`);
    return response.data;
  },

  // Print queue receipt (mini check)
  printQueueReceipt: (invoice, patientName, doctorName, queueNumber) => {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    const now = new Date()
    const dateStr = now.toLocaleDateString('uz-UZ') + ' ' + now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    const items = (invoice.items || []).map(item =>
      `<tr><td style="padding:2px 0">${item.description || ''}</td><td style="text-align:right;padding:2px 0">${(item.total_price || item.unit_price || 0).toLocaleString()}</td></tr>`
    ).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page{size:80mm auto;margin:4mm}
  body{font-family:monospace;font-size:12px;width:72mm;margin:0}
  h2{text-align:center;font-size:14px;margin:0 0 4px}
  p{margin:2px 0;text-align:center}
  hr{border:none;border-top:1px dashed #000;margin:6px 0}
  table{width:100%;border-collapse:collapse}
  .total{font-weight:bold;font-size:13px}
  .paid{font-weight:bold;color:#000}
  .queue{text-align:center;font-size:16px;font-weight:bold;margin:6px 0}
  .no-print{text-align:center;margin-top:10px}
  @media print{.no-print{display:none}}
</style>
</head><body>
<h2>BOLAJON KLINIKASI</h2>
<p>Bemor: <b>${patientName}</b></p>
<p>${dateStr}</p>
<hr>
<table>${items}</table>
<hr>
<table>
<tr class="total"><td>Jami:</td><td style="text-align:right">${(invoice.total_amount || 0).toLocaleString()} so'm</td></tr>
<tr class="paid"><td>To'landi:</td><td style="text-align:right">${(invoice.paid_amount || 0).toLocaleString()} so'm</td></tr>
${(invoice.total_amount || 0) > (invoice.paid_amount || 0) ? `<tr><td>Qoldiq:</td><td style="text-align:right">${((invoice.total_amount||0)-(invoice.paid_amount||0)).toLocaleString()} so'm</td></tr>` : ''}
</table>
<hr>
<p class="queue">Navbat: #${queueNumber} → Dr. ${doctorName}</p>
<p style="font-size:10px">${invoice.invoice_number || ''}</p>
<div class="no-print"><button onclick="window.print()">Chop etish</button> <button onclick="window.close()">Yopish</button></div>
</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  },

  // Print procedure receipt (mini check)
  printProcedureReceipt: (invoice, patientName) => {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    const now = new Date()
    const dateStr = now.toLocaleDateString('uz-UZ') + ' ' + now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    const items = (invoice.items || []).map(item =>
      `<tr><td style="padding:2px 0">${item.description || ''} × ${item.quantity || 1}</td><td style="text-align:right;padding:2px 0">${(item.total_price || 0).toLocaleString()}</td></tr>`
    ).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page{size:80mm auto;margin:4mm}
  body{font-family:monospace;font-size:12px;width:72mm;margin:0}
  h2{text-align:center;font-size:13px;margin:0 0 4px}
  p{margin:2px 0;text-align:center}
  hr{border:none;border-top:1px dashed #000;margin:6px 0}
  table{width:100%;border-collapse:collapse}
  .total{font-weight:bold}
  .note{font-size:10px;text-align:center;font-style:italic}
  .no-print{text-align:center;margin-top:10px}
  @media print{.no-print{display:none}}
</style>
</head><body>
<h2>BOLAJON KLINIKASI — MUOLAJA CHEKI</h2>
<p>Bemor: <b>${patientName}</b></p>
<p>${dateStr}</p>
<hr>
<table>${items}</table>
<hr>
<table>
<tr class="total"><td>Jami:</td><td style="text-align:right">${(invoice.total_amount || 0).toLocaleString()} so'm</td></tr>
<tr><td>To'landi:</td><td style="text-align:right">${(invoice.paid_amount || 0).toLocaleString()} so'm</td></tr>
</table>
<hr>
<p style="font-size:10px">${invoice.invoice_number || ''}</p>
<p class="note">Bu chek bilan Ambulator xonaga boring</p>
<div class="no-print"><button onclick="window.print()">Chop etish</button> <button onclick="window.close()">Yopish</button></div>
</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }
};

export default billingService;
