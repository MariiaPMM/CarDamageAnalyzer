import {
  calculateLineItemPrices,
  getVehiclePricingContext,
  getOperationLabel,
  getPartLabel,
  normalizeOperationCode,
  normalizePartCode,
} from '@/lib/pricing';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5-mini';

type AiLineItem = {
  part?: string;
  zone?: string;
  damage?: string;
  operation?: string;
  note?: string;
};

type AiValidation = {
  hasVehicle?: boolean;
  error?: string;
};

export type EstimateLineItem = {
  part: string;
  zone: string;
  damage: string;
  work: string;
  partPrice: string;
  laborPrice: string;
  currency: string;
  note: string;
};

export type DamageAnalysis = {
  validation: {
    hasVehicle: boolean;
    error: string;
  };
  vehicle: {
    makeModel: string;
    source: 'user_input' | 'ai_estimated';
    confidence: 'high' | 'medium' | 'low';
  };
  damagedZones: string[];
  damageSummary: string;
  repairActions: string[];
  lineItems: EstimateLineItem[];
  estimatedCost: {
    amount: string;
    currency: string;
    note: string;
  };
};

type AnalyzePhotoParams = {
  photos: Array<{
    base64Data: string;
    mimeType: string;
  }>;
  vehicleModelInput?: string;
};

function buildPrompt(vehicleModelInput?: string) {
  const modelHint = vehicleModelInput?.trim()
    ? `Користувач вказав авто: ${vehicleModelInput.trim()}. Використай це як основний контекст для визначення деталей.`
    : 'Користувач не вказав авто. Спробуй самостійно визначити марку, модель і приблизний рік по фото. Якщо не впевнений, знизь confidence.';

  return [
    'Проаналізуй фото пошкодженого автомобіля українською мовою.',
    modelHint,
    'Поверни тільки JSON без жодного тексту поза JSON.',
    'Важливо: не вигадуй ціни. Ціни рахує окремий локальний прайс-модуль, не ти.',
    'Спочатку перевір, чи на фото взагалі є автомобіль.',
    'Якщо автомобіля немає, або він нечитабельний, поверни hasVehicle=false і коротку помилку.',
    'Якщо автомобіль є, поверни hasVehicle=true і заповни решту структури.',
    'Тобі треба:',
    '1. Визначити авто або використати введені дані користувача.',
    '2. Визначити пошкоджені зони.',
    '3. Коротко описати характер пошкодження.',
    '4. Скласти список робіт для ремонту.',
    '5. Для кожної пошкодженої деталі повернути назву деталі, зону, характер пошкодження, тип операції та примітку.',
    'Допустимі типи операції:',
    'replace, repair, paint, replace_and_paint, repair_and_paint, calibration, diagnostics, straightening',
    'JSON формат:',
    '{',
    '  "validation": {',
    '    "hasVehicle": true,',
    '    "error": "string"',
    '  },',
    '  "vehicle": {',
    '    "makeModel": "string",',
    '    "source": "user_input | ai_estimated",',
    '    "confidence": "high | medium | low"',
    '  },',
    '  "damagedZones": ["string"],',
    '  "damageSummary": "string",',
    '  "repairActions": ["string"],',
    '  "lineItems": [',
    '    {',
    '      "part": "string",',
    '      "zone": "string",',
    '      "damage": "string",',
    '      "operation": "string from allowed list",',
    '      "note": "string"',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}

function normalizeLineItems(items: unknown, vehicle: string): EstimateLineItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const value = item as AiLineItem;
      const partCode = normalizePartCode(value.part);
      if (partCode === 'unknown_part') {
        return null;
      }
      const operationCode = normalizeOperationCode(value.operation);
      const pricing = calculateLineItemPrices({
        partCode,
        operationCode,
        vehicle,
      });

      return {
        part: getPartLabel(partCode, value.part?.trim()),
        zone: value.zone?.trim() || 'Не вказано',
        damage: value.damage?.trim() || 'Не вказано',
        work: getOperationLabel(operationCode),
        partPrice: pricing.partPrice,
        laborPrice: pricing.laborPrice,
        currency: pricing.currency,
        note: value.note?.trim() || 'Ціну розраховано з локального довідника, не з AI.',
      };
    })
    .filter((item): item is EstimateLineItem => Boolean(item && item.part && item.work));
}

function sumLineItems(lineItems: EstimateLineItem[]) {
  const total = lineItems.reduce((sum, item) => {
    const part = Number(item.partPrice) || 0;
    const labor = Number(item.laborPrice) || 0;
    return sum + part + labor;
  }, 0);

  return String(total);
}

