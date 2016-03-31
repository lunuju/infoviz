import $ from 'jquery'
import MapView from './MapView.js'
import {t2s, s2t} from './utils.js'

export default class App {
    constructor(){
        this.left = new MapView($('#left'))
        this.right = new MapView($('#right'))
        this.makeEventsMenu()
        this.makeSliderMenu()
    }

    makeSliderMenu(){
        let menu = $('#slider-menu')
        this.slider = menu.find('.slider').ionRangeSlider({
            hide_min_max: true,
            keyboard: true,
            step: 86400000,
            grid: true,
            force_edges: true,
            min: 1449442800000,
            max: 1458687600000,
            from: (1458687600000 + 1449442800000)/2,
            prettify: num => new Date(num).toLocaleString(),
            onFinish: evt => {}
        }).data("ionRangeSlider");
        menu.find('.set-left').click(evt => {
            let t = this.slider.options.from
            this.left.setRange(t2s(t-86400000), t2s(t+86400000), t2s(t-86400000), t2s(t+86400000))
        })
        menu.find('.set-right').click(evt => {
            let t = this.slider.options.from
            this.right.setRange(t2s(t-86400000), t2s(t+86400000), t2s(t-86400000), t2s(t+86400000))
        })
        menu.click(evt => {
            evt.stopPropagation();
        })
    }

    makeEventsMenu(){
        let menu = $('#events-menu')
        menu.find('a').each((_, li) => {
            $(li).prepend('<span title="Set to right map" class="label label-warning set-right">Right</span>&nbsp;')
            $(li).prepend('<span title="Set to left map" class="label label-info set-left">Left</span>&nbsp;')
        })
        menu.find('.set-left').click(evt => {
            let li = $(evt.target).closest('li')
            this.left.setRange(li.attr('data-min'), li.attr('data-max'), li.attr('data-from'), li.attr('data-to'))
        })
        menu.find('.set-right').click(evt => {
            let li = $(evt.target).closest('li')
            this.right.setRange(li.attr('data-min'), li.attr('data-max'), li.attr('data-from'), li.attr('data-to'))
        })
    }
}
