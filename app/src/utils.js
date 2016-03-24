// Timestamp to string
export function t2s(timestamp){
    let t = new Date(timestamp)
    let year = t.getFullYear(),
        month = `${t.getMonth()+1}`.rjust(2, '0'),
        day = `${t.getDate()}`.rjust(2, '0'),
        hour = `${t.getHours()}`.rjust(2, '0'),
        minute = `${t.getMinutes()}`.rjust(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`
}

// String to timestamp (ms)
export function s2t(s){
    return new Date(s.split()).getTime()
}

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
        [fill.length] = char;
    }
    return this + fill.join('');
}
