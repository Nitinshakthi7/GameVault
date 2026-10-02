import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/useMisc.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  usePageTitle('Page not found');
  const { status } = useAuth();
  return (
    <div className="empty empty-hero not-found">
      <p className="eyebrow">Error 404</p>
      <h1>Level not found</h1>
      <p>That page does not exist, or it moved. Check the address, or head back to safe ground.</p>
      <Link to={status === 'authed' ? '/dashboard' : '/'} className="btn btn-primary">
        {status === 'authed' ? 'Back to dashboard' : 'Back to home'}
      </Link>
    </div>
  );
}
