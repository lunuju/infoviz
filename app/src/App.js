import Leg from './Leg.js'
import L from 'leaflet'
import $ from 'jquery'

import {loadSlider} from './ion.rangeSlider.js'
loadSlider($, document, window, navigator)

const API_URL = "http://infoviz.ititou.be/api"
const DEFAULT_FROM_TIME = 1456819200000
const DEFAULT_TO_TIME = 1456826400000

// Timestamp to string
function t2s(t){
    return new Date(t).toISOString()
}

export default class App {
    constructor(mountPoint){
        this.map = L.map(mountPoint.find('.map').get(0), {
            center: [50.85, 4.35],
            zoom: 12
        })
        // L.tileLayer('https://a.tile.thunderforest.com/landscape/{z}/{x}/{y}@2x.png')
        // L.tileLayer('http://a.tile.stamen.com/toner/{z}/{x}/{y}.png')
        // L.tileLayer('http://c.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg')
        L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png')
         .addTo(this.map)
        this.features = []
        this.refresh(t2s(DEFAULT_FROM_TIME), t2s(DEFAULT_TO_TIME))

        mountPoint.find(".range").ionRangeSlider({
            hide_min_max: true,
            keyboard: true,
            min: 1449489600000,
            max: 1457024400000,
            from: DEFAULT_FROM_TIME,
            to: DEFAULT_TO_TIME,
            type: 'double',
            step: 3600000,
            grid: true,
            prettify: num => new Date(num).toLocaleString(),
            onFinish: evt => {
                let from_time = t2s(evt.from)
                let to_time = t2s(evt.to)
                let slider = evt.input.data("ionRangeSlider")
                slider.update({disable: true})
                this.refresh(from_time, to_time)
                    .then(() => slider.update({disable: false}))
            }
        });

        console.log(`Mounted App on ${mountPoint}`)
    }

    sliderChanged(){

    }

    updateMap(legs){
        for (let layer of this.features){
            this.map.removeLayer(layer)
        }
        this.features = []

        for (let leg of legs){
            this.features.push(leg.toLeaflet().addTo(this.map))
        }
    }

    refresh(from_time, to_time){
        // Avoid reload from server if time frame has not changed
        if (from_time == this.from_time && to_time == this.to_time){
            return new Promise((ok, error) => ok());
        }
        return new Promise((ok, error) => {
            let params = `from_time=${from_time}&to_time=${to_time}`
            $.getJSON(`${API_URL}?${params}`, data => {
                let legs = data.map(x => new Leg(x)).filter(x => x.isClean())
                this.updateMap(legs)
                this.from_time = from_time
                this.to_time = to_time
                ok()
            })
        })
    }
}
