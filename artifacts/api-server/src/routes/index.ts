import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import applicantRouter from "./applicant";
import coachRouter from "./coach";
import farmersRouter from "./farmers";
import loanApplicationsRouter from "./loanApplications";
import loansRouter from "./loans";
import dashboardRouter from "./dashboard";
import ussdRouter from "./ussd";
import mpesaRouter from "./mpesa";

const router: IRouter = Router();

function requireOfficerAuth(req: Request, res: Response, next: NextFunction) {
  const officerPaths = [
    "/farmers",
    "/loan-applications",
    "/loans",
    "/dashboard",
  ];
  if (!officerPaths.some((p) => req.path.startsWith(p))) return next();
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.use(healthRouter);
router.use(authRouter);
router.use(applicantRouter);
router.use(coachRouter);
router.use(requireOfficerAuth);
router.use(farmersRouter);
router.use(loanApplicationsRouter);
router.use(loansRouter);
router.use(dashboardRouter);
router.use(ussdRouter);
router.use(mpesaRouter);

export default router;
