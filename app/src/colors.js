import colormap from 'colormap'

const cmap = colormap({
    nshades: 100, 
    colormap: [
        {index: 0, rgb: [0x1a, 0x96, 0x41, 1]},
        {index: 0.5, rgb: [0xff, 0xff, 0xbf, 1]},
        {index: 1, rgb: [0xd7, 0x19, 0x1c, 1]},
    ]
})

export default function getColor(value, upper, lower=0){
    if (value > upper){
        value = upper
    }
    else if (value < lower){
        value = lower
    }
    let i = parseInt(99 * (value-lower) / (upper-lower))
    return cmap[i]
}
