import {
  DEFAULT_MODEL_YEAR_PRICING,
  MODEL_YEAR_PRICING_CATALOG,
  type YearGroup,
} from '@/data/model-year-pricing-catalog';
import {
  OPERATIONS,
  PARTS,
  type CatalogPart,
  type OperationCode,
  type PartCode,
} from '@/data/pricing-catalog';
import { VEHICLE_OPTIONS, type VehicleBrand } from '@/data/vehicle-options';

export type { OperationCode, PartCode } from '@/data/pricing-catalog';

export type VehiclePricingContext = {
  brand: string | null;
  model: string | null;
  year: number | null;
  yearGroup: YearGroup;
  segment: string;
  priceSource: 'model_year_catalog' | 'brand_segment_catalog' | 'default_catalog';
};

function normalizeVehicleText(vehicle: string) {
  return vehicle.trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveBrandAndModel(vehicle: string) {
  const normalized = normalizeVehicleText(vehicle);
  const brands = Object.keys(VEHICLE_OPTIONS).sort((left, right) => right.length - left.length);

  for (const brand of brands) {
    const brandNormalized = brand.toLowerCase();
    if (!normalized.includes(brandNormalized)) {
      continue;
    }

    const models = VEHICLE_OPTIONS[brand as VehicleBrand];
    const modelEntries = [...models].sort((left, right) => right.length - left.length);
    const resolvedModel = modelEntries.find((model) => normalized.includes(model.toLowerCase()));

    return {
      brand,
      model: resolvedModel ?? null,
    };
  }

  return {
    brand: null,
    model: null,
  };
}

function resolveYear(vehicle: string) {
  const match = vehicle.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function resolveYearGroup(year: number | null): YearGroup {
  if (!year || year <= 2012) return '2008-2012';
  if (year <= 2017) return '2013-2017';
  if (year <= 2021) return '2018-2021';
  return '2022+';
}

function roundMoney(value: number) {
  return Math.round(value / 50) * 50;
}

export function normalizePartCode(input?: string): PartCode {
  const text = input?.trim().toLowerCase() || '';

  const directMatch = (Object.keys(PARTS) as PartCode[]).find((partCode) => text === partCode);
  if (directMatch) {
    return directMatch;
  }

  const entry = (Object.entries(PARTS) as Array<[PartCode, CatalogPart]>).find(([, part]) =>
    part.aliases.some((alias) => text.includes(alias))
  );

  return entry?.[0] ?? 'unknown_part';
}

export function normalizeOperationCode(input?: string): OperationCode {
  const text = input?.trim().toLowerCase() || '';

  if (text.includes('replace') && text.includes('paint')) return 'replace_and_paint';
  if (text.includes('repair') && text.includes('paint')) return 'repair_and_paint';
  if (text.includes('Р·Р°РјС–') && text.includes('С„Р°СЂР±')) return 'replace_and_paint';
  if (text.includes('СЂРµРјРѕРЅС‚') && text.includes('С„Р°СЂР±')) return 'repair_and_paint';
  if (text.includes('С„Р°СЂР±')) return 'paint';
  if (text.includes('РєР°Р»С–Р±СЂ') || text.includes('calibr')) return 'calibration';
  if (text.includes('РґС–Р°РіРЅРѕСЃС‚') || text.includes('diagnost')) return 'diagnostics';
  if (text.includes('СЂРёС…С‚Сѓ') || text.includes('straight')) return 'straightening';
  if (text.includes('Р·Р°РјС–') || text.includes('replace')) return 'replace';
  if (text.includes('СЂРµРјРѕРЅС‚') || text.includes('repair')) return 'repair';

  return 'repair';
}

export function getPartLabel(partCode: PartCode, fallback?: string) {
  return PARTS[partCode].label || fallback || 'Невідома деталь';
}

export function getOperationLabel(operationCode: OperationCode) {
  return OPERATIONS[operationCode].label;
}

function resolvePricingRule(vehicle: string) {
  const { brand, model } = resolveBrandAndModel(vehicle);
  const year = resolveYear(vehicle);
  const yearGroup = resolveYearGroup(year);

  if (brand && model) {
    const modelRule = MODEL_YEAR_PRICING_CATALOG[brand]?.models[model]?.[yearGroup];
    if (modelRule) {
      return {
        brand,
        model,
        year,
        yearGroup,
        segment: modelRule.segment,
        priceSource: 'model_year_catalog' as const,
        rule: modelRule,
      };
    }
  }

  if (brand) {
    const brandCatalog = MODEL_YEAR_PRICING_CATALOG[brand];
    const fallbackModel = Object.values(brandCatalog?.models ?? {})[0]?.[yearGroup];
    if (fallbackModel) {
      return {
        brand,
        model,
        year,
        yearGroup,
        segment: fallbackModel.segment,
        priceSource: 'brand_segment_catalog' as const,
        rule: fallbackModel,
      };
    }
  }

  return {
    brand,
    model,
    year,
    yearGroup,
    segment: DEFAULT_MODEL_YEAR_PRICING.segment,
    priceSource: 'default_catalog' as const,
    rule: DEFAULT_MODEL_YEAR_PRICING,
  };
}

export function getVehiclePricingContext(vehicle: string): VehiclePricingContext {
  const resolved = resolvePricingRule(vehicle);

  return {
    brand: resolved.brand,
    model: resolved.model,
    year: resolved.year,
    yearGroup: resolved.yearGroup,
    segment: resolved.segment,
    priceSource: resolved.priceSource,
  };
}

export function calculateLineItemPrices(params: {
  partCode: PartCode;
  operationCode: OperationCode;
  vehicle: string;
}) {
  const { partCode, operationCode, vehicle } = params;
  const resolved = resolvePricingRule(vehicle);
  const operationRule = resolved.rule.operationPrices[operationCode];
  const partReplacementPrice =
    partCode === 'unknown_part' ? 0 : resolved.rule.partPrices[partCode];

  const partPrice =
    operationCode === 'replace' || operationCode === 'replace_and_paint'
      ? partReplacementPrice + operationRule.materialPrice
      : operationRule.materialPrice;

  return {
    partPrice: String(roundMoney(partPrice)),
    laborPrice: String(roundMoney(operationRule.laborPrice)),
    currency: 'UAH',
    pricingContext: {
      brand: resolved.brand,
      model: resolved.model,
      year: resolved.year,
      yearGroup: resolved.yearGroup,
      segment: resolved.segment,
      priceSource: resolved.priceSource,
    },
  };
}
