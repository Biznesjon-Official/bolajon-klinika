import { useState, useEffect } from 'react';

/**
 * TreatmentTimer - Shows countdown timer for upcoming treatments
 * Displays when treatment time is within 30 minutes
 * Changes color based on urgency
 */
export default function TreatmentTimer({ treatments }) {
  const [nextTreatment, setNextTreatment] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [urgencyLevel, setUrgencyLevel] = useState('normal'); // normal, warning, critical

  useEffect(() => {
    const updateTimer = () => {
      if (!treatments || treatments.length === 0) {
        setNextTreatment(null);
        setTimeLeft(null);
        return;
      }

      const now = new Date();
      
      // Find next pending treatment with schedule_times
      let closestTreatment = null;
      let closestTime = null;
      let minDiff = Infinity;

      treatments.forEach(treatment => {
        if (treatment.status !== 'pending') return;
        if (!treatment.schedule_times || treatment.schedule_times.length === 0) return;

        // Check each schedule time
        treatment.schedule_times.forEach(timeStr => {
          // Parse time (format: "09:00", "14:30", etc)
          const [hours, minutes] = timeStr.split(':').map(Number);
          
          // Create date object for today with this time
          const treatmentTime = new Date();
          treatmentTime.setHours(hours, minutes, 0, 0);

          // If time has passed today, check tomorrow
          if (treatmentTime < now) {
            treatmentTime.setDate(treatmentTime.getDate() + 1);
          }

          const diff = treatmentTime - now;

          // Only consider if within 30 minutes (1800000 ms)
          if (diff > 0 && diff <= 1800000 && diff < minDiff) {
            minDiff = diff;
            closestTreatment = treatment;
            closestTime = treatmentTime;
          }
        });
      });

      if (closestTreatment && closestTime) {
        setNextTreatment(closestTreatment);
        
        const diff = closestTime - now;
        const minutesLeft = Math.floor(diff / 60000);
        const secondsLeft = Math.floor((diff % 60000) / 1000);
        
        setTimeLeft({ minutes: minutesLeft, seconds: secondsLeft });

        // Set urgency level
        if (minutesLeft <= 5) {
          setUrgencyLevel('critical'); // Red - 5 minutes or less
        } else if (minutesLeft <= 15) {
          setUrgencyLevel('warning'); // Orange - 15 minutes or less
        } else {
          setUrgencyLevel('normal'); // Blue - more than 15 minutes
        }
      } else {
        setNextTreatment(null);
        setTimeLeft(null);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [treatments]);

  if (!nextTreatment || !timeLeft) {
    return null;
  }

  const colorClasses = {
    normal: 'bg-blue-500 text-white border-blue-600',
    warning: 'bg-orange-500 text-white border-orange-600 animate-pulse',
    critical: 'bg-red-500 text-white border-red-600 animate-pulse'
  };

  const iconClasses = {
    normal: 'text-white',
    warning: 'text-white',
    critical: 'text-white animate-bounce'
  };

  return (
    <div className={`absolute top-2 right-2 ${colorClasses[urgencyLevel]} px-3 py-2 rounded-xl shadow-lg border-2 flex items-center gap-2 z-10 transition-all duration-300`}>
      <span className={`material-symbols-outlined text-lg ${iconClasses[urgencyLevel]}`}>
        {urgencyLevel === 'critical' ? 'emergency' : 'schedule'}
      </span>
      <div className="text-sm font-bold">
        <div className="leading-tight">
          {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <div className="text-xs opacity-90 leading-tight">
          {nextTreatment.medication_name}
        </div>
      </div>
    </div>
  );
}
