import { ESPECIES } from "./helpers";

/**
 * Normaliza un número/chapeta para comparación:
 * - quita espacios (internos y extremos)
 * - pasa a minúsculas
 * - quita un '#' inicial (3045 == #3045)
 * - respeta guiones y demás símbolos como parte del número (3045 != 3045-2)
 */
export function normalizeNumero(n) {
  if (n === null || n === undefined) return "";
  let s = String(n).trim().replace(/\s+/g, "").toLowerCase();
  if (s.startsWith("#")) s = s.slice(1);
  return s;
}

export function numerosEquivalentes(a, b) {
  return normalizeNumero(a) === normalizeNumero(b);
}

export function especieLabelLower(especie) {
  return (ESPECIES[especie] || especie || "animal").toLowerCase();
}

/**
 * Valida si un número/chapeta está duplicado dentro del inventario activo
 * del mismo usuario, especie y finca.
 *
 * `animales` debe estar acotado al usuario actual (created_by_id === user.id)
 * para respetar el aislamiento por propietario/tenant.
 *
 * `isActiveFn` permite definir qué cuenta como "activo" (por defecto estado === "activo").
 * `especie` es opcional: si se omite, no se filtra por especie (p.ej. para Yeguas).
 *
 * Retorna:
 *  - { status: "vacio" }
 *  - { status: "disponible" }
 *  - { status: "duplicado_activo", animalActivo, animalesInactivos }
 *  - { status: "usado_anteriormente", animalesInactivos }
 */
export function validarDuplicado({ numero, especie, finca_id, animales, excludeId, isActiveFn }) {
  const norm = normalizeNumero(numero);
  if (!norm) return { status: "vacio" };
  const isActive = isActiveFn || ((a) => a.estado === "activo");
  const matches = (animales || []).filter(
    (a) =>
      a &&
      (especie === undefined || a.especie === especie) &&
      a.finca_id === finca_id &&
      normalizeNumero(a.numero) === norm &&
      a.id !== excludeId
  );
  const activo = matches.find((a) => isActive(a));
  if (activo) {
    return {
      status: "duplicado_activo",
      animalActivo: activo,
      animalesInactivos: matches.filter((a) => !isActive(a)),
    };
  }
  const inactivos = matches.filter((a) => !isActive(a));
  if (inactivos.length) {
    return { status: "usado_anteriormente", animalesInactivos: inactivos };
  }
  return { status: "disponible" };
}

/**
 * Detecta números repetidos dentro de un mismo lote masivo / archivo.
 * Retorna array de { idx, numero, firstIdx }.
 */
export function duplicadosInternos(filas) {
  const vistos = new Map();
  const dups = [];
  filas.forEach((f, idx) => {
    const norm = normalizeNumero(f.numero);
    if (!norm) return;
    if (vistos.has(norm)) {
      dups.push({ idx, numero: f.numero, firstIdx: vistos.get(norm) });
    } else {
      vistos.set(norm, idx);
    }
  });
  return dups;
}