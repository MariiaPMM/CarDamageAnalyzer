import type { OperationCode, PartCode } from '@/data/pricing-catalog';
import { VEHICLE_PRICING_CATALOG, type VehicleSegment } from '@/data/vehicle-pricing';

type PricedPartCode = Exclude<PartCode, 'unknown_part'>;
type PartPriceMap = Record<PricedPartCode, number>;
type OperationPriceMap = Record<OperationCode, { laborPrice: number; materialPrice: number }>;

export type YearGroup = '2008-2012' | '2013-2017' | '2018-2021' | '2022+';

export type ModelYearPricingRule = {
  segment: VehicleSegment;
  yearGroup: YearGroup;
  partPrices: PartPriceMap;
  operationPrices: OperationPriceMap;
};

export type ModelYearPricingCatalog = Record<
  string,
  {
    brandSegment: VehicleSegment;
    models: Record<string, Record<YearGroup, ModelYearPricingRule>>;
  }
>;

type PartPreset = {
  frontBumper: number;
  hood: number;
  headlight: number;
  frontDoor: number;
  mirror: number;
  quarterPanel: number;
  wheelRim: number;
  parkingSensor: number;
};

type OperationPreset = {
  replace: number;
  repair: number;
  paint: number;
  paintMaterials: number;
  replaceAndPaint: number;
  replaceAndPaintMaterials: number;
  repairAndPaint: number;
  repairAndPaintMaterials: number;
  calibration: number;
  diagnostics: number;
  straightening: number;
};

function roundTo50(value: number) {
  return Math.round(value / 50) * 50;
}

function buildPartPrices(preset: PartPreset): PartPriceMap {
  return {
    front_bumper: preset.frontBumper,
    rear_bumper: roundTo50(preset.frontBumper * 0.96),
    bumper_grille: roundTo50(preset.frontBumper * 0.52),
    hood: preset.hood,
    left_headlight: preset.headlight,
    right_headlight: preset.headlight,
    left_fender: roundTo50(preset.frontBumper * 0.65),
    right_fender: roundTo50(preset.frontBumper * 0.65),
    left_front_door: preset.frontDoor,
    right_front_door: preset.frontDoor,
    left_rear_door: roundTo50(preset.frontDoor * 0.9),
    right_rear_door: roundTo50(preset.frontDoor * 0.9),
    left_mirror: preset.mirror,
    right_mirror: preset.mirror,
    radiator_support: roundTo50(preset.frontBumper * 0.72),
    left_quarter_panel: preset.quarterPanel,
    right_quarter_panel: preset.quarterPanel,
    trunk_lid: roundTo50(preset.quarterPanel * 1.06),
    wheel_rim: preset.wheelRim,
    parking_sensor: preset.parkingSensor,
  };
}

function buildOperationPrices(preset: OperationPreset): OperationPriceMap {
  return {
    replace: { laborPrice: preset.replace, materialPrice: 0 },
    repair: { laborPrice: preset.repair, materialPrice: 0 },
    paint: { laborPrice: preset.paint, materialPrice: preset.paintMaterials },
    replace_and_paint: {
      laborPrice: preset.replaceAndPaint,
      materialPrice: preset.replaceAndPaintMaterials,
    },
    repair_and_paint: {
      laborPrice: preset.repairAndPaint,
      materialPrice: preset.repairAndPaintMaterials,
    },
    calibration: { laborPrice: preset.calibration, materialPrice: 0 },
    diagnostics: { laborPrice: preset.diagnostics, materialPrice: 0 },
    straightening: { laborPrice: preset.straightening, materialPrice: 0 },
  };
}

function createRule(
  segment: VehicleSegment,
  yearGroup: YearGroup,
  partPreset: PartPreset,
  operationPreset: OperationPreset
): ModelYearPricingRule {
  return {
    segment,
    yearGroup,
    partPrices: buildPartPrices(partPreset),
    operationPrices: buildOperationPrices(operationPreset),
  };
}

