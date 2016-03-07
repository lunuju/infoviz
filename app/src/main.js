import {STIB_LINES, STIB_STOPS} from './data.js'
import colormap from 'colormap'
import L from 'leaflet'
import $ from 'jquery'


String.prototype.rjust = function( length, char ) {
    var fill = [];
    while ( fill.length + this.length < length ) {
      fill[fill.length] = char;
    }
    return fill.join('') + this;
}

String.prototype.ljust = function( length, char ) {
    var fill = [];
    while ( fill.length + this.length < length ) {
      fill[fill.length] = char;
    }
    return this + fill.join('');
}

const cmap = colormap({
    nshades: 100, 
    colormap: [
        {index: 0, rgb: [0x1a, 0x96, 0x41, 1]},
        {index: 0.5, rgb: [0xff, 0xff, 0xbf, 1]},
        {index: 1, rgb: [0xd7, 0x19, 0x1c, 1]},
    ]
})
const metrics = ['count', 'per_hour', 'min_time', 'avg_time', 'max_time']

function aggregate_metrics(data){
    let res = {}
    for (let k of metrics){
        res[k] = {
            min: Math.min(...data.map(row => row[k])),
            max: Math.max(...data.map(row => row[k]))
        }
    }
    return res
}

class Leg {
    constructor(data){
        this.fromStop = STIB_STOPS[`${data.from_stop_id}`.rjust(4, '0')]
        if (data.hasOwnProperty('fromStop')){
            this.fromStop = data.fromStop
        }
        this.toStop = STIB_STOPS[`${data.to_stop_id}`.rjust(4, '0')]
        if (data.hasOwnProperty('toStop')){
            this.toStop = data.toStop
        }
        for (let k of metrics){
            this[k] = data[k]
        }
    }

    norm(aggregate){
        let props = {
            fromStop: this.fromStop,
            toStop: this.toStop
        }
        for (let k of metrics){
            props[k] = this[k] / aggregate[k].max
        }
        return new Leg(props)
    }

    isClean(){
        return (this.fromStop != undefined) && (this.toStop != undefined)
    }

    latLng(){
        return [
            L.latLng(this.fromStop.latitude, this.fromStop.longitude),
            L.latLng(this.toStop.latitude, this.toStop.longitude)
        ]
    }

    timeWindow(lower, upper){
        return this.data.filter(
            record => record.departure > lower && record.arrival < upper
        ).map(record => record.dt)
    }

    toLeaflet(aggregate){
        let l = this.norm(aggregate)
        let c = Math.round(100*Math.sqrt(l.avg_time))
        let style = {
            color: cmap[c],
            opacity: 1,
            weight: Math.sqrt(this.per_hour)
        }
        return L.polyline(this.latLng(), style)
    }

    toString(){
        return `<Leg ${this.fromStop.name} - ${this.toStop.name}>`
    }
}

class App {
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
        $('#change-time').click(evt => this.refresh())
        this.refresh()
    }

    refresh(){
        let from_time = $('#from-time-picker').val()
        let to_time = $('#to-time-picker').val()
        $.getJSON(`/api?from_time=${from_time}&to_time=${to_time}`, data => {
            let legs = data.map(x => new Leg(x)).filter(x => x.isClean())

            for (let layer of this.features){
                this.map.removeLayer(layer)
            }
            this.features = []

            let agg = aggregate_metrics(legs)
            for (let leg of legs){
                this.features.push(leg.toLeaflet(agg).addTo(this.map))
            }
        })
    }
}

$(document).ready(() => {
    new App('map')
})
