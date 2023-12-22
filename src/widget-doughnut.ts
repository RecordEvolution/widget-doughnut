import { html, css, LitElement, PropertyValueMap } from 'lit';
import { repeat } from 'lit/directives/repeat.js'
import { property, state } from 'lit/decorators.js';
// import * as echarts from "echarts";
import { InputData, Data, Dataseries } from './types.js';
import type { EChartsOption, GaugeSeriesOption, PieSeriesOption } from 'echarts';

// echarts.use([GaugeChart, CanvasRenderer]);

export class WidgetDoughnut extends LitElement {

  @property({ type: Object })
  inputData?: InputData = undefined

  @state()
  private canvasList: Map<string, { chart?: any, dataSets: Dataseries[] }> = new Map()

  resizeObserver: ResizeObserver
  boxes?: HTMLDivElement[]
  origWidth: number = 0
  origHeight: number = 0
  template: EChartsOption
  modifier: number = 1
  version: string = 'versionplaceholder'

  constructor() {
    super()
    this.resizeObserver = new ResizeObserver(this.adjustSizes.bind(this))
    this.resizeObserver.observe(this)

    this.template = {
      title: {
        text: 'Pie',
        left: 'center',
        textStyle: {
          fontSize: 10
        }
      },
      color: undefined,
      // toolbox: {
      //   show: true,
      //   feature: {
      //     mark: { show: true },
      //     saveAsImage: { show: true }
      //   }
      // },
      tooltip: {
        show: true
      },
      dataset: [{
        source: [
          { value: 1048, name: 'Search Engine' },
          { value: 735, name: 'Direct' },
          { value: 580, name: 'Email' },
          { value: 484, name: 'Union Ads' },
          { value: 300, name: 'Video Ads' }
        ],
      }],
      series: [
        {
          type: 'pie',
          animationType: 'expansion',
          animationTypeUpdate: 'transition',
          radius: ['20%', '60%'],
          center: ['50%', '50%'],
          itemStyle: {
            borderRadius: 5
          },
          roseType: undefined,
          label: {
            // formatter: (d: any) => d.value?.toFixed(),
            //position: 'inside'
            fontSize: 12,
            alignTo: 'none'
          }
        } as PieSeriesOption,
        {
          type: 'pie',
          animationType: 'expansion',
          animationTypeUpdate: 'transition',
          radius: ['20%', '60%'],
          center: ['50%', '50%'],
          itemStyle: {
            borderRadius: 5
          },
          roseType: undefined,
          label: { position: 'inside', formatter: '{d}%', fontSize: 18 },
          percentPrecision: 0
        } as PieSeriesOption
      ]
    };

  }

  update(changedProperties: Map<string, any>) {
    changedProperties.forEach((oldValue, propName) => {
      if (propName === 'inputData') {
        this.transformData()
        this.adjustSizes()
        this.applyData()
      }
    })

    super.update(changedProperties)
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    this.sizingSetup()
    this.transformData()
    this.adjustSizes()
    this.applyData()

  }

  sizingSetup() {
    if (this.origWidth !== 0 && this.origHeight !== 0) return

    this.boxes = Array.from(this?.shadowRoot?.querySelectorAll('.chart') as NodeListOf<HTMLDivElement>)
    if (!this.boxes.length) return
    this.origWidth = this.boxes?.map(b => b.getBoundingClientRect().width).reduce((p, c) => c > p ? c : p, 0) ?? 0
    this.origHeight = this.boxes?.map(b => b.getBoundingClientRect().height).reduce((p, c) => c > p ? c : p, 0) ?? 0

    if (this.origWidth > 0) this.origWidth += 16
    if (this.origHeight > 0) this.origHeight += 16
    // console.log('OrigWidth', this.origWidth, this.origHeight)

  }

