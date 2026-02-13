/** На фоне 5 колонок и 4 ряда ниш (повторяется по вертикали для новых рядов) */
export const WALL_COLUMNS = 5;
export const NICHES_PER_IMAGE_ROW = 4;
export const INITIAL_ROWS = NICHES_PER_IMAGE_ROW;
export const SLOTS_PER_ROW = WALL_COLUMNS;
export const MAX_SLOTS = 2000;

export type Slot = {
  id: number;
  imageUrl: string | null;
  createdAt: string | null;
  discordNick?: string | null;
};

export type SlotsData = {
  slots: Slot[];
  updatedAt: string;
};

/** Создать сетку на начальное количество рядов */
export function createEmptySlots(): Slot[] {
  return Array.from(
    { length: WALL_COLUMNS * INITIAL_ROWS },
    (_, i) => ({ id: i, imageUrl: null, createdAt: null, discordNick: null })
  );
}

/** Добавить один ряд пустых слотов (5 штук) в конец */
export function appendRow(slots: Slot[]): Slot[] {
  if (slots.length >= MAX_SLOTS) return slots;
  const startId = slots.length;
  const newRow = Array.from({ length: WALL_COLUMNS }, (_, i) => ({
    id: startId + i,
    imageUrl: null,
    createdAt: null,
    discordNick: null,
  }));
  return [...slots, ...newRow].slice(0, MAX_SLOTS);
}
