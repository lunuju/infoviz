import $ from 'jquery'
import App from './App.js'

$(document).ready(() => {
    let left = new App($('#left'))
    let right = new App($('#right'))

    let menu = $('#events-menu')
    menu.find('a').each((_, li) => {
        $(li).prepend('<span title="Set to right map" class="label label-warning set-right">Right</span>&nbsp;')
        $(li).prepend('<span title="Set to left map" class="label label-info set-left">Left</span>&nbsp;')
    })

    menu.find('.set-left').click(evt => {
        let li = $(evt.target).closest('li')
        left.setRange(li.attr('data-from'), li.attr('data-to'))
    })
    menu.find('.set-right').click(evt => {
        let li = $(evt.target).closest('li')
        right.setRange(li.attr('data-from'), li.attr('data-to'))
    })
})

window.jQuery = $
