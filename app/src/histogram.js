import d3 from 'd3'
import {STIB_COLORS} from './data.js'

export default function histogram(svg, series, nbins=15, W=300, H=150){
    /* For now, only sum data for all lines... More coming soon :) */
    let values = series.reduce((acc, x) => acc.concat(x.travel_times), [])

    /* Histogram horizontal limits */
    let Vmin = d3.min(values),
        Vmax = 1.1*d3.max(values);

    /* Internal margins and paddings */
    let margin = {top:10, bottom:50, right:15, left:15},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;

    /* Create an horizontal scale and axis */
    let x = d3.scale.linear()
                    .domain([Vmin, Vmax])
                    .range([0, width])
    let xAxis = d3.svg.axis()
                      .scale(x)
                      .orient('bottom')
                      .tickFormat(dt => `${parseInt(dt/60)}:${dt%60}`)
    
    /* Count data in bins, and deduce maximum height */
    let bins = d3.layout.histogram().bins(x.ticks(nbins))
    let groups = bins(values)
    let y = d3.scale.linear()
                    .domain([0, d3.max(groups, d => d.y)])
                    .range([height, 0])

    /* Create the plot container */
    svg.attr("width", W).attr("height", H)
    svg.append('g')
       .attr('transform', `translate(${margin.left},${margin.top})`)
    
    /* Stack histogram by lines and bind them to the svg */
    let layers = d3.layout.stack()(series.map(x => bins(x.travel_times)))
    let layer = svg.selectAll(".layer").data(layers)
                   .enter().append("g")
                           .attr("class", "layer")
                           .style("fill", (d, i) => STIB_COLORS[series[i].line]['background-color'])

    /* Edit style of each bar */
    layer.selectAll("rect")
         .data(d => d)
         .enter().append("rect")
         .attr("x", d => x(d.x))
         .attr("y", d => y(d.y + d.y0))
         .attr("height", d => y(d.y0) - y(d.y + d.y0))
         .attr('width', x(groups[0].dx + Vmin) - x(Vmin))
    
    /* Add time axis */
    svg.append('g')
       .attr('class', 'x axis')
       .attr('transform', `translate(0,${height})`)
       .call(xAxis)
       .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)" )

    /* Add x label */
    svg.append("text")
        .attr("x", width/2)
        .attr("y",  height+50)
        .style("text-anchor", "middle")
        .style("font-family", "arial")
        .text("Travel time")
}
