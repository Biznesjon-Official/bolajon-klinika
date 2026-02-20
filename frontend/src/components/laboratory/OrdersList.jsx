import toast from 'react-hot-toast';
import laboratoryService from '../../services/laboratoryService';
import api from '../../services/api';

export default function OrdersList({ orders, onEnterResult, onRefresh, isAdmin, isLaborant, isDoctor, isReception, getStatusColor, getStatusText, t }) {
  const handleStatusChange = async (orderId, newStatus, patientId) => {
    try {
      // Agar namuna olinayotgan bo'lsa, avval to'lovni tekshirish
      if (newStatus === 'sample_collected' && patientId) {
        try {
          const response = await api.get(`/billing/invoices/patient/${patientId}/unpaid`);
          
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            // To'lanmagan hisob-fakturalar bor
            const totalUnpaid = response.data.data.reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0);
            
            toast.error(
              `⚠️ DIQQAT: Bemorning ${totalUnpaid.toLocaleString()} so'm to'lanmagan qarzi bor! Iltimos, avval to'lovni amalga oshiring.`,
              { duration: 5000 }
            );
            return;
          }
        } catch (invoiceError) {
          console.error('Invoice check error:', invoiceError);
          // Xatolik bo'lsa ham davom etamiz
        }
      }

      await laboratoryService.updateOrderStatus(orderId, newStatus);
      toast.success(t('lab.statusUpdated'));
      onRefresh();
    } catch (error) {
      toast.error(t('lab.error'));
    }
  };

  const handleApprove = async (resultId) => {
    try {
      await laboratoryService.approveResult(resultId);
      toast.success(t('lab.resultApproved'));
      onRefresh();
    } catch (error) {
      toast.error(t('lab.error'));
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-800">
        <span className="material-symbols-outlined text-5xl sm:text-6xl text-gray-300 dark:text-gray-700 mb-4">science</span>
        <p className="text-sm sm:text-sm text-gray-500 dark:text-gray-400">{t('lab.noOrders')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden sm:block">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.orderNumber')}</th>
              <th className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.patient')}</th>
              <th className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.test')}</th>
              <th className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.doctor')}</th>
              <th className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.date')}</th>
              <th className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.status')}</th>
              <th className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-left text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-sm font-semibold text-gray-900 dark:text-white">{order.order_number}</td>
                <td className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{order.patient_name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{order.patient_number}</p>
                  </div>
                </td>
                <td className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-sm text-gray-900 dark:text-white">{order.test_name}</td>
                <td className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-sm text-gray-700 dark:text-gray-300">{order.doctor_name}</td>
                <td className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-sm text-gray-700 dark:text-gray-300">
                  {new Date(order.order_date).toLocaleDateString('uz-UZ')}
                </td>
                <td className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-4 sm:px-4 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
                  <div className="flex gap-2 sm:gap-2 flex-wrap">
                    {isLaborant && order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'sample_collected', order.patient_id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 whitespace-nowrap"
                      >
                        Namuna olindi
                      </button>
                    )}
                    {isLaborant && (order.status === 'sample_collected' || order.status === 'in_progress') && !order.result_id && (
                      <button
                        onClick={() => onEnterResult(order)}
                        className="px-3 py-1 bg-purple-500 text-white rounded text-xs font-semibold hover:bg-purple-600 whitespace-nowrap"
                      >
                        {t('lab.enterResult')}
                      </button>
                    )}
                    {order.result_id && (order.approved_at || isAdmin || isLaborant) && (
                      <button
                        onClick={() => window.open(`/laboratory/result/${order.id}`, '_blank')}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 whitespace-nowrap flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm sm:text-sm">download</span>
                        {t('lab.download')}
                      </button>
                    )}
                    {isAdmin && order.status === 'ready' && order.result_id && !order.approved_at && (
                      <button
                        onClick={() => handleApprove(order.result_id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 whitespace-nowrap"
                      >
                        Tasdiqlash
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden sm:block p-3 sm:p-3 sm:p-4 space-y-2 sm:space-y-3">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 overflow-hidden sm:block"
          >
            {/* Order Number & Status */}
            <div className="flex items-center justify-between mb-3 gap-2 sm:gap-2">
              <div className="flex items-center gap-2 sm:gap-2 min-w-0 flex-1">
                <span className="material-symbols-outlined text-primary flex-shrink-0">science</span>
                <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{order.order_number}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>

            {/* Order Details */}
            <div className="space-y-2 sm:space-y-2 sm:space-y-3 mb-3">
              {/* Patient */}
              <div className="flex items-start gap-2 sm:gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-base sm:text-lg flex-shrink-0">person</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('lab.patient')}</p>
                  <p className="font-semibold text-gray-900 dark:text-white break-words">{order.patient_name}</p>
                  <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400 break-words">{order.patient_number}</p>
                </div>
              </div>

              {/* Test */}
              <div className="flex items-start gap-2 sm:gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-base sm:text-lg flex-shrink-0">biotech</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('lab.test')}</p>
                  <p className="text-sm sm:text-sm text-gray-900 dark:text-white break-words">{order.test_name}</p>
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-start gap-2 sm:gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-base sm:text-lg flex-shrink-0">medical_services</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('lab.doctor')}</p>
                  <p className="text-sm sm:text-sm text-gray-700 dark:text-gray-300 break-words">{order.doctor_name}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-2 sm:gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-base sm:text-lg flex-shrink-0">calendar_today</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('lab.date')}</p>
                  <p className="text-sm sm:text-sm text-gray-700 dark:text-gray-300">
                    {new Date(order.order_date).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              {isLaborant && order.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(order.id, 'sample_collected', order.patient_id)}
                  className="w-full px-3 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-green-600"
                >
                  Namuna olindi
                </button>
              )}
              {isLaborant && (order.status === 'sample_collected' || order.status === 'in_progress') && !order.result_id && (
                <button
                  onClick={() => onEnterResult(order)}
                  className="w-full px-3 py-2 sm:py-2.5 bg-purple-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-purple-600"
                >
                  {t('lab.enterResult')}
                </button>
              )}
              {order.result_id && (order.approved_at || isAdmin || isLaborant) && (
                <button
                  onClick={() => window.open(`/laboratory/result/${order.id}`, '_blank')}
                  className="w-full px-3 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-blue-600 flex items-center justify-center gap-2 sm:gap-2"
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">download</span>
                  Yuklab olish
                </button>
              )}
              {isAdmin && order.status === 'ready' && order.result_id && !order.approved_at && (
                <button
                  onClick={() => handleApprove(order.result_id)}
                  className="w-full px-3 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-green-600"
                >
                  Tasdiqlash
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

