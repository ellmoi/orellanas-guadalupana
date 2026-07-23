import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Seo } from './components/Seo.jsx';
import { SiteLayout } from './layouts/SiteLayout.jsx';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerificationPage,
} from './pages/AuthPages.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { CartPage, CheckoutPage, OrderDetailPage, OrdersPage, ShopPage } from './pages/ShoppingPages.jsx';
import { ClientDashboard } from './pages/ClientDashboard.jsx';
import { NotFoundPage } from './pages/ErrorPages.jsx';

const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'ORDER_MANAGER'];
const AdminLogin = lazy(() => import('./pages/AdminPanel.jsx').then((module) => ({ default: module.AdminLogin })));
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx').then((module) => ({ default: module.AdminPanel })));

export default function App() {
  return (
    <>
      <Seo />
      <Suspense
        fallback={
          <p className="page-message" role="status">
            Cargando página…
          </p>
        }
      >
        <Routes>
          <Route path="admin/login" element={<AdminLogin />} />
          <Route
            path="admin/:module?"
            element={
              <ProtectedRoute roles={adminRoles}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="tienda" element={<ShopPage />} />
            <Route path="carrito" element={<CartPage />} />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="pedidos"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="pedidos/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="registro" element={<RegisterPage />} />
            <Route path="iniciar-sesion" element={<LoginPage />} />
            <Route path="verificar-correo" element={<VerificationPage />} />
            <Route path="olvide-contrasena" element={<ForgotPasswordPage />} />
            <Route path="restablecer-contrasena" element={<ResetPasswordPage />} />
            <Route path="perfil" element={<Navigate to="/cuenta/resumen" replace />} />
            <Route
              path="cuenta/:section?"
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
