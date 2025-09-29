# Portal EPPs — README

Proyecto Angular para la gestión y emisión de reportes de **Entrega de EPP** (Equipo de Protección Personal), con arquitectura modular y exportación a PDF desacoplada mediante **plantillas reutilizables** (header / subheader / cuerpo / footer) y un servicio centralizado.

-------------------------------------------------------------------------------

## 1) Stack y requisitos

- Angular 17+ (Dev server con Vite)
- TypeScript
- jsPDF + jspdf-autotable (generación de PDFs y tablas)
- JSZip (empaquetado ZIP cuando hay múltiples PDFs)
- Node LTS (>= 18), pnpm o npm

-------------------------------------------------------------------------------

## 2) Scripts básicos

Instalación
  pnpm install

## o npm install

Desarrollo
  pnpm start

## o npm run start

### App en <http://localhost:5173> (según config)

Build producción
  pnpm build

## o npm run build

Pruebas (si aplica)
  pnpm test

## o npm run test

-------------------------------------------------------------------------------

## 3) Estructura de carpetas (resumen)

src/
  app/
    core/                 # Infraestructura transversal de la app
      application/
      config/
        environment.ts
      guards/
        auth.guard.ts
      interceptors/
        auth.interceptor.ts
        error.interceptor.ts
        graphql.interceptor.ts
        network.interceptor.ts
        notify-on-error.interceptor.ts
      providers/
        route-reuse.provider.ts
      services/
        api/
          auth.api.ts
          graphql.api.ts
        auth/
          auth.service.ts
        cache/
          view-cache.service.ts
        error/
          error.mapper.ts
          error.types.ts
          global-error.handler.ts
        network/
          network-tracker.service.ts
          network.tokens.ts
          request-manager.service.ts
        notifications/
          notifications.service.ts
        storage/
          storage.service.ts
        pdf/
          pdf.service.ts              # Servicio genérico de exportación a PDF/ZIP
      strategies/
        custom-route-reuse.strategy.ts
      theme/
        brand-theme.ts
        theme.service.ts
      tokens/
        app-logout.token.ts

    features/             # Casos de uso (dominio)
      auth/
        components/
          login-form.component.ts
        pages/
          auth.page.ts
        auth.routes.ts
      reports/
        data-access/
          reports.api.ts
          reports.gql.ts
          reports.store.ts
        pages/
          delivery-report.page.ts
          pending-report.page.ts
          requests-report.page.ts
        pdf/
          delivery-report.exporter.ts # Entrada del feature para exportar el PDF
        reports.routes.ts

    shared/               # Reutilizables (UI, utils, pipes, pdf)
      pdf/
        common.ts                     # Constantes globales (márgenes, tamaños, helpers)
        table-paged.ts                # Wrapper de autotable con paginado y hooks por página
        templates/
          base.template.ts            # Contrato + registro + base con slots
          delivery-epp.template.ts    # Plantilla dedicada del reporte EPP
          index.ts
        components/                   # Sub-plantillas reutilizables (slots)
          header.standard.ts          # Header genérico (logo | título/subtítulo | meta)
          subheader.person.ts         # Subheader con datos del colaborador
          footer.responsable.ts       # Footer con responsable y firma
          body.table.epp.ts           # Cuerpo tabular EPP (paginado, firma, numeración)
      pipes/
        badge-si-no.pipe.ts
        format-fecha.pipe.ts
        image-src-from-base64.pipe.ts
        is-true.pipe.ts
      ui/
        components/
          app-shell/...
          smart-filter-bar/...
          smart-table/...
          network-indicator.component.ts
          smart-autocomplete.component.ts
          smart-date-range.component.ts
          theme-toggle-icon.component.ts
        directives/
          gradient-border.directive.ts
      utils/
        date/date.util.ts
        files/base64.util.ts
        strings/boolean.util.ts

  assets/
    logo.png (y otros logotipos/imagenes)

  environments/
    environment.development.ts
    environment.ts

  app.config.ts
  app.routes.ts
  app.ts
  index.html
  main.ts
  styles.css

-------------------------------------------------------------------------------

