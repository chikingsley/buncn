import { createParser } from "nuqs/server";
import { z } from "zod";

import { dataTableConfig } from "@/config/data-table";

import type {
  ExtendedColumnFilter,
  ExtendedColumnSort,
} from "@/types/data-table";

const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

export const getSortingStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  type SortArray = ExtendedColumnSort<TData>[];

  let validKeys: Set<string> | null;
  if (!columnIds) {
    validKeys = null;
  } else if (columnIds instanceof Set) {
    validKeys = columnIds;
  } else {
    validKeys = new Set(columnIds);
  }

  return createParser<SortArray>({
    parse: (value: string): SortArray | null => {
      try {
        const parsed = JSON.parse(value);
        const result = z.array(sortingItemSchema).safeParse(parsed);

        if (!result.success) {
          return null;
        }

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as SortArray;
      } catch {
        return null;
      }
    },
    serialize: (value: SortArray): string => JSON.stringify(value),
    eq: (a: SortArray, b: SortArray): boolean =>
      a.length === b.length &&
      a.every(
        (item, index) =>
          item.id === b[index]?.id && item.desc === b[index]?.desc
      ),
  });
};

const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
});

export type FilterItemSchema = z.infer<typeof filterItemSchema>;

export const getFiltersStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  type FilterArray = ExtendedColumnFilter<TData>[];

  let validKeys: Set<string> | null;
  if (!columnIds) {
    validKeys = null;
  } else if (columnIds instanceof Set) {
    validKeys = columnIds;
  } else {
    validKeys = new Set(columnIds);
  }

  return createParser<FilterArray>({
    parse: (value: string): FilterArray | null => {
      try {
        const parsed = JSON.parse(value);
        const result = z.array(filterItemSchema).safeParse(parsed);

        if (!result.success) {
          return null;
        }

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as FilterArray;
      } catch {
        return null;
      }
    },
    serialize: (value: FilterArray): string => JSON.stringify(value),
    eq: (a: FilterArray, b: FilterArray): boolean =>
      a.length === b.length &&
      a.every(
        (filter, index) =>
          filter.id === b[index]?.id &&
          filter.value === b[index]?.value &&
          filter.variant === b[index]?.variant &&
          filter.operator === b[index]?.operator
      ),
  });
};