  adjustSizes() {
    // console.log('adjustSizes')
    // if (!this.origHeight) return
    const container = this.shadowRoot?.querySelector('.doughnut-container') as HTMLDivElement
    if (!container) return
    const userWidth = container.getBoundingClientRect().width
    const userHeight = container.getBoundingClientRect().height
    const count = this.canvasList.size ?? 0

    const width = this.origWidth
    const height = this.origHeight
    if (!userHeight || !userWidth || !width || !height) return
    const fits = []
    for (let c = 1; c <= count; c++) {
      const r = Math.ceil(count / c)
      const uwgap = (userWidth - 12 * (c - 1))
      const uhgap = (userHeight - 12 * (r - 1))
      const m = uwgap / width / c
      const size = m * m * width * height * count
      if (r * m * height < uhgap) fits.push({ c, m, size, width, height, userWidth, userHeight })
    }

    for (let r = 1; r <= count; r++) {
      const c = Math.ceil(count / r)
      const uwgap = (userWidth - 12 * (c - 1))
      const uhgap = (userHeight - 12 * (r - 1))
      const m = uhgap / height / r
      const size = m * m * width * height * count
      if (c * m * width < uwgap) fits.push({ r, m, size, width, height, userWidth, userHeight })
    }

    const maxSize = fits.reduce((p, c) => c.size < p ? p : c.size, 0)
    const fit = fits.find(f => f.size === maxSize)
    const modifier = (fit?.m ?? 0)

    // console.log('FITS count', count, userWidth, userHeight, 'modifier', modifier, 'cols',fit?.c, 'rows', fit?.r, 'new size', fit?.size.toFixed(0), 'total space', (userWidth* userHeight).toFixed(0))

    this.boxes?.forEach(box => box.setAttribute("style", `width:${modifier * width}px; height:${modifier * height}px`))

    this.modifier = modifier

    this.canvasList.forEach((chartM: any, chartName: string) => {
      if (chartM.chart) chartM.chart.resize()
    })
  }

  async transformData() {

    if (!this?.inputData?.dataseries.length) return
    // reset all existing chart dataseries
    this.canvasList.forEach((chartM: any) => chartM.dataSets = [])
    this.inputData.dataseries.forEach(ds => {
      ds.label = ds.label ?? ''

      // pivot data
      const distincts = [...new Set(ds.sections?.flat()?.map((d: Data) => d.pivot))]
      // const derivedBgColors = tinycolor(ds.backgroundColors).monochromatic(distincts.length).map((c: any) => c.toHexString())

      if (distincts.length > 1) {
        distincts.forEach((piv, i) => {
          const pds: any = {
            label: ds.label + ' ' + piv,
            cutout: ds.cutout,
            sections: ds.sections?.map((d: Data[]) => d.filter(d => d.pivot === piv)).filter(d => d.length)
          }
          // If the chartName ends with #pivot# then create a seperate chart for each pivoted dataseries
          if (!this.canvasList.has(pds.label)) {
            // initialize new charts
            this.canvasList.set(pds.label, { chart: undefined, dataSets: [] as Dataseries[] })
          }
          this.canvasList.get(pds.label)?.dataSets.push(pds)
        })
      } else {
        if (!this.canvasList.has(ds.label)) {
          // initialize new charts
          this.canvasList.set(ds.label, { chart: undefined, dataSets: [] as Dataseries[] })
        }
        this.canvasList.get(ds.label)?.dataSets.push(ds)
      }
    })

    // filter latest values and calculate average
    this.canvasList.forEach(({ chart, dataSets }) => {
      dataSets.forEach(ds => {
        ds.data = []
        ds.backgroundColor = ds.sections?.[0]?.map(d => d.color) ?? []
        if (typeof ds.averageLatest !== 'number' || !isNaN(ds.averageLatest)) ds.averageLatest = 1
        ds.sections = ds.sections?.splice(-ds.averageLatest ?? -1)
        const numSections = Math.max(...ds.sections?.map(d => d.length))
        for (let i = 0; i < numSections; i++) {
          // array from i-th sections values
          const valueCol = ds.sections?.map((row: Data[]) => row?.[i]?.value).filter(v => v !== undefined)
          ds.data.push(valueCol.reduce((p, c) => p + c, 0) / valueCol.length)
        }
        // console.log('ready data', ds.label, ds.backgroundColor, ds.sections, ds.data)

        ds.datalabels = {
          color: '#FFF',
          formatter: (d: number) => d.toFixed()
        }
      })
    })
    // prevent duplicate transformation
    // this.inputData.dataseries = []
    // console.log('new doughnut datasets', this.canvasList)
  }

