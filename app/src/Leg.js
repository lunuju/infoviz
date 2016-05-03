import {STIB_STOPS} from './data.js'
import getColor from './colors.js'
import GreatCircle from 'great-circle'
import L from 'leaflet'
import {t2s, s2t} from './utils.js'
import d3 from 'd3'
import $ from 'jquery'
import histogram from './histogram'

const API_URL = "http://infoviz.ititou.be/travel_time"

// If stop is defined, return stop, otherwise get stop object from
// STIB_STOPS given its id.
function getStop(stop_id, stop){
    if (stop !== undefined){
        return stop
    }
    return STIB_STOPS[`${stop_id}`.rjust(4, '0')]
}

function pluralize(n, singular, plural){
    if (Math.abs(n) > 1){
        return plural
    }
    return singular
}

function pluralizeMinutes(seconds){
    let m = Math.round(seconds/60, 1)
    return `${m} ${pluralize(m, 'minute', 'minutes')}`
}

function pluralizeVehicles(n){
    let v = Math.round(n)
    return `${v} ${pluralize(v, 'vehicle', 'vehicles')}`
}

function icon(name){
    return `<span class="glyphicon glyphicon-${name}"></span>`
}

// A Leg is a link between 2 stops. A Line is made of consecutive legs,
// but a leg could belong to multiple lines
export default class Leg {
    static metrics(){
        return [
            'from_time',
            'to_time',
            'from_stop_id',
            'to_stop_id',
            'count',    // Total number of vehicles in time frame
            'per_hour', // Number of vehicles per hour
            'min_time', // Minimum travel time
            'avg_time', // Average travel time
            'max_time', // Maximum travel time
            'lines',    // All the lines that pass by this stop
        ]
    }

    constructor(data){
        this.fromStop = getStop(data.from_stop_id, data.fromStop)
        this.toStop = getStop(data.to_stop_id, data.toStop)
        for (let k of Leg.metrics()){
            this[k] = data[k]
        }
    }

    distance(){
        return GreatCircle.distance(
            this.fromStop.latitude, this.fromStop.longitude,
            this.toStop.latitude, this.toStop.longitude
        )
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

    popupContent(){
        let lines = this.lines.map(x => `<img class="stib-line-icon" alt=${x} src="http://www.stib-mivb.be/irj/go/km/docs/horaires/Horaires_web_couleur/${x}/images/${x}.gif"/>`)
                              .join('&nbsp;')
        return `<div style="width: 300px">
                    <h4>
                        ${this.fromStop.name} ${icon('arrow-right')} ${this.toStop.name}
                        <small>${Math.round(100*this.distance())/100} km</small>
                    </h4>
                    ${lines}
                    <h5>${icon('stats')} Frequency: ${parseInt(this.per_hour)}/h</h5>
                    <h5>${icon('time')} Avg travel time: ${pluralizeMinutes(this.avg_time)}</h5>
                    <svg width="0" height="100"></svg>
                    <hr/>
                    ${pluralizeVehicles(this.count)} in time frame
                </div>`
    }

    toLeaflet(){
        let style = {
            // Colorscale: 0 to 15min to ride 1km
            color: getColor(this.avg_time/this.distance(), 900),
            opacity: 1,
            weight: 2*Math.log(this.per_hour)
        }
        let line = L.polyline(this.latLng(), style)

        line.on("click", evt => {
            let popup = $(this.popupContent())[0]
            line.bindPopup(popup)
            line.openPopup()

            let params = `from_time=${this.from_time}&to_time=${this.to_time}&` +
                         `from_stop=${this.from_stop_id}&to_stop=${this.to_stop_id}`
            $.getJSON(`${API_URL}?${params}`, res => {
                let svg = d3.select(popup).select('svg')
                let dataset = res[0].travel_times
                histogram(svg, dataset)
            })
        })

        return line;
    }

    toString(){
        return `<Leg ${this.fromStop.name} - ${this.toStop.name}>`
    }
}
