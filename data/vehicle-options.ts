export const VEHICLE_OPTIONS = {
  Audi: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8'],
  BMW: ['1 Series', '3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6'],
  Chevrolet: ['Aveo', 'Cruze', 'Epica', 'Lacetti', 'Malibu', 'Orlando', 'Tacuma'],
  Ford: ['Fiesta', 'Focus', 'Fusion', 'Kuga', 'Mondeo', 'Mustang', 'S-Max'],
  Honda: ['Accord', 'CR-V', 'Civic', 'HR-V', 'Jazz', 'Pilot'],
  Hyundai: ['Accent', 'Elantra', 'Getz', 'i30', 'Santa Fe', 'Sonata', 'Tucson'],
  Kia: ['Carens', 'Ceed', 'Cerato', 'Optima', 'Sorento', 'Sportage', 'Stonic'],
  Lexus: ['ES', 'GS', 'GX', 'IS', 'LX', 'NX', 'RX'],
  Mazda: ['3', '5', '6', 'CX-3', 'CX-5', 'CX-7', 'CX-9'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'GLA', 'GLC', 'GLE', 'S-Class', 'Vito'],
  Mitsubishi: ['ASX', 'Galant', 'L200', 'Lancer', 'Outlander', 'Pajero'],
  Nissan: ['Almera', 'Juke', 'Leaf', 'Micra', 'Murano', 'Qashqai', 'Rogue', 'X-Trail'],
  Opel: ['Astra', 'Combo', 'Corsa', 'Insignia', 'Meriva', 'Omega', 'Vectra', 'Zafira'],
  Peugeot: ['206', '207', '208', '301', '308', '407', '508', '3008', '5008'],
  Renault: ['Clio', 'Duster', 'Fluence', 'Kangoo', 'Laguna', 'Logan', 'Megane', 'Scenic'],
  Skoda: ['Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Superb'],
  Subaru: ['Forester', 'Impreza', 'Legacy', 'Outback', 'Tribeca', 'XV'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  Toyota: ['Auris', 'Avalon', 'Avensis', 'Camry', 'Corolla', 'Highlander', 'Land Cruiser', 'RAV4', 'Yaris'],
  Volkswagen: ['Amarok', 'Caddy', 'Golf', 'Jetta', 'Passat', 'Polo', 'Tiguan', 'Touareg', 'Transporter'],
  Volvo: ['S40', 'S60', 'S80', 'V50', 'V60', 'XC60', 'XC70', 'XC90'],
} as const;

export type VehicleBrand = keyof typeof VEHICLE_OPTIONS;

export const VEHICLE_BRANDS = Object.keys(VEHICLE_OPTIONS) as VehicleBrand[];

export const VEHICLE_YEARS = Array.from({ length: 31 }, (_, index) => String(2026 - index));
