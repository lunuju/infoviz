import Leg from './Leg.js'
import L from 'leaflet'
import $ from 'jquery'
import {t2s, s2t} from './utils.js'

import {loadSlider} from './ion.rangeSlider.js'
loadSlider($, document, window, navigator)

const API_URL = "http://infoviz.ititou.be/api"
const DEFAULT_FROM_TIME = 1456819200000
const DEFAULT_TO_TIME = 1456826400000

export default class MapView {
    constructor(mountPoint, rangeMin="2016-03-01", rangeMax="2016-03-02",
                            rangeFrom="2016-03-01 08:00", rangeTo="2016-03-01 10:00"){
        $('.map').css('height', `${$(window).height()-200}px`)
        this.map = L.map(mountPoint.find('.map').get(0), {
            center: [50.85, 4.35],
            maxBounds : [[50.753165, 4.153080], [50.980444, 4.542612]],
            zoom: 12,
            minZoom: 10,
            maxZoom: 16
        })

        // L.tileLayer('https://a.tile.thunderforest.com/landscape/{z}/{x}/{y}@2x.png')
        // L.tileLayer('http://a.tile.stamen.com/toner/{z}/{x}/{y}.png')
        // L.tileLayer('http://c.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg')
        L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png')
         .addTo(this.map)
        this.features = []

        this.slider = mountPoint.find(".range").ionRangeSlider({
            hide_min_max: false,
            keyboard: true,
            type: 'double',
            step: 1200000,
            grid: true,
            force_edges: true,
            prettify: num => new Date(num).toLocaleString(),
            onFinish: evt => {
                let from_time = t2s(evt.from)
                let to_time = t2s(evt.to)
                this.refresh(from_time, to_time)
            }
        }).data("ionRangeSlider");
        this.setRange(rangeMin, rangeMax, rangeFrom, rangeTo)
    }

    updateSlider(rangeMin, rangeMax, rangeFrom, rangeTo){
        this.slider.update({
            min: s2t(rangeMin),
            max: s2t(rangeMax),
            from: s2t(rangeFrom),
            to: s2t(rangeTo)
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
            this.slider.update({disable: true})
            let params = `from_time=${from_time}&to_time=${to_time}`
            $.getJSON(`${API_URL}?${params}`, data => {
                let legs = data.map(x => new Leg(x)).filter(x => x.isClean())
                this.updateMap(legs)
                this.from_time = from_time
                this.to_time = to_time
                this.slider.update({disable: false})
                ok()
            })
        })
    }

    setRange(rangeMin, rangeMax, rangeFrom, rangeTo){
        this.refresh(rangeFrom, rangeTo)
        this.updateSlider(rangeMin, rangeMax,rangeFrom,rangeTo)
    }
}