## 4) Responsabilidades por módulo

app/core

- Servicios de infraestructura (API, Auth, Network, Storage, Notifications)
- Interceptores (Auth, Error, GraphQL, Network)
- Guards, Providers, Estrategias de enrutamiento
- Servicio de exportación PDF genérico (pdf.service.ts)

app/features

- Casos de uso (páginas, data-access, rutas) por dominio
- En reports/, el exporter del feature llama al servicio genérico con la plantilla correspondiente

app/shared

- Componentes UI genéricos
- Pipes y Utilities (fecha, strings, archivos)
- Módulo PDF (common, table-paged, templates, components)

assets/

- Recursos estáticos (logos, íconos, imágenes)

environments/

- Variables de entorno (según modo)

-------------------------------------------------------------------------------

## 5) Arquitectura de exportación a PDF

Objetivo
  Separar “qué” se exporta (formato del reporte) de “cómo” se exporta (servicio y librerías).

Capas

(1) Servicio genérico — core/services/pdf/pdf.service.ts

- Método export(templateId, rows, options)
  - Carga assets (logoUrl -> Image)
  - Agrupa rows (groupBy) y decide PDF único vs ZIP (bundle: single | bundle | auto)
  - Prepara RenderContext para la plantilla (assets, helpers)
  - Invoca la plantilla por TemplateId y descarga el resultado
- No conoce el layout específico del reporte (desacoplado del dominio)

(2) Contrato y registro — shared/pdf/templates/base.template.ts

- TemplateInput: { rows: any[]; config?: any; hint?: any }
- Slots: HeaderComponent, SubHeaderComponent, BodyComponent, FooterComponent
- BaseTemplate:
  - Inyecta slots en el contexto y delega el paginado al Body
  - defaultFilename/defaultBundleName opcionales
- TemplateRegistry:
  - Registro/lookup de plantillas por TemplateId (p.ej., 'delivery-epp')

(3) Componentes reutilizables (sub-plantillas) — shared/pdf/components/*

- header.standard.ts
  - Maqueta 3 columnas (logo | título/subtítulo | meta)
  - Dibuja exactamente lo que le pasen por config.headerCfg (100% dinámico)
- subheader.person.ts
  - Dibuja Nombres, DNI, Gerencia, Área a partir de rows[0]
- footer.responsable.ts
  - Dibuja responsable (y firma si hay)
  - Permite ajustes (labels, anchos, alturas)
- body.table.epp.ts
  - Mapea rows a headers/body
  - Usa renderPagedTable (autotable) con porcentajes de ancho, rowsPerPage, etc.
  - En cada página llama a los slots (header, subheader, footer)
  - Agrega numeración "Página i de n"

(4) Plantilla dedicada (formato de negocio) — shared/pdf/templates/delivery-epp.template.ts

- Selecciona los slots que usa: HeaderStandard, SubHeaderPerson, BodyTableEpp, FooterResponsable
- Define defaults del reporte (título, subtítulo y meta del formato EPP)
- Hace merge (deep mínimo) con overrides que envíe el feature
- Ordena el grupo (por fechaEntrega DESC)
- defaultFilename: "[DNI] - [Nombre].pdf"

(5) Utilidades PDF

- shared/pdf/common.ts: constantes (márgenes, alturas, tamaños) + helpers (loadImage, formatDateDDMMYY, getResponsable)
- shared/pdf/table-paged.ts: wrapper de jspdf-autotable con:
  - cálculo de anchos por porcentaje
  - sigIdx para render de firma como imagen
  - onDrawPage para ejecutar los slots por página

Flujo de exportación
  Feature -> Exporter del feature -> PdfService.export(templateId, rows, options)
  -> Carga logo + agrupación -> Plantilla dedicada (merge defaults/overrides) -> Body (tabla) llama slots por página
  -> PdfService descarga PDF o ZIP

-------------------------------------------------------------------------------

## 6) Uso desde el feature (mínimo)

Exporter del feature (ejemplo):
  // src/app/features/reports/pdf/delivery-report.exporter.ts
  import { PdfService } from '@core/services/pdf/pdf.service';
  import { TemplateRegistry } from '@shared/pdf/templates/base.template';
  import { DeliveryEppTemplate } from '@shared/pdf/templates/delivery-epp.template';
  import { formatFecha as formatFechaUtil } from '@shared/utils/date/date.util';

  export async function exportarEntregasPorColaborador(registros: any[]) {
    const registry = new TemplateRegistry();
    registry.register(new DeliveryEppTemplate());

    const pdf = new PdfService(registry);
    await pdf.export('delivery-epp', registros, {
      logoUrl: 'assets/logo.png',
      bundle: { mode: 'auto' }, // 1 grupo = PDF, >1 = ZIP
      templateConfig: {
        // opcional: overrides del header/footer/tabla
        // headerCfg: { title: 'REPORTE', subtitle: 'Entregas', meta: { codigo:'...', ... } },
        // footerCfg: { ... },
        formatFecha: (iso?: string|Date) =>
          formatFechaUtil(iso, 'UTC', 'dd/MM/yyyy, HH:mm', 'es-PE'),
      },
      groupBy: (r) => ({ key: String(r.nroDoc), hint: { nombre: r.nombres } }),
    });
  }

Uso en la página:
  onExportPDF = async () => {
    const data = this.rows();
    if (!data?.length) return;
    await exportarEntregasPorColaborador(data);
  }

-------------------------------------------------------------------------------

## 7) Cómo crear un nuevo reporte

1. Crea una plantilla dedicada: shared/pdf/templates/mi-reporte.template.ts
   - Extiende BaseTemplate
   - Selecciona slots (Header*/SubHeader*/Body*/Footer*)
   - Define defaults del header/meta (y mergea con overrides si es necesario)
   - (Opcional) defaultFilename/defaultBundleName

