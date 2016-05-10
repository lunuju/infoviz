import Leg from './Leg.js'
import L from 'leaflet'
import $ from 'jquery'
import {t2s, s2t} from './utils.js'
import moment from 'moment'

import 'leaflet-ajax'

import {loadSlider} from './ion.rangeSlider.js'
loadSlider($, document, window, navigator)

const API_URL = "http://infoviz.ititou.be/api"
const DEFAULT_FROM_TIME = 1456819200000
const DEFAULT_TO_TIME = 1456826400000

export default class MapView {
    constructor(mountPoint, rangeMin="2016-03-01", rangeMax="2016-03-02",
                            rangeFrom="2016-03-01 08:00", rangeTo="2016-03-01 10:00",
                            title=""){
        $('.map').css('height', `${$(window).height()-200}px`)

        let grayscale = L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png')
        let toner = L.tileLayer('http://a.tile.stamen.com/toner/{z}/{x}/{y}.png')

        this.features = []

        this.lines = L.layerGroup(this.features)

        this.map = L.map(mountPoint.find('.map').get(0), {
            center: [50.85, 4.35],
            maxBounds : [[50.753165, 4.153080], [50.980444, 4.542612]],
            zoom: 13,
            minZoom: 11,
            maxZoom: 16,
            layers: grayscale
        })

        let density = new L.GeoJSON.AJAX("http://infoviz.ititou.be/density-layer.json", {
            style: feature => {
                let res = feature.properties
                res.clickable = false
                return res
            },
            pointToLayer: (feature, latlng) => {
                var icon = L.divIcon({'html': feature.properties.html, 
                    iconAnchor: [feature.properties.anchor_x, 
                                 feature.properties.anchor_y], 
                    className: 'empty'
                });  // What can I do about empty?
                return L.marker(latlng, {icon: icon});
            }
        })
        density.addTo(this.map)
        
        this.baseMaps = {
            "Base map: low contrast": grayscale,
            "Base map: high contrast": toner
        }
        this.layerControl = L.control.layers(this.baseMaps).addTo(this.map)
        this.layerControl.addOverlay(density, "Stops density")

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
        }).data("ionRangeSlider")

        this.title = mountPoint.find('.title')
        this.setRange(rangeMin, rangeMax, rangeFrom, rangeTo)
    }

    setTitle(text){
        this.title.html(text)
    }

    /* Change the slider state */
    updateSlider(rangeMin, rangeMax, rangeFrom, rangeTo){
        this.slider.update({
            min: s2t(rangeMin),
            max: s2t(rangeMax),
            from: s2t(rangeFrom),
            to: s2t(rangeTo)
        })
    }

    /* Refresh the STIB flow layer with new leg objects */
    updateMap(legs){
        this.layerControl.removeLayer(this.lines)
        for (let layer of this.features){
            this.map.removeLayer(layer)
        }

        this.features = []

        for (let leg of legs){
            this.features.push(leg.toLeaflet())
        }
        this.lines = L.layerGroup(this.features)

        this.map.addLayer(this.lines)
        this.layerControl.addOverlay(this.lines, "Lines")
    }

    /* Disable the slider, get new data from the server.
     * Upon success, update the STIB flow layer and enable slider */
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

    /* Set the selectionable time range (rangeMin, rangeMax),
       and the displayed time window (rangeFrom, rangeTo) */
    setRange(rangeMin, rangeMax, rangeFrom, rangeTo, title=""){
        let fmt = 'MMMM Do YYYY, hh:mm'
        let tFrom = moment(rangeMin).format(fmt)
        let tTo = moment(rangeMax).format(fmt)
        this.setTitle(`${title} <small>${tFrom} - ${tTo}</small>`)
        this.refresh(rangeFrom, rangeTo)
        this.updateSlider(rangeMin, rangeMax,rangeFrom,rangeTo)
    }

    /* Set the boundary box of the map */
    setBound(longitudeMin, longitudeMax, latitudeMin, latitudeMax){
        this.map.fitBounds([
            [latitudeMin, longitudeMin],
            [latitudeMax, longitudeMax]
        ])
    }
}