  applyData() {
    const modifier = this.modifier
    this.setupCharts()
    this.canvasList.forEach((chartM: any) => {
      for (const ds of chartM.dataSets) {

        // const option = this.canvasList[ds.label].getOption()
        const option = JSON.parse(JSON.stringify(this.template))
        const series = option.series[0],
          series2 = option.series[1]

        // Title
        option.title.text = ds.label
        option.title.textStyle.fontSize = 12 * modifier
        option.color = ds.sections?.[0]?.map((d: Data) => d.color)


        series.radius[0] = String(parseFloat(ds.cutout) * 0.6) + '%'
        series.itemStyle.borderRadius = 5 * modifier
        series2.radius[0] = String(parseFloat(ds.cutout) * 0.6) + '%'
        series2.itemStyle.borderRadius = 5 * modifier
        // Sections
        option.dataset[0].source = ds.sections?.[0]
        // series.data[0].name = ds.unit

        // Labels
        series.label.fontSize = 10 * modifier
        series2.label.fontSize = 12 * modifier
        // @ts-ignore
        // const colorSections = ds.backgroundColors?.map((b: string, i) => [(ds.sections?.[i + 1] - ga.min) / ds.range, b]).filter(([s]) => !isNaN(s))

        // Apply
        if (chartM.chart) chartM.chart?.setOption(option)
      }
    })

  }

  setupCharts() {
    // remove the gauge canvases of non provided data series
    this.canvasList.forEach((chartM: any, chartName: string) => {
      if (!chartM.dataSets.length) this.canvasList.delete(chartName)
      if (chartM.chart) return
      const canvas = this.shadowRoot?.querySelector(`[name="${chartName}"]`) as HTMLCanvasElement;
      if (!canvas) return
      // @ts-ignore
      chartM.chart = echarts.init(canvas);
      chartM.chart.setOption(JSON.parse(JSON.stringify(this.template)))

    })

  }

  static styles = css`
    :host {
      display: block;
      color: var(--re-text-color, #000);
      font-family: sans-serif;
      box-sizing: border-box;
      position: relative;
      margin: auto;
    }

    .paging:not([active]) { display: none !important; }

    .wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      padding: 16px;
      box-sizing: border-box;
    }
    .doughnut-container {
      display: flex;
      flex: 1;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      overflow: hidden;
      position: relative;
      gap: 12px;
    }

    header {
      display: flex;
      flex-direction: column;
      margin: 0 0 16px 0;
    }
    h3 {
      margin: 0;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--re-text-color, #000) !important;
    }
    p {
      margin: 10px 0 0 0;
      max-width: 300px;
      font-size: 14px;
      line-height: 17px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--re-text-color, #000) !important;
    }

    .chart {
      width: 300px; /* will be overriden by adjustSizes */
      height: 300px;
    }

  `;

  render() {
    return html`
      <div class="wrapper">
        <header>
          <h3 class="paging" ?active=${this.inputData?.settings?.title}>${this.inputData?.settings?.title}</h3>
          <p class="paging" ?active=${this.inputData?.settings?.subTitle}>${this.inputData?.settings?.subTitle}</p>
        </header>
        <div class="doughnut-container">
          ${repeat(this.canvasList, ([chartName, chartM]) => chartName, ([chartName]) => html`
            <div name="${chartName}" class="chart" style="min-width: 300px; min-height: 300px; width: 300px; height: 300px;"></div>
          `)}
        </div>
      </div>
    `;
  }
}

window.customElements.define('widget-doughnut-versionplaceholder', WidgetDoughnut);
