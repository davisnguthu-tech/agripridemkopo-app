import { Router, type IRouter } from "express";
import healthRouter from "./health";
import farmersRouter from "./farmers";
import loanApplicationsRouter from "./loanApplications";
import loansRouter from "./loans";
import dashboardRouter from "./dashboard";
import ussdRouter from "./ussd";
import mpesaRouter from "./mpesa";

const router: IRouter = Router();

router.use(healthRouter);
router.use(farmersRouter);
router.use(loanApplicationsRouter);
router.use(loansRouter);
router.use(dashboardRouter);
router.use(ussdRouter);
router.use(mpesaRouter);

export default router;
