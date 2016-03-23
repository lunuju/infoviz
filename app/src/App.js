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

// String to timestamp (ms)
function s2t(s){
    return new Date(s.split()).getTime()
}

export default class App {
    constructor(mountPoint, rangeStart="2016-03-01", rangeEnd="2016-03-08"){
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

        this.slider = mountPoint.find(".range").ionRangeSlider({
            hide_min_max: true,
            keyboard: true,
            type: 'double',
            step: 3600000,
            grid: true,
            prettify: num => new Date(num).toLocaleString(),
            onFinish: evt => {
                let from_time = t2s(evt.from)
                let to_time = t2s(evt.to)
                this.slider.update({disable: true})
                this.refresh(from_time, to_time)
                    .then(() => this.slider.update({disable: false}))
            }
        }).data("ionRangeSlider");
        this.setRange(rangeStart, rangeEnd)
    }

    updateSlider(rangeStart, rangeEnd){
        this.slider.update({
            min: s2t(rangeStart),
            max: s2t(rangeEnd),
            from: s2t(rangeStart),
            to: s2t(rangeEnd)
        })
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

    setRange(rangeStart, rangeEnd){
        this.refresh(rangeStart, rangeEnd)
        this.updateSlider(rangeStart, rangeEnd)
    }
}
