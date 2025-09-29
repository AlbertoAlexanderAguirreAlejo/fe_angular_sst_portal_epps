// src/app/features/reports/pdf/delivery-report.exporter.ts
import { PdfService } from '@core/services/pdf/pdf.service';
import { TemplateRegistry } from '@shared/pdf/templates/base.template';
import { DeliveryEppTemplate } from '@shared/pdf/templates/delivery-epp.template';
import { formatFecha as formatFechaUtil } from '@shared/utils/date/date.util';

export async function exportarEntregasPorColaborador(
  registros: any[],
  config: {
    formatFecha?: (iso?: string | Date, timeZone?: string) => string | undefined;
  } = {}
) {
  // Instancias "manuales", 100% fuera de DI
  const registry = new TemplateRegistry();
  registry.register(new DeliveryEppTemplate());
  const service = new PdfService(registry);

  await service.export('delivery-epp', registros, {
    logoUrl: 'assets/logo.png',
    templateConfig: {
      formatFecha:
        config.formatFecha ??
        ((iso?: string | Date) => formatFechaUtil(iso, 'UTC', 'dd/MM/yyyy, HH:mm', 'es-PE')),
    },
    groupBy: (r) => ({ key: String(r.nroDoc), hint: { nombre: r.nombres } }),
    bundle: { mode: 'auto' }, // 1 colaborador = PDF, >1 = ZIP
  });
}
