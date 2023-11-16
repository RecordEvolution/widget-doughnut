import { html, css, LitElement, PropertyValueMap } from 'lit';
import { repeat } from 'lit/directives/repeat.js'
import { property, state, customElement } from 'lit/decorators.js';
import { Chart } from 'chart.js/auto';
import { InputData, Data, Dataseries } from './types.js'
import {Context} from 'chartjs-plugin-datalabels'
import ChartDataLabels from 'chartjs-plugin-datalabels'
Chart.register(ChartDataLabels)
import tinycolor from "tinycolor2"

@customElement('widget-doughnut')
export class WidgetDoughnut extends LitElement {
  
  @property({type: Object}) 
  inputData?: InputData = undefined

  @state()
  private dataSets: Dataseries[] = []

  @state()
  private canvasList: Map<string, {chart?: any, dataSets: Dataseries[]}> = new Map()

  update(changedProperties: Map<string, any>) {
    if (changedProperties.has('inputData')) {
      this.transformInputData()
      this.applyInputData()
    }
    super.update(changedProperties)
  }

  protected firstUpdated(): void {
    this.applyInputData()
  }


  async transformInputData() {

    if(!this?.inputData?.dataseries.length) return

    // reset all existing chart dataseries
    this.canvasList.forEach(chartM => chartM.dataSets = [])
    this.inputData.dataseries.sort((a, b) => a.order - b.order).forEach(ds => {
      ds.chartName = ds.chartName ?? ''

      // pivot data
      const distincts = [...new Set(ds.sections.flat().map((d: Data) => d.pivot))]
      // const derivedBgColors = tinycolor(ds.backgroundColors).monochromatic(distincts.length).map((c: any) => c.toHexString())

      if (distincts.length > 1) {
        distincts.forEach((piv, i) => {
          const pds: any = {
            label: ds.label + ' ' + piv,
            order: ds.order,
            cutout: ds.cutout,
            sections: ds.sections.map((d: Data[]) => d.filter(d => d.pivot === piv)).filter(d => d.length)
          }
          // If the chartName ends with #pivot# then create a seperate chart for each pivoted dataseries
          const chartName = ds.chartName.endsWith('#pivot#') ? ds.chartName + piv : ds.chartName
          if (!this.canvasList.has(chartName)) {
            // initialize new charts
            this.canvasList.set(chartName, {chart: undefined, dataSets: [] as Dataseries[]})
          }
          this.canvasList.get(chartName)?.dataSets.push(pds)
        })
      } else {
          if (!this.canvasList.has(ds.chartName)) {
            // initialize new charts
            this.canvasList.set(ds.chartName, {chart: undefined, dataSets: [] as Dataseries[]})
          }
          this.canvasList.get(ds.chartName)?.dataSets.push(ds)
      }
    })
    // prevent duplicate transformation
    this.inputData.dataseries = []
    // console.log('new linechart datasets', this.canvasList)
    
    // filter latest values and calculate average
    this.canvasList.forEach(({chart, dataSets}) => {
      dataSets.forEach(ds => {
        ds.data = []
        ds.backgroundColor = ds.sections[0]?.map(d => d.color)
        ds.sections = ds.sections.splice(-ds.averageLatest ?? -1)
        const numSections = Math.max(...ds.sections.map(d => d.length))
        for (let i = 0; i < numSections; i++) {
          // array from i-th sections values
          const valueCol = ds.sections.map((row: Data[]) => row?.[i]?.value).filter(v => v !== undefined)
          ds.data.push(valueCol.reduce(( p, c ) => p + c, 0) / valueCol.length)
        }
        // console.log('ready data', ds.label, ds.backgroundColor, ds.sections)

        ds.datalabels = {
          color: '#FFF',
          formatter: (d: number) => d.toFixed()
        }
      })
    })

  }

  applyInputData() {
    this.canvasList.forEach(({chart, dataSets}) => {
      if (chart) {
        chart.data.datasets = dataSets

        chart?.update('none')

      } else {
        this.createChart()
      }
    })
  }

  createChart() {
    this.canvasList.forEach((chartM, chartName) => {
      const canvas = this.shadowRoot?.querySelector(`[name="${chartName}"]`) as HTMLCanvasElement
      if (!canvas) return
      // console.log('chartM', canvas, chartM.chart)
      chartM.chart = new Chart(
        canvas,
        {
          type: 'doughnut',
          data: {
            labels: chartM.dataSets[0].sections[0]?.map(d => d.label),
            datasets: chartM.dataSets
          },
          options: {
            responsive: true,
            aspectRatio: 2,
            layout: {
              padding: {
                bottom: 3
              }
            },
            animation: {
              duration: 200,
              animateRotate: false,
              animateScale: true
            },
            plugins: {
              tooltip: {
                enabled: true
              }
            }
          }
        }
      ) as Chart
    })
  }

  static styles = css`
    :host {
      display: block;
      color: var(--widget-doughnut-text-color, #000);
      font-family: sans-serif;
      padding: 16px;
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
    }
    .doughnut-container {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .columnLayout {
      flex-direction: column;
    }

    .sizer {
      flex: 1;
      overflow: hidden;
      position: relative;
      display: flex;
      justify-content: center;
    }

    .single-doughnut {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      position: relative;
      align-items: stretch;
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
    }
    p {
      margin: 10px 0 0 0;
      max-width: 300px;
      font-size: 14px;
      line-height: 17px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #currentValue {
      text-align: center;
      font-weight: 600;
    }

    .spacer {
      height: 30px;
    }

    .values {
      display: flex;
      justify-content: space-around;
    }

    .aligner {
      position: absolute;
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .scale-value {
      text-align: center;
      font-weight: 100;
      width: 100px;
    }

    .label {
      text-align: center;
      position: absolute;
      width: 100%;
    }

  `;

  render() {
    return html`
      <div class="wrapper">
        <header>
          <h3 class="paging" ?active=${this.inputData?.settings?.title}>${this.inputData?.settings?.title}</h3>
          <p class="paging" ?active=${this.inputData?.settings?.subTitle}>${this.inputData?.settings?.subTitle}</p>
        </header>
        <div class="doughnut-container ${this?.inputData?.settings?.columnLayout ? 'columnLayout': ''}">
          ${repeat(this.canvasList, ([chartName, chartM]) => chartName, ([chartName]) => html`
            <div class="sizer">
              <canvas name="${chartName}"></canvas>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
