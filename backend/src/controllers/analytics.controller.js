import * as analytics from '../services/analytics.service.js';
import { auditAction } from '../middlewares/audit-action.js';
import { success } from '../utils/response.js';

export async function dashboard(req, res) {
  return success(res, { data: await analytics.dashboard(req.query) });
}
export async function charts(req, res) {
  return success(res, { data: await analytics.charts(req.query) });
}
export async function inventory(req, res) {
  return success(res, { data: await analytics.inventory(req.query) });
}
export async function reportOptions(req, res) {
  return success(res, { data: await analytics.reportOptions() });
}
export async function movement(req, res) {
  const item = await analytics.createMovement(req.user.id, req.body);
  await auditAction(req, 'INVENTORY_MOVEMENT_CREATED', 'InventoryMovement', item.id, {
    type: item.type,
    quantity: item.quantity,
  });
  return success(res, { status: 201, data: { item } });
}
export async function report(req, res) {
  return success(res, { data: { rows: await analytics.report(req.params.type, req.query) } });
}
export async function exportReport(req, res) {
  const rows = await analytics.report(req.params.type, req.query);
  const format = req.params.format;
  await auditAction(req, 'REPORT_EXPORTED', 'Report', req.params.type, { format, rows: rows.length });
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${req.params.type}.csv"`);
    return res.send(analytics.reportCsv(rows));
  }
  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${req.params.type}.pdf"`);
    return res.send(await analytics.reportPdf(req.params.type, rows));
  }
  return res.status(422).json({ message: 'Formato no valido.' });
}
