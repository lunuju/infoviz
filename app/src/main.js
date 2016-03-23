import $ from 'jquery'
import App from './App.js'

$(document).ready(() => {
    let left = new App($('#left'))
    let right = new App($('#right'))

    let menu = $('#events-menu')
    menu.find('li').each((_, li) => {
        $(li).append('<a class="label label-default set-left" href="#">Left</a>')
        $(li).append('<a class="label label-default set-right" href="#">Right</a>')
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
