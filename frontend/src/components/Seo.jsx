import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pages = {
  '/': ['Setas La Guadalupana', 'Orellanas frescas cultivadas por una empresa familiar colombiana.'],
  '/tienda': ['Tienda | Setas La Guadalupana', 'Consulta las presentaciones de orellanas disponibles.'],
  '/carrito': ['Carrito | Setas La Guadalupana', 'Revisa los productos de tu pedido.'],
  '/iniciar-sesion': ['Ingresar | Setas La Guadalupana', 'Accede de forma segura a tu cuenta.'],
  '/registro': ['Crear cuenta | Setas La Guadalupana', 'Crea una cuenta para gestionar tus pedidos.'],
  '/pedidos': ['Mis pedidos | Setas La Guadalupana', 'Consulta el estado y detalle de tus pedidos.'],
};

export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const fallback = pathname.startsWith('/admin')
      ? ['Administración | Setas La Guadalupana', 'Panel privado de administración.']
      : pathname.startsWith('/cuenta')
        ? ['Mi cuenta | Setas La Guadalupana', 'Gestiona tu información y solicitudes.']
        : pathname.startsWith('/pedidos/')
          ? ['Detalle del pedido | Setas La Guadalupana', 'Consulta el comprobante y estado de tu pedido.']
          : ['Página no encontrada | Setas La Guadalupana', 'La dirección solicitada no está disponible.'];
    const [title, description] = pages[pathname] || fallback;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  }, [pathname]);
  return null;
}
