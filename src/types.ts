import type { Chart } from 'chart.js/auto';

export interface Settings {
    title: string
    subTitle: string
    columnLayout: boolean
    timeseries: boolean
  }

export interface Data {
    label: string
    value: number
    pivot: string
    color: string
}
export interface Dataseries {
    label: string
    order: number
    chartName: string
    averageLatest: number
    cutout: string
    sections: Data[][]
    // not input values
    needleValue: number 
    chartInstance: Chart
    range: number
    ranges: number[]
    data: number[]
    datalabels: any
    backgroundColor: string[]
}

export interface InputData {
    settings: Settings
    dataseries: Dataseries[]
}