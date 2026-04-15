import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import admissionsRouter from "./admissions";
import studentsRouter from "./students";
import feesRouter from "./fees";
import hostelRouter from "./hostel";
import examsRouter from "./exams";
import facultyRouter from "./faculty";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(admissionsRouter);
router.use(studentsRouter);
router.use(feesRouter);
router.use(hostelRouter);
router.use(examsRouter);
router.use(facultyRouter);
router.use(dashboardRouter);

export default router;