export async function analyzeCarDamagePhotos({
  photos,
  vehicleModelInput,
}: AnalyzePhotoParams): Promise<DamageAnalysis> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const model = process.env.EXPO_PUBLIC_OPENAI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error(
      'Не знайдено API ключ. Відкрий файл .env у корені проєкту і додай EXPO_PUBLIC_OPENAI_API_KEY.'
    );
  }

  if (!photos.length) {
    throw new Error('Не додано жодного фото для аналізу.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      text: {
        format: {
          type: 'json_object',
        },
      },
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildPrompt(vehicleModelInput),
            },
            ...photos.map((photo, index) => ({
              type: 'input_image' as const,
              image_url: `data:${photo.mimeType};base64,${photo.base64Data}`,
              detail: index === 0 ? ('high' as const) : ('low' as const),
            })),
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    try {
      const parsed = JSON.parse(errorText) as {
        error?: {
          code?: string;
          message?: string;
        };
      };

      if (parsed.error?.code === 'insufficient_quota') {
        throw new Error(
          'У акаунті OpenAI немає доступних API credits або вичерпано ліміт. Додай баланс у Platform Billing.'
        );
      }

      if (parsed.error?.code === 'invalid_value') {
        throw new Error(
          'OpenAI не зміг прочитати це зображення. Спробуй інше фото або JPEG/PNG нормальної якості.'
        );
      }

      if (parsed.error?.message) {
        throw new Error(parsed.error.message);
      }
    } catch (parseError) {
      if (parseError instanceof Error) {
        throw parseError;
      }
    }

    throw new Error(errorText || 'OpenAI API повернув помилку.');
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  const rawText =
    (typeof data.output_text === 'string' && data.output_text.trim()) ||
    data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
      .map((item) => item.text?.trim())
      .filter(Boolean)
      .join('\n\n');

  if (!rawText) {
    throw new Error('Модель не повернула текстовий результат.');
  }

  let parsedAnalysis: unknown;

  try {
    parsedAnalysis = JSON.parse(rawText);
  } catch {
    throw new Error('AI повернув неструктурований результат. Спробуй ще раз.');
  }

  const analysis = parsedAnalysis as {
    validation?: AiValidation;
    vehicle?: DamageAnalysis['vehicle'];
    damagedZones?: string[];
    damageSummary?: string;
    repairActions?: string[];
    lineItems?: AiLineItem[];
  };

  const validation = {
    hasVehicle: Boolean(analysis.validation?.hasVehicle),
    error:
      analysis.validation?.error?.trim() ||
      'На фото не вдалося надійно визначити автомобіль. Спробуй перефотографувати.',
  };

  if (!validation.hasVehicle) {
    throw new Error(validation.error);
  }

  const resolvedVehicle =
    analysis.vehicle?.makeModel?.trim() || vehicleModelInput?.trim() || 'Не визначено';
  const lineItems = normalizeLineItems(analysis.lineItems, resolvedVehicle);
  const pricingContext = getVehiclePricingContext(resolvedVehicle);
  const pricingTarget = pricingContext.model
    ? `${pricingContext.brand} ${pricingContext.model}`
    : pricingContext.brand || 'базовий рівень прайсу';
  const yearGroupLabel = pricingContext.yearGroup;
  const segmentLabel = pricingContext.segment;
  const lineItemsWithPricingNote = lineItems.map((item) => ({
    ...item,
    note: `${item.note} Розрахунок виконано для ${pricingTarget}, група років ${yearGroupLabel}.`,
  }));
  const priceSourceLabel =
    pricingContext.priceSource === 'model_year_catalog'
      ? 'за каталогом моделі та групи років'
      : pricingContext.priceSource === 'brand_segment_catalog'
        ? 'за брендовим профілем у межах групи років'
      : 'за базовим прайс-каталогом';
  const estimateNote = `Орієнтовну суму розраховано локально ${priceSourceLabel} для ${pricingTarget}. Використано ринковий профіль сегмента ${segmentLabel} та групи років ${yearGroupLabel}, сформований на основі відкритих прайсів українських СТО. Для кожної деталі та операції застосовано фіксовані ціни з внутрішнього каталогу, а не AI-оцінку. Це попередня оцінка для ознайомлення, а не офіційний кошторис СТО.`;

  return {
    validation,
    vehicle: {
      makeModel: resolvedVehicle,
      source:
        analysis.vehicle?.source === 'user_input' || analysis.vehicle?.source === 'ai_estimated'
          ? analysis.vehicle.source
          : vehicleModelInput?.trim()
            ? 'user_input'
            : 'ai_estimated',
      confidence:
        analysis.vehicle?.confidence === 'high' ||
        analysis.vehicle?.confidence === 'medium' ||
        analysis.vehicle?.confidence === 'low'
          ? analysis.vehicle.confidence
          : vehicleModelInput?.trim()
            ? 'high'
            : 'low',
    },
    damagedZones:
      analysis.damagedZones?.filter((item): item is string => typeof item === 'string') ?? [],
    damageSummary: analysis.damageSummary?.trim() || 'AI не зміг коротко описати пошкодження.',
    repairActions:
      analysis.repairActions?.filter((item): item is string => typeof item === 'string') ?? [],
    lineItems: lineItemsWithPricingNote,
    estimatedCost: {
      amount: sumLineItems(lineItemsWithPricingNote),
      currency: 'UAH',
      note: estimateNote,
    },
  };
}

export async function analyzeCarDamagePhoto(params: {
  base64Data: string;
  mimeType: string;
  vehicleModelInput?: string;
}) {
  return analyzeCarDamagePhotos({
    photos: [
      {
        base64Data: params.base64Data,
        mimeType: params.mimeType,
      },
    ],
    vehicleModelInput: params.vehicleModelInput,
  });
}

export function getOpenAISetupState() {
  return {
    hasApiKey: Boolean(process.env.EXPO_PUBLIC_OPENAI_API_KEY),
    model: process.env.EXPO_PUBLIC_OPENAI_MODEL || DEFAULT_MODEL,
  };
}
