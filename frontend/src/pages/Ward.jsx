import { Navigate } from 'react-router-dom';

// Ward sahifasi Inpatient ga yo'naltiradi
export default function Ward() {
  return <Navigate to="/inpatient" replace />;
}
