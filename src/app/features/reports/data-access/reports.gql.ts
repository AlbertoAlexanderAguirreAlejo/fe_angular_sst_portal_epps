export const Q_ENTREGAS = `
query ControlEppsReporteEntregas($fini: Date!, $ffin: Date!, $nroDoc: [String!]!) {
  controlEppsReporteEntregas(fini: $fini, ffin: $ffin, nroDoc: $nroDoc) {
    idSstSolicitudEppsEquipo idSstSolicitudEpps nroDoc nombres codEquipo descArea descSeccion
    descEquipo cantidad um descUm flagPerdida flagPrimeraEntrega fechaEntrega firma
  }
}`;

export const Q_SOLICITUDES = `
query ControlEppsReporteSolicitudes($fini: Date!, $ffin: Date!, $nroDoc: [String!]!) {
  controlEppsReporteSolicitudes(fini: $fini, ffin: $ffin, nroDoc: $nroDoc) {
    idSstSolicitudEppsEquipo idSstSolicitudEppsPersona idSstSolicitudEpps nroDoc colaborador codEquipo descEquipo
    cantidad um nombresEncargadoEntrega fechaEntrega nroDocEncargado nombresEncargadoRetiro fechaRetiroEncargado
    flagEstado flagPerdida flagPrimeraEntrega usrCreacion usuarioCreacion fechaCreacion usrRevision
    usuarioRevision fechaRevision nroDocEntrega nroReservaSap docMaterialSap docMaterialSapA cencos
  }
}`;

export const Q_PENDIENTES = `
query ControlEppsReportePendientesIntegracion {
  controlEppsReportePendientesIntegracion {
    idSstSolicitudEppsEquipo idSstSolicitudEppsPersona idSstSolicitudEpps nroDoc colaborador codEquipo fechaEntrega
    descEquipo cantidad um flagEstado nroDocEncargado nombresEncargadoRetiro fechaRetiroEncargado cencos fechaCreacion
  }
}`;

export const Q_TRABAJADORES = `
query BuscarBsTrabajadores($flagEstado:String!) {
  buscarBsTrabajadores(flagEstado:$flagEstado) {
    nroDoc tipoDoc nombres empresa descArea descSeccion codArea codSeccion
  }
}`;

export const M_RECHAZAR = `
mutation ControlEppsRechazarEquipo($id:Int!) {
  controlEppsRechazarEquipo(id:$id)
}`;