const PART_PRESETS: Record<VehicleSegment, Record<YearGroup, PartPreset>> = {
  economy: {
    '2008-2012': { frontBumper: 3900, hood: 8400, headlight: 5200, frontDoor: 7800, mirror: 2400, quarterPanel: 9800, wheelRim: 3600, parkingSensor: 700 },
    '2013-2017': { frontBumper: 4800, hood: 9800, headlight: 6600, frontDoor: 9300, mirror: 3000, quarterPanel: 11200, wheelRim: 4400, parkingSensor: 900 },
    '2018-2021': { frontBumper: 5900, hood: 11400, headlight: 7900, frontDoor: 10800, mirror: 3700, quarterPanel: 12900, wheelRim: 5200, parkingSensor: 1200 },
    '2022+': { frontBumper: 7000, hood: 12800, headlight: 9200, frontDoor: 12100, mirror: 4300, quarterPanel: 14300, wheelRim: 5900, parkingSensor: 1450 },
  },
  mid: {
    '2008-2012': { frontBumper: 5100, hood: 10600, headlight: 7100, frontDoor: 9500, mirror: 3200, quarterPanel: 11900, wheelRim: 4700, parkingSensor: 950 },
    '2013-2017': { frontBumper: 6200, hood: 12400, headlight: 8900, frontDoor: 11300, mirror: 4100, quarterPanel: 13900, wheelRim: 5700, parkingSensor: 1250 },
    '2018-2021': { frontBumper: 7600, hood: 14700, headlight: 11700, frontDoor: 13700, mirror: 5600, quarterPanel: 16700, wheelRim: 7300, parkingSensor: 1700 },
    '2022+': { frontBumper: 8900, hood: 17100, headlight: 14200, frontDoor: 15800, mirror: 6600, quarterPanel: 19100, wheelRim: 8600, parkingSensor: 2100 },
  },
  premium: {
    '2008-2012': { frontBumper: 8600, hood: 16600, headlight: 14500, frontDoor: 16500, mirror: 7200, quarterPanel: 20500, wheelRim: 9800, parkingSensor: 1900 },
    '2013-2017': { frontBumper: 10800, hood: 20600, headlight: 19400, frontDoor: 20400, mirror: 8900, quarterPanel: 25200, wheelRim: 11800, parkingSensor: 2400 },
    '2018-2021': { frontBumper: 13100, hood: 24400, headlight: 25400, frontDoor: 23900, mirror: 10100, quarterPanel: 28900, wheelRim: 13900, parkingSensor: 2950 },
    '2022+': { frontBumper: 15200, hood: 28200, headlight: 31200, frontDoor: 27400, mirror: 11600, quarterPanel: 32600, wheelRim: 15800, parkingSensor: 3400 },
  },
  suv: {
    '2008-2012': { frontBumper: 6800, hood: 13600, headlight: 11200, frontDoor: 14000, mirror: 5900, quarterPanel: 17600, wheelRim: 7600, parkingSensor: 1500 },
    '2013-2017': { frontBumper: 8400, hood: 16400, headlight: 14400, frontDoor: 16700, mirror: 7200, quarterPanel: 20700, wheelRim: 9000, parkingSensor: 1850 },
    '2018-2021': { frontBumper: 10200, hood: 19500, headlight: 18100, frontDoor: 19800, mirror: 8600, quarterPanel: 24400, wheelRim: 10800, parkingSensor: 2300 },
    '2022+': { frontBumper: 11800, hood: 22600, headlight: 21900, frontDoor: 23000, mirror: 9800, quarterPanel: 27800, wheelRim: 12600, parkingSensor: 2700 },
  },
  commercial: {
    '2008-2012': { frontBumper: 6200, hood: 13200, headlight: 9500, frontDoor: 13600, mirror: 5400, quarterPanel: 16800, wheelRim: 7000, parkingSensor: 1300 },
    '2013-2017': { frontBumper: 7600, hood: 15600, headlight: 11600, frontDoor: 16000, mirror: 6600, quarterPanel: 19700, wheelRim: 8400, parkingSensor: 1600 },
    '2018-2021': { frontBumper: 9200, hood: 18200, headlight: 14200, frontDoor: 18600, mirror: 7900, quarterPanel: 22800, wheelRim: 9800, parkingSensor: 1950 },
    '2022+': { frontBumper: 10800, hood: 20800, headlight: 17100, frontDoor: 21400, mirror: 9300, quarterPanel: 26200, wheelRim: 11400, parkingSensor: 2300 },
  },
  electric: {
    '2008-2012': { frontBumper: 9800, hood: 17800, headlight: 16800, frontDoor: 17800, mirror: 7800, quarterPanel: 22000, wheelRim: 10800, parkingSensor: 2200 },
    '2013-2017': { frontBumper: 11800, hood: 21400, headlight: 22100, frontDoor: 21200, mirror: 9500, quarterPanel: 26000, wheelRim: 12900, parkingSensor: 2700 },
    '2018-2021': { frontBumper: 13800, hood: 25200, headlight: 27600, frontDoor: 24900, mirror: 11200, quarterPanel: 30400, wheelRim: 14900, parkingSensor: 3200 },
    '2022+': { frontBumper: 15800, hood: 28900, headlight: 33200, frontDoor: 28600, mirror: 12900, quarterPanel: 34600, wheelRim: 17100, parkingSensor: 3700 },
  },
};

