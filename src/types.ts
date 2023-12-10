
export interface Settings {
    title: string
    subTitle: string
  }

export interface Data {
    name: string
    value: number
    pivot: string
    color: string
}
export interface Dataseries {
    label: string
    averageLatest: number
    cutout: string
    sections: Data[][]
    // not input values
    data: number[]
    datalabels: any
    backgroundColor: string[]
}

export interface InputData {
    settings: Settings
    dataseries: Dataseries[]
}