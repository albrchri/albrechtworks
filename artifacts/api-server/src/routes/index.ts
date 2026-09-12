import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import diagnosticCheckoutRouter from "./diagnostic-checkout";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(diagnosticCheckoutRouter);

export default router;
