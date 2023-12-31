/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type Title = string;
export type Subtitle = string;
export type VerticalLayout = boolean;
export type Label = string;
/**
 * How big in percent should the hole in the middle of the doughnut be? Set to 0% for Pie Chart.
 */
export type DoghnutHoleSize = string;
/**
 * Calculate the average over the given number of newest rows. (If pivoted, then per each of the pivot dataseries.) If not specified then the latest value is shown without modification.
 */
export type AverageLatestValues = number;
/**
 * Background color for each section. This Array is one shorter than the number of sections.
 */
export type SectionBackgroundColors = string[];
/**
 * Should be a chosen constant and usually not be assigned dynamically by a table column value.
 */
export type SectionLabel = string;
export type Value = number;
/**
 * Should be a chosen constant and usually not be assigned dynamically by a table column value.
 */
export type SectionColor = string;
/**
 * You can specify a column in the input data to autogenerate dataseries for each distinct entry in this column. E.g. if you have a table with columns [city, timestamp, temperature] and specify 'city' as pivot column, then you will get a doughnut for each city.
 */
export type PivotColumn = string;
/**
 * One Doghnut ring will be drawn for the latest row in the chosen table. (If you chose averageLatest > 1, then the last 'averageLatest' rows will be aggregated to one row first.)
 */
export type SectionsOfTheDoughnut = {
  name?: SectionLabel;
  value: Value;
  color?: SectionColor;
  pivot?: PivotColumn;
  [k: string]: unknown;
}[];
/**
 * The Table with columns to display as sections in a Doughnut.
 */
export type Data = SectionsOfTheDoughnut[];
export type Doughnuts = {
  label: Label;
  cutout?: DoghnutHoleSize;
  averageLatest?: AverageLatestValues;
  backgroundColors?: SectionBackgroundColors;
  sections?: Data;
  [k: string]: unknown;
}[];

export interface DoughnutChartConfiguration {
  settings?: GlobalSettings;
  dataseries?: Doughnuts;
  [k: string]: unknown;
}
export interface GlobalSettings {
  title?: Title;
  subTitle?: Subtitle;
  columnLayout?: VerticalLayout;
  [k: string]: unknown;
}
