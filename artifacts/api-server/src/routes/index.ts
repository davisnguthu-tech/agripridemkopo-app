import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import farmersRouter from "./farmers";
import loanApplicationsRouter from "./loanApplications";
import loansRouter from "./loans";
import dashboardRouter from "./dashboard";
import ussdRouter from "./ussd";
import mpesaRouter from "./mpesa";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const publicPaths = ["/healthz", "/auth/login", "/auth/me", "/auth/logout", "/ussd", "/mpesa"];
  if (publicPaths.some((p) => req.path.startsWith(p))) return next();
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth);
router.use(farmersRouter);
router.use(loanApplicationsRouter);
router.use(loansRouter);
router.use(dashboardRouter);
router.use(ussdRouter);
router.use(mpesaRouter);

export default router;
