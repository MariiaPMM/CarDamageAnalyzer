export type VehicleSegment = 'economy' | 'mid' | 'premium' | 'suv' | 'commercial' | 'electric';

export type VehicleModelPricing = {
  factor: number;
  segment: VehicleSegment;
};

export type VehicleBrandPricing = {
  defaultFactor: number;
  models: Record<string, VehicleModelPricing>;
};

export const VEHICLE_PRICING_CATALOG: Record<string, VehicleBrandPricing> = {
  Audi: {
    defaultFactor: 1.2,
    models: {
      A3: { factor: 1.14, segment: 'premium' },
      A4: { factor: 1.18, segment: 'premium' },
      A6: { factor: 1.24, segment: 'premium' },
      A8: { factor: 1.34, segment: 'premium' },
      Q3: { factor: 1.2, segment: 'suv' },
      Q5: { factor: 1.26, segment: 'suv' },
      Q7: { factor: 1.34, segment: 'suv' },
      Q8: { factor: 1.42, segment: 'suv' },
    },
  },
  BMW: {
    defaultFactor: 1.22,
    models: {
      '1 Series': { factor: 1.14, segment: 'premium' },
      '3 Series': { factor: 1.2, segment: 'premium' },
      '5 Series': { factor: 1.28, segment: 'premium' },
      '7 Series': { factor: 1.4, segment: 'premium' },
      X1: { factor: 1.2, segment: 'suv' },
      X3: { factor: 1.28, segment: 'suv' },
      X5: { factor: 1.38, segment: 'suv' },
      X6: { factor: 1.42, segment: 'suv' },
    },
  },
  Chevrolet: {
    defaultFactor: 0.98,
    models: {
      Aveo: { factor: 0.9, segment: 'economy' },
      Cruze: { factor: 0.98, segment: 'mid' },
      Epica: { factor: 1.02, segment: 'mid' },
      Lacetti: { factor: 0.94, segment: 'economy' },
      Malibu: { factor: 1.08, segment: 'mid' },
      Orlando: { factor: 1.04, segment: 'mid' },
      Tacuma: { factor: 0.92, segment: 'economy' },
    },
  },
  Ford: {
    defaultFactor: 1.03,
    models: {
      Fiesta: { factor: 0.94, segment: 'economy' },
      Focus: { factor: 1, segment: 'mid' },
      Fusion: { factor: 0.98, segment: 'mid' },
      Kuga: { factor: 1.08, segment: 'suv' },
      Mondeo: { factor: 1.06, segment: 'mid' },
      Mustang: { factor: 1.32, segment: 'premium' },
      'S-Max': { factor: 1.08, segment: 'mid' },
    },
  },
  Honda: {
    defaultFactor: 1.05,
    models: {
      Accord: { factor: 1.1, segment: 'mid' },
      'CR-V': { factor: 1.12, segment: 'suv' },
      Civic: { factor: 1.02, segment: 'mid' },
      'HR-V': { factor: 1.08, segment: 'suv' },
      Jazz: { factor: 0.96, segment: 'economy' },
      Pilot: { factor: 1.22, segment: 'suv' },
    },
  },
  Hyundai: {
    defaultFactor: 0.98,
    models: {
      Accent: { factor: 0.92, segment: 'economy' },
      Elantra: { factor: 0.98, segment: 'mid' },
      Getz: { factor: 0.88, segment: 'economy' },
      i30: { factor: 0.96, segment: 'mid' },
      'Santa Fe': { factor: 1.1, segment: 'suv' },
      Sonata: { factor: 1.02, segment: 'mid' },
      Tucson: { factor: 1.06, segment: 'suv' },
    },
  },
  Kia: {
    defaultFactor: 0.98,
    models: {
      Carens: { factor: 0.98, segment: 'mid' },
      Ceed: { factor: 0.96, segment: 'mid' },
      Cerato: { factor: 0.96, segment: 'mid' },
      Optima: { factor: 1.02, segment: 'mid' },
      Sorento: { factor: 1.12, segment: 'suv' },
      Sportage: { factor: 1.06, segment: 'suv' },
      Stonic: { factor: 1, segment: 'suv' },
    },
  },
  Lexus: {
    defaultFactor: 1.24,
    models: {
      ES: { factor: 1.2, segment: 'premium' },
      GS: { factor: 1.24, segment: 'premium' },
      GX: { factor: 1.34, segment: 'suv' },
      IS: { factor: 1.18, segment: 'premium' },
      LX: { factor: 1.48, segment: 'suv' },
      NX: { factor: 1.24, segment: 'suv' },
      RX: { factor: 1.3, segment: 'suv' },
    },
  },
  Mazda: {
    defaultFactor: 1.03,
    models: {
      '3': { factor: 0.98, segment: 'mid' },
      '5': { factor: 1.02, segment: 'mid' },
      '6': { factor: 1.08, segment: 'mid' },
      'CX-3': { factor: 1.02, segment: 'suv' },
      'CX-5': { factor: 1.08, segment: 'suv' },
      'CX-7': { factor: 1.12, segment: 'suv' },
      'CX-9': { factor: 1.18, segment: 'suv' },
    },
  },
  'Mercedes-Benz': {
    defaultFactor: 1.24,
    models: {
      'A-Class': { factor: 1.14, segment: 'premium' },
      'C-Class': { factor: 1.2, segment: 'premium' },
      CLA: { factor: 1.18, segment: 'premium' },
      CLS: { factor: 1.3, segment: 'premium' },
      'E-Class': { factor: 1.28, segment: 'premium' },
      GLA: { factor: 1.22, segment: 'suv' },
      GLC: { factor: 1.3, segment: 'suv' },
      GLE: { factor: 1.4, segment: 'suv' },
      'S-Class': { factor: 1.5, segment: 'premium' },
      Vito: { factor: 1.18, segment: 'commercial' },
    },
  },
  Mitsubishi: {
    defaultFactor: 0.97,
    models: {
      ASX: { factor: 0.98, segment: 'suv' },
      Galant: { factor: 0.96, segment: 'mid' },
      L200: { factor: 1.08, segment: 'commercial' },
      Lancer: { factor: 0.94, segment: 'mid' },
      Outlander: { factor: 1.08, segment: 'suv' },
      Pajero: { factor: 1.18, segment: 'suv' },
    },
  },
  Nissan: {
    defaultFactor: 1.02,
    models: {
      Almera: { factor: 0.92, segment: 'economy' },
      Juke: { factor: 1.02, segment: 'suv' },
      Leaf: { factor: 1.08, segment: 'electric' },
      Micra: { factor: 0.9, segment: 'economy' },
      Murano: { factor: 1.16, segment: 'suv' },
      Qashqai: { factor: 1.06, segment: 'suv' },
      Rogue: { factor: 1.08, segment: 'suv' },
      'X-Trail': { factor: 1.1, segment: 'suv' },
    },
  },
  Opel: {
    defaultFactor: 0.97,
    models: {
      Astra: { factor: 0.96, segment: 'mid' },
      Combo: { factor: 1.02, segment: 'commercial' },
      Corsa: { factor: 0.9, segment: 'economy' },
      Insignia: { factor: 1.02, segment: 'mid' },
      Meriva: { factor: 0.96, segment: 'mid' },
      Omega: { factor: 1, segment: 'mid' },
      Vectra: { factor: 0.98, segment: 'mid' },
      Zafira: { factor: 1.02, segment: 'mid' },
    },
  },
  Peugeot: {
    defaultFactor: 0.99,
    models: {
      '206': { factor: 0.88, segment: 'economy' },
      '207': { factor: 0.9, segment: 'economy' },
      '208': { factor: 0.92, segment: 'economy' },
      '301': { factor: 0.92, segment: 'economy' },
      '308': { factor: 0.98, segment: 'mid' },
      '407': { factor: 1.02, segment: 'mid' },
      '508': { factor: 1.08, segment: 'mid' },
      '3008': { factor: 1.08, segment: 'suv' },
      '5008': { factor: 1.12, segment: 'suv' },
    },
  },
  Renault: {
    defaultFactor: 0.96,
    models: {
      Clio: { factor: 0.9, segment: 'economy' },
      Duster: { factor: 1.02, segment: 'suv' },
      Fluence: { factor: 0.96, segment: 'mid' },
      Kangoo: { factor: 0.98, segment: 'commercial' },
      Laguna: { factor: 1.02, segment: 'mid' },
      Logan: { factor: 0.88, segment: 'economy' },
      Megane: { factor: 0.96, segment: 'mid' },
      Scenic: { factor: 1, segment: 'mid' },
    },
  },
  Skoda: {
    defaultFactor: 0.97,
    models: {
      Fabia: { factor: 0.9, segment: 'economy' },
      Kamiq: { factor: 1.02, segment: 'suv' },
      Karoq: { factor: 1.06, segment: 'suv' },
      Kodiaq: { factor: 1.12, segment: 'suv' },
      Octavia: { factor: 0.98, segment: 'mid' },
      Rapid: { factor: 0.94, segment: 'mid' },
      Superb: { factor: 1.08, segment: 'mid' },
    },
  },
  Subaru: {
    defaultFactor: 1.05,
    models: {
      Forester: { factor: 1.1, segment: 'suv' },
      Impreza: { factor: 1.02, segment: 'mid' },
      Legacy: { factor: 1.06, segment: 'mid' },
      Outback: { factor: 1.14, segment: 'suv' },
      Tribeca: { factor: 1.18, segment: 'suv' },
      XV: { factor: 1.08, segment: 'suv' },
    },
  },
  Tesla: {
    defaultFactor: 1.28,
    models: {
      'Model 3': { factor: 1.22, segment: 'electric' },
      'Model S': { factor: 1.38, segment: 'electric' },
      'Model X': { factor: 1.44, segment: 'electric' },
      'Model Y': { factor: 1.3, segment: 'electric' },
    },
  },
  Toyota: {
    defaultFactor: 1.03,
    models: {
      Auris: { factor: 0.96, segment: 'mid' },
      Avalon: { factor: 1.14, segment: 'mid' },
      Avensis: { factor: 1.02, segment: 'mid' },
      Camry: { factor: 1.1, segment: 'mid' },
      Corolla: { factor: 0.98, segment: 'mid' },
      Highlander: { factor: 1.18, segment: 'suv' },
      'Land Cruiser': { factor: 1.34, segment: 'suv' },
      RAV4: { factor: 1.08, segment: 'suv' },
      Yaris: { factor: 0.92, segment: 'economy' },
    },
  },
  Volkswagen: {
    defaultFactor: 1.04,
    models: {
      Amarok: { factor: 1.14, segment: 'commercial' },
      Caddy: { factor: 1.02, segment: 'commercial' },
      Golf: { factor: 0.98, segment: 'mid' },
      Jetta: { factor: 1, segment: 'mid' },
      Passat: { factor: 1.08, segment: 'mid' },
      Polo: { factor: 0.94, segment: 'economy' },
      Tiguan: { factor: 1.1, segment: 'suv' },
      Touareg: { factor: 1.26, segment: 'suv' },
      Transporter: { factor: 1.12, segment: 'commercial' },
    },
  },
  Volvo: {
    defaultFactor: 1.2,
    models: {
      S40: { factor: 1.12, segment: 'premium' },
      S60: { factor: 1.2, segment: 'premium' },
      S80: { factor: 1.28, segment: 'premium' },
      V50: { factor: 1.14, segment: 'premium' },
      V60: { factor: 1.18, segment: 'premium' },
      XC60: { factor: 1.28, segment: 'suv' },
      XC70: { factor: 1.24, segment: 'suv' },
      XC90: { factor: 1.4, segment: 'suv' },
    },
  },
};
