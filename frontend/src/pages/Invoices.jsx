import { useState, useEffect } from 'react';
import billingService from '../services/billingService';
import toast from 'react-hot-toast';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { payment_status: filterStatus } : {};
      const response = await billingService.getInvoices(params);
      setInvoices(response.data);
    } catch (error) {
      toast.error('Hisob-fakturalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (invoiceId) => {
    try {
      const response = await billingService.getInvoiceById(invoiceId);
      setSelectedInvoice(response.data);
    } catch (error) {
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('To\'lov summasini kiriting');
      return;
    }

    setLoading(true);
    try {
      const response = await billingService.addPayment(selectedInvoice.id, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod
      });
      
      // Show success message with updated balance
      if (response.data?.patient_balance !== undefined) {
        const balance = response.data.patient_balance;
        const balanceText = balance >= 0 
          ? `+${balance.toLocaleString()} so'm` 
          : `${balance.toLocaleString()} so'm`;
        toast.success(`To'lov qo'shildi. Bemor balansi: ${balanceText}`);
      } else {
        toast.success('To\'lov qo\'shildi');
      }
      
      setShowPaymentModal(false);
      setPaymentAmount('');
      loadInvoices();
      handleViewDetails(selectedInvoice.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Chek - ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            .paid-stamp { color: green; font-weight: bold; font-size: 24px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>KLINIKA CHEKI</h2>
            <p>Chek raqami: ${invoice.invoice_number}</p>
            <p>Sana: ${new Date(invoice.created_at).toLocaleString('uz-UZ')}</p>
          </div>
          <div class="info">
            <p><strong>Bemor:</strong> ${invoice.first_name} ${invoice.last_name}</p>
            <p><strong>Telefon:</strong> ${invoice.phone}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Xizmat</th>
                <th>Miqdor</th>
                <th>Narx</th>
                <th>Jami</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `
                <tr>
                  <td>${item.service_name}</td>
                  <td>${item.quantity}</td>
                  <td>${parseFloat(item.unit_price).toLocaleString()} so'm</td>
                  <td>${parseFloat(item.total_price).toLocaleString()} so'm</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Jami: ${parseFloat(invoice.total_amount).toLocaleString()} so'm</p>
            <p>To'landi: ${parseFloat(invoice.paid_amount).toLocaleString()} so'm</p>
          </div>
          <div class="paid-stamp">✓ TO'LANGAN</div>
          <div class="footer">
            <p>Rahmat! Sog'lig'ingiz yaxshi bo'lsin!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    const labels = {
      pending: 'Kutilmoqda',
      partial: 'Qisman',
      paid: 'To\'langan',
      cancelled: 'Bekor qilingan'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Hisob-fakturalar</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl bg-white dark:bg-gray-800"
        >
          <option value="all">Barchasi</option>
          <option value="pending">Kutilmoqda</option>
          <option value="partial">Qisman to'langan</option>
          <option value="paid">To'langan</option>
          <option value="cancelled">Bekor qilingan</option>
        </select>
      </div>

      {loading && !selectedInvoice ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden sm:block">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Raqam</th>
                <th className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Bemor</th>
                <th className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Jami</th>
                <th className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">To'langan</th>
                <th className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Qarz</th>
                <th className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Holat</th>
                <th className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Sana</th>
                <th className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-sm sm:text-base font-mono">{invoice.invoice_number}</td>
                  <td className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-sm sm:text-base">
                    <div>
                      <p className="font-semibold">{invoice.first_name} {invoice.last_name}</p>
                      <p className="text-gray-500 text-xs">{invoice.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-sm sm:text-base font-semibold">{parseFloat(invoice.total_amount).toLocaleString()} so'm</td>
                  <td className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-sm sm:text-base text-green-600">{parseFloat(invoice.paid_amount).toLocaleString()} so'm</td>
                  <td className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-sm sm:text-base text-red-600">
                    {(parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount)).toLocaleString()} so'm
                  </td>
                  <td className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4">{getStatusBadge(invoice.payment_status)}</td>
                  <td className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-sm sm:text-base text-gray-500">
                    {new Date(invoice.created_at).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <button
                      onClick={() => handleViewDetails(invoice.id)}
                      className="text-primary hover:underline text-sm sm:text-sm sm:text-base font-semibold"
                    >
                      Ko'rish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Hisob-fakturalar topilmadi</p>
            </div>
          )}
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-bold">Hisob-faktura tafsilotlari</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Invoice Header */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Raqam</p>
                  <p className="font-mono font-semibold">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Sana</p>
                  <p className="font-semibold">{new Date(selectedInvoice.created_at).toLocaleString('uz-UZ')}</p>
                </div>
                <div>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Bemor</p>
                  <p className="font-semibold">{selectedInvoice.first_name} {selectedInvoice.last_name}</p>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-500">{selectedInvoice.phone}</p>
                </div>
                <div>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Holat</p>
                  {getStatusBadge(selectedInvoice.payment_status)}
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-6">
              <h4 className="font-bold mb-3">Xizmatlar</h4>
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-left text-sm sm:text-sm sm:text-base">Xizmat</th>
                    <th className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-right text-sm sm:text-sm sm:text-base">Miqdor</th>
                    <th className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-right text-sm sm:text-sm sm:text-base">Narx</th>
                    <th className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-right text-sm sm:text-sm sm:text-base">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedInvoice.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">{item.service_name}</td>
                      <td className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-right">{item.quantity}</td>
                      <td className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-right">{parseFloat(item.unit_price).toLocaleString()} so'm</td>
                      <td className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-right font-semibold">{parseFloat(item.total_price).toLocaleString()} so'm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 mb-6">
              <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Jami summa:</span>
                  <span className="font-semibold">{parseFloat(selectedInvoice.total_amount).toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">To'langan:</span>
                  <span className="font-semibold text-green-600">{parseFloat(selectedInvoice.paid_amount).toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
                  <span>Qarz:</span>
                  <span className="text-red-600">
                    {(parseFloat(selectedInvoice.total_amount) - parseFloat(selectedInvoice.paid_amount)).toLocaleString()} so'm
                  </span>
                </div>
              </div>
            </div>

            {/* Transactions */}
            {selectedInvoice.transactions && selectedInvoice.transactions.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold mb-3">To'lovlar tarixi</h4>
                <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                  {selectedInvoice.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl">
                      <div>
                        <p className="font-semibold">{parseFloat(transaction.amount).toLocaleString()} so'm</p>
                        <p className="text-sm sm:text-sm sm:text-base text-gray-500">
                          {transaction.payment_method} • {new Date(transaction.created_at).toLocaleString('uz-UZ')}
                        </p>
                      </div>
                      <span className="text-green-600 font-semibold">To'landi</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 sm:gap-3">
              {selectedInvoice.payment_status !== 'paid' && selectedInvoice.payment_status !== 'cancelled' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-bold hover:opacity-90"
                >
                  To'lov qo'shish
                </button>
              )}
              {selectedInvoice.payment_status === 'paid' && (
                <button
                  onClick={() => printInvoice(selectedInvoice)}
                  className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2 sm:gap-2 sm:gap-3"
                >
                  <span className="material-symbols-outlined">print</span>
                  Chop etish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-4">
            <h3 className="text-lg sm:text-xl font-bold mb-4">To'lov qo'shish</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Qarz summasi</label>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {(parseFloat(selectedInvoice.total_amount) - parseFloat(selectedInvoice.paid_amount)).toLocaleString()} so'm
                </p>
              </div>
              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">To'lov usuli</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl bg-white dark:bg-gray-800"
                >
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                </select>
              </div>
              <div>
                <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">To'lov summasi</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl bg-white dark:bg-gray-800"
                />
              </div>
              <div className="flex gap-2 sm:gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                  }}
                  className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={loading}
                  className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Yuklanmoqda...' : 'Tasdiqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
