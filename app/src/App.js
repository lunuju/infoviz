import $ from 'jquery'
import MapView from './MapView.js'

export default class App {
    constructor(){
        this.left = new MapView($('#left'))
        this.right = new MapView($('#right'))
        this.makeEventsMenu()
    }

    makeEventsMenu(){
        let menu = $('#events-menu')
        menu.find('a').each((_, li) => {
            $(li).prepend('<span title="Set to right map" class="label label-warning set-right">Right</span>&nbsp;')
            $(li).prepend('<span title="Set to left map" class="label label-info set-left">Left</span>&nbsp;')
        })

        menu.find('.set-left').click(evt => {
            let li = $(evt.target).closest('li')
            this.left.setRange(li.attr('data-from'), li.attr('data-to'))
        })
        menu.find('.set-right').click(evt => {
            let li = $(evt.target).closest('li')
            this.right.setRange(li.attr('data-from'), li.attr('data-to'))
        })
    }
}
