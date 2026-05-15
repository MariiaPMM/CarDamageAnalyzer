export type PartCode =
  | 'front_bumper'
  | 'rear_bumper'
  | 'bumper_grille'
  | 'hood'
  | 'left_headlight'
  | 'right_headlight'
  | 'left_fender'
  | 'right_fender'
  | 'left_front_door'
  | 'right_front_door'
  | 'left_rear_door'
  | 'right_rear_door'
  | 'left_mirror'
  | 'right_mirror'
  | 'radiator_support'
  | 'left_quarter_panel'
  | 'right_quarter_panel'
  | 'trunk_lid'
  | 'wheel_rim'
  | 'parking_sensor'
  | 'unknown_part';

export type OperationCode =
  | 'replace'
  | 'repair'
  | 'paint'
  | 'replace_and_paint'
  | 'repair_and_paint'
  | 'calibration'
  | 'diagnostics'
  | 'straightening';

export type CatalogPart = {
  label: string;
  basePrice: number;
  aliases: string[];
};

export type LaborRule = {
  label: string;
  laborPrice: number;
  materialPrice: number;
};

export const PARTS: Record<PartCode, CatalogPart> = {
  front_bumper: {
    label: 'Передній бампер',
    basePrice: 3200,
    aliases: ['передній бампер', 'бампер передній', 'front bumper'],
  },
  rear_bumper: {
    label: 'Задній бампер',
    basePrice: 3000,
    aliases: ['задній бампер', 'rear bumper'],
  },
  bumper_grille: {
    label: 'Решітка радіатора',
    basePrice: 2500,
    aliases: ['решітка', 'решітка радіатора', 'grille', 'radiator grille'],
  },
  hood: {
    label: 'Капот',
    basePrice: 8500,
    aliases: ['капот', 'hood'],
  },
  left_headlight: {
    label: 'Ліва фара',
    basePrice: 7000,
    aliases: ['ліва фара', 'ліва передня фара', 'left headlight'],
  },
  right_headlight: {
    label: 'Права фара',
    basePrice: 7000,
    aliases: ['права фара', 'права передня фара', 'right headlight'],
  },
  left_fender: {
    label: 'Ліве крило',
    basePrice: 2200,
    aliases: ['ліве крило', 'left fender'],
  },
  right_fender: {
    label: 'Праве крило',
    basePrice: 2200,
    aliases: ['праве крило', 'right fender'],
  },
  left_front_door: {
    label: 'Ліві передні двері',
    basePrice: 8200,
    aliases: ['ліві передні двері', 'left front door'],
  },
  right_front_door: {
    label: 'Праві передні двері',
    basePrice: 8200,
    aliases: ['праві передні двері', 'right front door'],
  },
  left_rear_door: {
    label: 'Ліві задні двері',
    basePrice: 7000,
    aliases: ['ліві задні двері', 'left rear door'],
  },
  right_rear_door: {
    label: 'Праві задні двері',
    basePrice: 7000,
    aliases: ['праві задні двері', 'right rear door'],
  },
  left_mirror: {
    label: 'Ліве дзеркало',
    basePrice: 4200,
    aliases: ['ліве дзеркало', 'left mirror'],
  },
  right_mirror: {
    label: 'Праве дзеркало',
    basePrice: 4200,
    aliases: ['праве дзеркало', 'right mirror'],
  },
  radiator_support: {
    label: 'Панель телевізора',
    basePrice: 2600,
    aliases: ['телевізор', 'панель радіатора', 'radiator support'],
  },
  left_quarter_panel: {
    label: 'Ліве заднє крило',
    basePrice: 9000,
    aliases: ['ліве заднє крило', 'left quarter panel'],
  },
  right_quarter_panel: {
    label: 'Праве заднє крило',
    basePrice: 9000,
    aliases: ['праве заднє крило', 'right quarter panel'],
  },
  trunk_lid: {
    label: 'Кришка багажника',
    basePrice: 11200,
    aliases: ['багажник', 'кришка багажника', 'trunk lid'],
  },
  wheel_rim: {
    label: 'Диск колеса',
    basePrice: 5000,
    aliases: ['диск', 'диск колеса', 'rim', 'wheel rim'],
  },
  parking_sensor: {
    label: 'Парктронік / датчик',
    basePrice: 600,
    aliases: ['парктронік', 'датчик паркування', 'sensor', 'parking sensor'],
  },
  unknown_part: {
    label: 'Невідома деталь',
    basePrice: 0,
    aliases: [],
  },
};

export const OPERATIONS: Record<OperationCode, LaborRule> = {
  replace: { label: 'Заміна', laborPrice: 1000, materialPrice: 0 },
  repair: { label: 'Ремонт', laborPrice: 1800, materialPrice: 0 },
  paint: { label: 'Фарбування', laborPrice: 3800, materialPrice: 1200 },
  replace_and_paint: { label: 'Заміна і фарбування', laborPrice: 4800, materialPrice: 1200 },
  repair_and_paint: { label: 'Ремонт і фарбування', laborPrice: 4300, materialPrice: 1200 },
  calibration: { label: 'Калібрування', laborPrice: 1000, materialPrice: 0 },
  diagnostics: { label: 'Діагностика', laborPrice: 600, materialPrice: 0 },
  straightening: { label: 'Рихтування', laborPrice: 2500, materialPrice: 0 },
};
