import $ from 'jquery'
import MapView from './MapView.js'
import {t2s, s2t} from './utils.js'

/* Timestamp range available in the database, in ms */
const DATABASE_MIN_TIME = 1449442800000
const DATABASE_MAX_TIME = 1461967200000

export default class App {
    constructor(){
        this.left = new MapView($('#left'))
        this.right = new MapView($('#right'))
        this.makePredefinedMenus()
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
            min: DATABASE_MIN_TIME,
            max: DATABASE_MAX_TIME,
            from: (DATABASE_MIN_TIME + DATABASE_MAX_TIME)/2,
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

    makePredefinedMenus(){
        function makeMenu(menu, map, otherMap, actionSelector){
            menu.find(actionSelector).click(evt => {
                let li = $(evt.target).closest('li')
                let title = li.text()
                map.setRange(li.attr('data-min'), li.attr('data-max'), li.attr('data-from'), li.attr('data-to'), title)
                map.setBound(li.attr('longitude-min'), li.attr('longitude-max'), li.attr('latitude-min'), li.attr('latitude-max'))
                otherMap.setBound(li.attr('longitude-min'), li.attr('longitude-max'), li.attr('latitude-min'), li.attr('latitude-max'))
            })
        }

        makeMenu($('#events-menu-left'), this.left, this.right, '.set-left')
        makeMenu($('#usual-menu-left'), this.left, this.right, '.set-left')
        makeMenu($('#events-menu-right'), this.right, this.left, '.set-right')
        makeMenu($('#usual-menu-right'), this.right, this.left, '.set-right')
    }
}
