import { getDistribucionGastosDefault } from "@/lib/costosProduccion";

// Opciones de distribución de gastos con explicación visual.
export const DISTRIBUCION_OPCIONES = [
  { value: "no_distribuir", label: "No distribuir", desc: "El gasto queda registrado, pero no se reparte a animales específicos." },
  { value: "por_animal", label: "Por animal", desc: "El gasto se divide en partes iguales entre los animales seleccionados." },
  { value: "por_peso", label: "Por peso", desc: "El gasto se reparte proporcionalmente al peso de cada animal." },
  { value: "manual", label: "Manual", desc: "El usuario define cuánto valor asignar a cada animal o elemento." },
];

export function getDistribucionDefault(user) {
  return getDistribucionGastosDefault(user);
}

// Distribuir por animal: partes iguales (con ajuste de centavos por redondeo).
export function distribuirPorAnimal(valor, animales) {
  const n = animales.length;
  if (n === 0 || valor <= 0) return [];
  const base = Math.floor(valor / n);
  const resto = valor - base * n;
  return animales.map((a, i) => ({
    animal_id: a.id,
    numero: a.numero,
    nombre: a.nombre,
    peso: a.ultimo_peso,
    monto: base + (i < resto ? 1 : 0),
  }));
}

// Distribuir por peso: proporcional al último peso registrado.
// Solo animales con peso; los sin peso se excluyen y se deben marcar.
export function distribuirPorPeso(valor, animales) {
  const conPeso = animales.filter((a) => a.ultimo_peso && a.ultimo_peso > 0);
  if (conPeso.length === 0 || valor <= 0) return [];
  const totalPeso = conPeso.reduce((s, a) => s + a.ultimo_peso, 0);
  if (totalPeso <= 0) return [];
  let acumulado = 0;
  return conPeso.map((a, i) => {
    const monto = i === conPeso.length - 1 ? valor - acumulado : Math.round((valor * a.ultimo_peso) / totalPeso);
    acumulado += monto;
    return { animal_id: a.id, numero: a.numero, nombre: a.nombre, peso: a.ultimo_peso, monto };
  });
}

// Validar que la suma manual coincida con el valor total.
export function validarDistribucionManual(distribucion, valorTotal) {
  const suma = distribucion.reduce((s, d) => s + (d.monto || 0), 0);
  return { valid: suma === valorTotal, suma, diferencia: valorTotal - suma };
}

// Construir el JSON de distribución manual para guardar.
export function buildDistribucionJson(distribucion) {
  const obj = {};
  distribucion.forEach((d) => {
    if (d.monto && d.monto > 0) obj[d.animal_id] = d.monto;
  });
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : null;
}