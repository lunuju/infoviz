import Leg from './Leg.js'
import L from 'leaflet'
import $ from 'jquery'

import {loadSlider} from './ion.rangeSlider.js'
loadSlider($, document, window, navigator)

const API_URL = "http://infoviz.ititou.be/api"

export default class App {
    constructor(mountPoint){
        this.map = L.map(mountPoint, {
            center: [50.85, 4.35],
            zoom: 12
        })
        // L.tileLayer('https://a.tile.thunderforest.com/landscape/{z}/{x}/{y}@2x.png')
        // L.tileLayer('http://a.tile.stamen.com/toner/{z}/{x}/{y}.png')
        // L.tileLayer('http://c.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg')
        L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png')
         .addTo(this.map)
        this.features = []
        this.refresh("2016-03-01 08:00", "2016-03-01 10:00")

        $("#range").ionRangeSlider({
            hide_min_max: true,
            keyboard: true,
            min: 1449489600000,
            max: 1457024400000,
            from: 1456819200000,
            to: 1456826400000,
            type: 'double',
            step: 3600000,
            grid: true,
            prettify: num => new Date(num).toLocaleString(),
            onFinish: data => {
                let from_time = new Date(data.from).toISOString()
                let to_time = new Date(data.to).toISOString()
                let slider = data.input.data("ionRangeSlider")
                slider.update({disable: true})
                this.refresh(from_time, to_time)
                    .then(() => slider.update({disable: false}))
            }
        });
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
        console.log(`refresh ${from_time} ${to_time}`)
        return new Promise((ok, error) => {
            let params = `from_time=${from_time}&to_time=${to_time}`
            $.getJSON(`${API_URL}?${params}`, data => {
                let legs = data.map(x => new Leg(x)).filter(x => x.isClean())
                this.updateMap(legs)
                ok()
            })
        })
    }
}
