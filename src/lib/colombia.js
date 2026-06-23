// Departamentos y municipios principales de Colombia
// Desplegables dependientes para formularios de ubicación.

export const DEPARTAMENTOS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar",
  "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca",
  "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía",
  "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta",
  "Nariño", "Norte de Santander", "Putumayo", "Quindío",
  "Risaralda", "San Andrés y Providencia", "Santander", "Sucre",
  "Tolima", "Valle del Cauca", "Vaupés", "Vichada", "Bogotá D.C.",
];

// Municipios principales por departamento (precargados).
// Cada lista termina con "Otro municipio de [Depto]" para permitir municipios no listados.
export const MUNICIPIOS = {
  "Amazonas": ["Leticia", "Puerto Nariño", "El Encanto", "La Chorrera", "Tarapacá", "Otro municipio del Amazonas"],
  "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro", "Sabaneta", "Caucasia", "Apartadó", "Santa Fe de Antioquia", "Turbo", "Otro municipio de Antioquia"],
  "Arauca": ["Arauca", "Arauquita", "Saravena", "Tame", "Fortul", "Cravo Norte", "Otro municipio de Arauca"],
  "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanagrande", "Baranoa", "Puerto Colombia", "Sabanalarga", "Galapa", "Otro municipio de Atlántico"],
  "Bolívar": ["Cartagena", "Magangué", "Turbaco", "Arjona", "Carmen de Bolívar", "San Jacinto", "Santa Rosa del Sur", "Otro municipio de Bolívar"],
  "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Puerto Boyacá", "Moniquirá", "Villa de Leyva", "Otro municipio de Boyacá"],
  "Caldas": ["Manizales", "La Dorada", "Chinchiná", "Riosucio", "Salamina", "Villamaría", "Supía", "Otro municipio de Caldas"],
  "Caquetá": ["Florencia", "San Vicente del Caguán", "Cartagena del Chairá", "El Doncello", "Puerto Rico", "Montañita", "Otro municipio de Caquetá"],
  "Casanare": ["Yopal", "Aguazul", "Tauramena", "Paz de Ariporo", "Villanueva", "Támara", "Otro municipio de Casanare"],
  "Cauca": ["Popayán", "Santander de Quilichao", "Patía", "Argelia", "Balboa", "Caldono", "Otro municipio del Cauca"],
  "Cesar": ["Valledupar", "Aguachica", "Agustín Codazzi", "Bosconia", "Chiriguaná", "Curumaní", "La Jagua de Ibirico", "Otro municipio del Cesar"],
  "Chocó": ["Quibdó", "Istmina", "Condoto", "Riosucio", "Nuquí", "Pueblo Rico", "Otro municipio del Chocó"],
  "Córdoba": ["Montería", "Cereté", "Lorica", "Montelíbano", "Sahagún", "Planeta Rica", "Tierralta", "Otro municipio de Córdoba"],
  "Cundinamarca": ["Bogotá D.C.", "Soacha", "Fusagasugá", "Zipaquirá", "Facatativá", "Chía", "Mosquera", "Funza", "Girardot", "Otro municipio de Cundinamarca"],
  "Guainía": ["Inírida", "Barranco Minas", "San Felipe", "Puerto Colombia", "Otro municipio de Guainía"],
  "Guaviare": ["San José del Guaviare", "Calamar", "El Retorno", "Miraflores", "Otro municipio de Guaviare"],
  "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre", "Yaguará", "Otro municipio del Huila"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "Fonseca", "Barrancas", "Distracción", "Otro municipio de La Guajira"],
  "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "Aracataca", "El Banco", "Plato", "Pivijay", "Otro municipio del Magdalena"],
  "Meta": ["Villavicencio", "Puerto López", "Cumaral", "Acacías", "Granada", "Restrepo", "San Martín", "Puerto Gaitán", "Puerto Rico", "Vista Hermosa", "Otro municipio del Meta"],
  "Nariño": ["Pasto", "Tumaco", "Ipiales", "Sandoná", "Tuquerres", "Otro municipio de Nariño"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario", "Los Patios", "Ábrego", "Otro municipio de Norte de Santander"],
  "Putumayo": ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez", "Puerto Caicedo", "Otro municipio de Putumayo"],
  "Quindío": ["Armenia", "Calarcá", "Montenegro", "Quimbaya", "La Tebaida", "Circasia", "Otro municipio de Quindío"],
  "Risaralda": ["Pereira", "Dosquebradas", "La Virginia", "Santa Rosa de Cabal", "Marsella", "Belén de Umbría", "Otro municipio de Risaralda"],
  "San Andrés y Providencia": ["San Andrés", "Providencia", "Santa Catalina", "Otro municipio de San Andrés"],
  "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Barrancabermeja", "Piedecuesta", "Socorro", "Vélez", "Otro municipio de Santander"],
  "Sucre": ["Sincelejo", "Corozal", "San Onofre", "Chinú", "Sampués", "Otro municipio de Sucre"],
  "Tolima": ["Ibagué", "Espinal", "Honda", "Líbano", "Purificación", "Melgar", "Girardot", "Otro municipio del Tolima"],
  "Valle del Cauca": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Cartago", "Yumbo", "Zarzal", "Sevilla", "Otro municipio del Valle del Cauca"],
  "Vaupés": ["Mitú", "Taraira", "Carurú", "Otro municipio de Vaupés"],
  "Vichada": ["Puerto Carreño", "La Primavera", "Santa Rosalía", "Cumaribo", "Otro municipio de Vichada"],
  "Bogotá D.C.": ["Bogotá D.C.", "Usaquén", "Chapinero", "Suba", "Kennedy", "Engativá", "Bosa", "Fontibón", "Otra localidad de Bogotá"],
};

// Devuelve los municipios del departamento, o [] si no hay departamento.
export function getMunicipios(departamento) {
  if (!departamento) return [];
  return MUNICIPIOS[departamento] || [];
}

// Normaliza el valor del municipio: si es "Otro municipio de X", reemplaza con "".
export function getMunicipioBase(municipio) {
  if (!municipio) return "";
  if (municipio.startsWith("Otro municipio de ") || municipio.startsWith("Otra localidad de ")) return "";
  return municipio;
}