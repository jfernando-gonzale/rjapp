// Terminología de reproducción por especie
// Evita que formularios bovinos/ovinos usen términos de yeguas.

export const DIAS_GESTACION_POR_ESPECIE = {
  bovino: 283,
  ovino: 150,
  equino: 340,
};

export const TERMINOLOGIA = {
  bovino: {
    especieLabel: "Bovinos",
    hembra: "Hembra bovina",
    hembraPlural: "vacas / novillas",
    hembraPlaceholder: "Seleccionar vaca / novilla",
    macho: "Toro / semen",
    cria: "ternero / ternera",
    criaSingular: "Ternero",
    criaSingularHembra: "Ternera",
    criaPlaceholder: "Seleccionar ternero / ternera lactante",
    criaNombrePlaceholder: "Ej: Ternero 01",
    criaNombreLabel: "Nombre o número de la cría",
    gestacionDias: 283,
    gestacionTexto: "inseminación o transferencia + 283 días",
    inseminacionTitulo: "Registrar inseminación bovina",
    inseminacionSubtitulo: "Registra la inseminación de una vaca o novilla",
    prenezTitulo: "Confirmar preñez bovina",
    prenezSubtitulo: "Confirma la preñez de una vaca o novilla",
    partoTitulo: "Registrar parto bovino",
    partoSubtitulo: "Registra el parto de una vaca o novilla",
    desteteTitulo: "Registrar destete bovino",
    desteteSubtitulo: "Marca un ternero o ternera como destetado",
    estadoMadreLabel: "Estado de la madre después del destete",
    toastHembra: "Selecciona una hembra bovina",
    toastCria: "Selecciona un ternero o ternera",
    inseminacionExito: "Inseminación bovina registrada.",
    prenezExito: "Preñez bovina confirmada.",
    partoExito: "Parto bovino registrado.",
    desteteExito: "Destete bovino registrado.",
  },
  ovino: {
    especieLabel: "Ovinos",
    hembra: "Hembra ovina",
    hembraPlural: "ovejas / borregas",
    hembraPlaceholder: "Seleccionar oveja / borrega",
    macho: "Carnero / reproductor",
    cria: "cordero / cordera",
    criaSingular: "Cordero",
    criaSingularHembra: "Cordera",
    criaPlaceholder: "Seleccionar cordero / cordera lactante",
    criaNombrePlaceholder: "Ej: Cordero 01",
    criaNombreLabel: "Nombre o número de la cría",
    gestacionDias: 150,
    gestacionTexto: "monta o servicio + 150 días",
    inseminacionTitulo: "Registrar monta / servicio ovino",
    inseminacionSubtitulo: "Registra la monta o servicio de una oveja o borrega",
    prenezTitulo: "Confirmar preñez ovina",
    prenezSubtitulo: "Confirma la preñez de una oveja o borrega",
    partoTitulo: "Registrar parto ovino",
    partoSubtitulo: "Registra el parto de una oveja o borrega",
    desteteTitulo: "Registrar destete ovino",
    desteteSubtitulo: "Marca un cordero o cordera como destetado",
    estadoMadreLabel: "Estado de la madre después del destete",
    toastHembra: "Selecciona una hembra ovina",
    toastCria: "Selecciona un cordero o cordera",
    inseminacionExito: "Servicio ovino registrado.",
    prenezExito: "Preñez ovina confirmada.",
    partoExito: "Parto ovino registrado.",
    desteteExito: "Destete ovino registrado.",
  },
  equino: {
    especieLabel: "Equinos",
    hembra: "Yegua",
    hembraPlural: "yeguas",
    hembraPlaceholder: "Seleccionar yegua",
    macho: "Reproductor / padrillo",
    cria: "potro / potranca",
    criaSingular: "Potro",
    criaSingularHembra: "Potranca",
    criaPlaceholder: "Seleccionar cría lactante",
    criaNombrePlaceholder: "Ej: Potranca 01",
    criaNombreLabel: " Nombre o número de la cría",
    gestacionDias: 340,
    gestacionTexto: "inseminación + 340 días",
    inseminacionTitulo: "Nueva Inseminación / Monta",
    inseminacionSubtitulo: "Registra la inseminación o monta de una yegua",
    prenezTitulo: "Confirmar Preñez",
    prenezSubtitulo: "Confirma la preñez de una yegua",
    partoTitulo: "Registrar Parto",
    partoSubtitulo: "Registra el parto de una yegua",
    desteteTitulo: "Registrar Destete",
    desteteSubtitulo: "Marca una cría como destetada",
    estadoMadreLabel: "Estado de la yegua madre después del destete",
    toastHembra: "Selecciona una yegua",
    toastCria: "Selecciona una cría",
    inseminacionExito: "Inseminación registrada. Estado de la yegua actualizado a 'Inseminada'.",
    prenezExito: "Preñez confirmada. Estado actualizado a 'Preñada'.",
    partoExito: "Parto registrado. Estado actualizado a 'Parida'.",
    desteteExito: "Destete registrado.",
  },
};

export function getTerminologia(especie) {
  return TERMINOLOGIA[especie] || TERMINOLOGIA.equino;
}

export function getDiasGestacion(especie) {
  return DIAS_GESTACION_POR_ESPECIE[especie] || 340;
}

// Calcula fecha probable de parto según especie
export function calcFechaProbablePartoEspecie(fecha, especie) {
  if (!fecha) return null;
  const dias = getDiasGestacion(especie);
  const f = new Date(fecha);
  f.setDate(f.getDate() + dias);
  return f.toISOString().split("T")[0];
}