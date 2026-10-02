import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorPanel from './ErrorPanel.jsx';
import { PageSkeleton } from './Skeleton.jsx';

export default function ProtectedRoute() {
  const { status, bootError, retryBoot } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="boot-screen">
        <PageSkeleton />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="boot-screen">
        <ErrorPanel error={bootError} onRetry={retryBoot} what="verify your session" />
      </div>
    );
  }
  if (status !== 'authed') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