const OPERATION_PRESETS: Record<VehicleSegment, Record<YearGroup, OperationPreset>> = {
  economy: {
    '2008-2012': { replace: 900, repair: 1400, paint: 3400, paintMaterials: 1400, replaceAndPaint: 4300, replaceAndPaintMaterials: 1500, repairAndPaint: 4100, repairAndPaintMaterials: 1500, calibration: 900, diagnostics: 500, straightening: 1800 },
    '2013-2017': { replace: 1000, repair: 1550, paint: 3700, paintMaterials: 1500, replaceAndPaint: 4550, replaceAndPaintMaterials: 1600, repairAndPaint: 4350, repairAndPaintMaterials: 1600, calibration: 1000, diagnostics: 550, straightening: 1950 },
    '2018-2021': { replace: 1100, repair: 1700, paint: 4100, paintMaterials: 1650, replaceAndPaint: 5000, replaceAndPaintMaterials: 1750, repairAndPaint: 4800, repairAndPaintMaterials: 1750, calibration: 1150, diagnostics: 650, straightening: 2200 },
    '2022+': { replace: 1250, repair: 1850, paint: 4500, paintMaterials: 1800, replaceAndPaint: 5400, replaceAndPaintMaterials: 1900, repairAndPaint: 5200, repairAndPaintMaterials: 1900, calibration: 1300, diagnostics: 700, straightening: 2400 },
  },
  mid: {
    '2008-2012': { replace: 1000, repair: 1550, paint: 3900, paintMaterials: 1600, replaceAndPaint: 4700, replaceAndPaintMaterials: 1700, repairAndPaint: 4500, repairAndPaintMaterials: 1700, calibration: 1050, diagnostics: 600, straightening: 2100 },
    '2013-2017': { replace: 1150, repair: 1700, paint: 4300, paintMaterials: 1750, replaceAndPaint: 5150, replaceAndPaintMaterials: 1850, repairAndPaint: 4950, repairAndPaintMaterials: 1850, calibration: 1200, diagnostics: 700, straightening: 2300 },
    '2018-2021': { replace: 1300, repair: 1900, paint: 4700, paintMaterials: 1950, replaceAndPaint: 5600, replaceAndPaintMaterials: 2050, repairAndPaint: 5400, repairAndPaintMaterials: 2050, calibration: 1400, diagnostics: 800, straightening: 2500 },
    '2022+': { replace: 1450, repair: 2100, paint: 5100, paintMaterials: 2100, replaceAndPaint: 6100, replaceAndPaintMaterials: 2200, repairAndPaint: 5900, repairAndPaintMaterials: 2200, calibration: 1600, diagnostics: 900, straightening: 2800 },
  },
  premium: {
    '2008-2012': { replace: 1300, repair: 1900, paint: 4700, paintMaterials: 1900, replaceAndPaint: 5600, replaceAndPaintMaterials: 2000, repairAndPaint: 5400, repairAndPaintMaterials: 2000, calibration: 1600, diagnostics: 850, straightening: 2700 },
    '2013-2017': { replace: 1500, repair: 2200, paint: 5200, paintMaterials: 2100, replaceAndPaint: 6200, replaceAndPaintMaterials: 2200, repairAndPaint: 6000, repairAndPaintMaterials: 2200, calibration: 1900, diagnostics: 1000, straightening: 3100 },
    '2018-2021': { replace: 1700, repair: 2450, paint: 5700, paintMaterials: 2300, replaceAndPaint: 6800, replaceAndPaintMaterials: 2400, repairAndPaint: 6600, repairAndPaintMaterials: 2400, calibration: 2200, diagnostics: 1200, straightening: 3500 },
    '2022+': { replace: 1900, repair: 2700, paint: 6200, paintMaterials: 2500, replaceAndPaint: 7400, replaceAndPaintMaterials: 2600, repairAndPaint: 7200, repairAndPaintMaterials: 2600, calibration: 2500, diagnostics: 1350, straightening: 3900 },
  },
  suv: {
    '2008-2012': { replace: 1150, repair: 1700, paint: 4300, paintMaterials: 1750, replaceAndPaint: 5150, replaceAndPaintMaterials: 1850, repairAndPaint: 4950, repairAndPaintMaterials: 1850, calibration: 1300, diagnostics: 700, straightening: 2350 },
    '2013-2017': { replace: 1300, repair: 1900, paint: 4700, paintMaterials: 1900, replaceAndPaint: 5600, replaceAndPaintMaterials: 2000, repairAndPaint: 5400, repairAndPaintMaterials: 2000, calibration: 1500, diagnostics: 800, straightening: 2600 },
    '2018-2021': { replace: 1450, repair: 2100, paint: 5100, paintMaterials: 2050, replaceAndPaint: 6100, replaceAndPaintMaterials: 2150, repairAndPaint: 5900, repairAndPaintMaterials: 2150, calibration: 1750, diagnostics: 950, straightening: 2900 },
    '2022+': { replace: 1600, repair: 2300, paint: 5500, paintMaterials: 2200, replaceAndPaint: 6600, replaceAndPaintMaterials: 2300, repairAndPaint: 6400, repairAndPaintMaterials: 2300, calibration: 2000, diagnostics: 1100, straightening: 3200 },
  },
  commercial: {
    '2008-2012': { replace: 1200, repair: 1750, paint: 4400, paintMaterials: 1800, replaceAndPaint: 5300, replaceAndPaintMaterials: 1900, repairAndPaint: 5100, repairAndPaintMaterials: 1900, calibration: 1200, diagnostics: 700, straightening: 2600 },
    '2013-2017': { replace: 1350, repair: 1950, paint: 4800, paintMaterials: 1950, replaceAndPaint: 5750, replaceAndPaintMaterials: 2050, repairAndPaint: 5550, repairAndPaintMaterials: 2050, calibration: 1350, diagnostics: 800, straightening: 2850 },
    '2018-2021': { replace: 1500, repair: 2150, paint: 5200, paintMaterials: 2100, replaceAndPaint: 6200, replaceAndPaintMaterials: 2200, repairAndPaint: 6000, repairAndPaintMaterials: 2200, calibration: 1500, diagnostics: 900, straightening: 3150 },
    '2022+': { replace: 1650, repair: 2350, paint: 5600, paintMaterials: 2250, replaceAndPaint: 6700, replaceAndPaintMaterials: 2350, repairAndPaint: 6500, repairAndPaintMaterials: 2350, calibration: 1650, diagnostics: 1000, straightening: 3450 },
  },
  electric: {
    '2008-2012': { replace: 1400, repair: 2000, paint: 5000, paintMaterials: 2000, replaceAndPaint: 6000, replaceAndPaintMaterials: 2100, repairAndPaint: 5800, repairAndPaintMaterials: 2100, calibration: 2100, diagnostics: 1100, straightening: 2900 },
    '2013-2017': { replace: 1600, repair: 2250, paint: 5400, paintMaterials: 2200, replaceAndPaint: 6500, replaceAndPaintMaterials: 2300, repairAndPaint: 6300, repairAndPaintMaterials: 2300, calibration: 2500, diagnostics: 1250, straightening: 3300 },
    '2018-2021': { replace: 1800, repair: 2500, paint: 5900, paintMaterials: 2400, replaceAndPaint: 7100, replaceAndPaintMaterials: 2500, repairAndPaint: 6900, repairAndPaintMaterials: 2500, calibration: 2900, diagnostics: 1450, straightening: 3700 },
    '2022+': { replace: 2000, repair: 2800, paint: 6400, paintMaterials: 2600, replaceAndPaint: 7700, replaceAndPaintMaterials: 2700, repairAndPaint: 7500, repairAndPaintMaterials: 2700, calibration: 3300, diagnostics: 1650, straightening: 4100 },
  },
};

