import { Router, type IRouter } from "express";
import {
  GetDiagnosticConversionReportQueryParams,
  GetDiagnosticConversionReportResponse,
} from "@workspace/api-zod";
import {
  getDiagnosticConversionReport,
  type DiagnosticConversionReport,
} from "../lib/diagnostic-conversions";

type DiagnosticReportDependencies = {
  getReport: (
    diagnosticCheckoutClicked: number,
  ) => Promise<DiagnosticConversionReport>;
};

export function createDiagnosticReportRouter(
  dependencies: DiagnosticReportDependencies = {
    getReport: getDiagnosticConversionReport,
  },
): IRouter {
  const router: IRouter = Router();

  router.get("/diagnostic-report", async (req, res): Promise<void> => {
    const params = GetDiagnosticConversionReportQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: "Invalid diagnostic click count." });
      return;
    }

    const report = await dependencies.getReport(
      params.data.diagnostic_checkout_clicked,
    );
    res.json(GetDiagnosticConversionReportResponse.parse(report));
  });

  return router;
}

export default createDiagnosticReportRouter();