2. (Opcional) Crea nuevos slots si el layout cambia
   - shared/pdf/components/header.mi-formato.ts
   - shared/pdf/components/body.mi-tabla.ts
   - etc.

3. En el feature, llama a PdfService.export('mi-reporte', rows, options)

-------------------------------------------------------------------------------

## 8) Solución de problemas

Error NG0203 (inject fuera de contexto)

- No uses inject(PdfService) dentro de funciones sueltas (helpers).
- En exporters/herramientas planas, instancia manualmente (new PdfService(new TemplateRegistry()))
    o crea un servicio inyectable y úsalo en el constructor del componente.

No se ve el logo

- Verifica que assets/logo.png existe y que la ruta es válida en build/serve.
- Si usas URL remota, el servidor debe permitir CORS (loadImage usa crossOrigin='anonymous').
- Prueba con PNG/JPEG local para descartar formato.

Header sale vacío

- La plantilla dedicada debe fusionar defaults + overrides y pasar headerCfg completo al HeaderStandard.
- Asegúrate de estar usando delivery-epp.template.ts actualizado.

Firma no se dibuja

- La columna de firma (sigIdx) espera base64 (data:image/png;base64,***) o un string base64 (el wrapper lo completa).

ZIP con nombre incorrecto

- Usa bundle: { mode: 'bundle' | 'auto', bundleName?, fileNamer? } en PdfService.export.
- También puedes redefinir defaultBundleName en la plantilla.

-------------------------------------------------------------------------------

## 9) Convenciones y buenas prácticas

- Clean Architecture a nivel de app:
  - core: infraestructura e integración transversal
  - features: casos de uso/domino
  - shared: reutilizables (UI, utils, pdf)
- PDFs:
  - PdfService orquesta; plantillas definen formato; sub-plantillas componen secciones.
  - Defaults en la plantilla dedicada; overrides desde el feature via templateConfig.
- Nombres:
  - defaultFilename en la plantilla; o define fileNamer en bundle.

-------------------------------------------------------------------------------

## 10) Environments

- environments/environment.ts y environments/environment.development.ts
- Ajusta endpoints, baseHref u otras variables según despliegue.

-------------------------------------------------------------------------------

## 11) Licencia

Este proyecto es interno. Todos los derechos reservados.