function getBrandDefaultSegment(brand: string): VehicleSegment {
  const models = Object.values(VEHICLE_PRICING_CATALOG[brand]?.models ?? {});
  if (!models.length) {
    return 'mid';
  }

  const counters = models.reduce<Record<VehicleSegment, number>>(
    (acc, model) => {
      acc[model.segment] += 1;
      return acc;
    },
    { economy: 0, mid: 0, premium: 0, suv: 0, commercial: 0, electric: 0 }
  );

  return (Object.entries(counters).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'mid') as VehicleSegment;
}

function buildCatalog(): ModelYearPricingCatalog {
  const catalog: ModelYearPricingCatalog = {};

  for (const [brand, brandRule] of Object.entries(VEHICLE_PRICING_CATALOG)) {
    const brandSegment = getBrandDefaultSegment(brand);
    const models = Object.fromEntries(
      Object.entries(brandRule.models).map(([model, modelRule]) => {
        const yearRules = Object.fromEntries(
          (Object.keys(PART_PRESETS[modelRule.segment]) as YearGroup[]).map((yearGroup) => [
            yearGroup,
            createRule(
              modelRule.segment,
              yearGroup,
              PART_PRESETS[modelRule.segment][yearGroup],
              OPERATION_PRESETS[modelRule.segment][yearGroup]
            ),
          ])
        ) as Record<YearGroup, ModelYearPricingRule>;

        return [model, yearRules];
      })
    ) as Record<string, Record<YearGroup, ModelYearPricingRule>>;

    catalog[brand] = { brandSegment, models };
  }

  return catalog;
}

export const MODEL_YEAR_PRICING_CATALOG = buildCatalog();
export const DEFAULT_MODEL_YEAR_PRICING = createRule(
  'mid',
  '2018-2021',
  PART_PRESETS.mid['2018-2021'],
  OPERATION_PRESETS.mid['2018-2021']
);
