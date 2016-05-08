import $ from 'jquery'
import MapView from './MapView.js'
import {t2s, s2t} from './utils.js'

export default class App {
    constructor(){
        this.left = new MapView($('#left'))
        this.right = new MapView($('#right'))
        this.makeEventsMenu()
        this.makeUsualMenu()
        this.makeRightSliderMenu()
        this.makeLeftSliderMenu()
        this.showModal()
    }

    showModal(){
        let mdl = $('.modal')
        mdl.modal('show')
    }

    makeRightSliderMenu(){
        let menu = $('#slider-menu-right')
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
        menu.find('.set-right').click(evt => {
            let t = this.slider.options.from
            this.right.setRange(t2s(t-86400000), t2s(t+86400000), t2s(t-86400000), t2s(t+86400000))
        })
        menu.click(evt => {
            evt.stopPropagation();
        })
    }

    makeLeftSliderMenu(){
        let menu = $('#slider-menu-left')
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
        menu.click(evt => {
            evt.stopPropagation();
        })
    }

    makeUsualMenu(){
        let menuRight = $('#usual-menu-right')
        this.makeMenuRight(menuRight)
        let menuLeft = $('#usual-menu-left')
        this.makeMenuLeft(menuLeft)
    }

    makeEventsMenu(){
        let menuRight = $('#events-menu-right')
        this.makeMenuRight(menuRight)
        let menuLeft = $('#events-menu-left')
        this.makeMenuLeft(menuLeft)
    }

    makeMenuRight(menu){
        menu.find('.set-right').click(evt => {
            let li = $(evt.target).closest('li')
            this.right.setBound(li.attr('longitude-min'), li.attr('longitude-max'), li.attr('latitude-min'), li.attr('latitude-max'))
            this.left.setBound(li.attr('longitude-min'), li.attr('longitude-max'), li.attr('latitude-min'), li.attr('latitude-max'))
            this.right.setRange(li.attr('data-min'), li.attr('data-max'), li.attr('data-from'), li.attr('data-to'))
        })
    }

    makeMenuLeft(menu){
        menu.find('.set-left').click(evt => {
            let li = $(evt.target).closest('li')
            this.left.setBound(li.attr('longitude-min'), li.attr('longitude-max'), li.attr('latitude-min'), li.attr('latitude-max'))
            this.right.setBound(li.attr('longitude-min'), li.attr('longitude-max'), li.attr('latitude-min'), li.attr('latitude-max'))
            this.left.setRange(li.attr('data-min'), li.attr('data-max'), li.attr('data-from'), li.attr('data-to'))
        })

    }
}
