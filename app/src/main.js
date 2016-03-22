import $ from 'jquery'
import App from './App.js'

$(document).ready(() => {
    new App($('#left'))
    new App($('#right'))
})
