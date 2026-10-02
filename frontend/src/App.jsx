import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AppLayout, PublicLayout } from './components/Layouts.jsx';
import Landing from './pages/Landing.jsx';
import { ForgotPassword, Login, Register, ResetPassword } from './pages/AuthPages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Search from './pages/Search.jsx';
import Library from './pages/Library.jsx';
import GameDetail from './pages/GameDetail.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Analytics from './pages/Analytics.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:id" element={<GameDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/games" element={<Navigate to="/library" replace />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
