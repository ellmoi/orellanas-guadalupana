import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { adminUserRouter } from './admin-user.routes.js';
import { adminOrderRouter, cartRouter, orderRouter } from './order.routes.js';
import { productRouter } from './product.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users/me', userRouter);
apiRouter.use('/admin/users', adminUserRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/admin/orders', adminOrderRouter);
apiRouter.use('/admin', adminRouter);
