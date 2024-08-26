import OlStyleStyle from 'ol/style/Style'
import OlStyleIcon from 'ol/style/Icon'
import OlStyleText from 'ol/style/Text'
import OlStyleFill from 'ol/style/Fill'
import OlStyleStroke from 'ol/style/Stroke'
import OlStyleCircle from 'ol/style/Circle'
import { Fill, RegularShape, Stroke, Style, Circle as CircleStyle, Circle } from 'ol/style.js'
import { LineString, Point } from 'ol/geom.js'

import { formatLength, formatArea, hexToColorWithAlpha } from '@/utils/map/tools'

export const animationIconMarkerStyle: Function = () => {
    return new Style({
        image: new OlStyleIcon({
            src: new URL('@/assets/images/icon01.png', import.meta.url).href,
            anchor: [0.5, 1],
            scale: 0.5
        })
    })
}
export const animationStartMarkerStyle: Function = () => {
    return new Style({
        image: new OlStyleIcon({
            src: new URL('@/assets/images/icon02.png', import.meta.url).href,
            anchor: [0.5, 1],
            scale: 0.5
        })
    })
}
export const animationDefaultStyle: Function = () => {
    return new Style({
        image: new CircleStyle({
            radius: 0,
            fill: new Fill({ color: 'rgba(255, 255, 255, 0)' }),
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 0)',
                width: 2
            })
        })
    })
}

const drawTipStyle: Function = () => {
    return new Style({
        text: new OlStyleText({
            font: '12px Calibri,sans-serif',
            fill: new Fill({
                color: '#ffffff'
            }),
            backgroundFill: new Fill({
                color: hexToColorWithAlpha('#333', 0.5)
            }),
            padding: [2, 2, 2, 2],
            textBaseline: 'bottom',
            offsetY: -12
        })
    })
}

const drawSegmentStyle: Function = (color: string) => {
    return new Style({
        text: new OlStyleText({
            font: '12px Calibri,sans-serif',
            fill: new Fill({
                color: '#fff'
                // color: color,
            }),
            backgroundFill: new Fill({
                color: hexToColorWithAlpha(color, 0.5)
            })
            // padding: [2, 2, 2, 2],
            // textBaseline: 'bottom',
            // offsetY: -12,
        })
        // image: new RegularShape({
        //     radius: 6,
        //     points: 3,
        //     angle: Math.PI,
        //     displacement: [0, 8],
        //     fill: new Fill({
        //         color: 'rgba(0, 0, 0, 0.4)',
        //     }),
        // }),
    })
}

const drawLabelStyle: Function = (color: string) => {
    return new Style({
        text: new OlStyleText({
            font: '14px Calibri,sans-serif',
            fill: new Fill({
                color: '#fff'
            }),
            backgroundFill: new Fill({
                color: hexToColorWithAlpha(color, 0.8)
            })
            // padding: [3, 3, 3, 3],
            // textBaseline: 'bottom',
            // offsetY: -15,
        })
        // image: new RegularShape({
        //     radius: 8,
        //     points: 3,
        //     angle: Math.PI,
        //     displacement: [0, 8],
        //     fill: new Fill({
        //         color: hexToColorWithAlpha(color, 0.7),
        //     }),
        // }),
    })
}

const drawBaseStyle: Function = (color: string) => {
    return new Style({
        fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
                color: 'rgba(0, 0, 0, 0.7)'
            }),
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            })
        }),
        stroke: new OlStyleStroke({
            color: color,
            lineDash: [10, 10],
            width: 2
        })
    })
}

export function drawStyle() {
    const segments = true // 显示每一段的距离标注
    let tipText = '点击绘制'
    return (feature: any) => {
        const data = feature.get('data')
        const level = data?.level || 1
        const name = data?.name
        let color = '#ff0000'
        if (level) {
            color = this.getLevelColor(level)
        }
        const _drawSegmentStyle = drawSegmentStyle(color)
        const drawSegmentStyles: any = [_drawSegmentStyle]
        const styles = []
        const geometry = feature.getGeometry()
        const type = geometry.getType()
        let point, label, line, tipPoint
        if (!this.drawType || this.drawType === type || type === 'Point') {
            const style = drawBaseStyle(color)
            styles.push(style)
            if (type === 'Polygon') {
                point = geometry.getInteriorPoint()
                label = formatArea(geometry)
                line = new LineString(geometry.getCoordinates()[0])
            } else if (type === 'LineString') {
                point = new Point(geometry.getLastCoordinate())
                label = formatLength(geometry)
                line = geometry
            }
        }
        if (line) {
            const length = line.getCoordinates().length
            if (length > 0) {
                tipText = '右键结束绘制'
            }
            if (segments) {
                let count = 0
                line.forEachSegment(function (a: any, b: any) {
                    const segment = new LineString([a, b])
                    const label = formatLength(segment)
                    const _drawSegmentStyle = drawSegmentStyle(color)
                    if (drawSegmentStyles.length - 1 < count) {
                        drawSegmentStyles.push(_drawSegmentStyle.clone())
                    }
                    const segmentPoint = new Point(segment.getCoordinateAt(0.5))
                    drawSegmentStyles[count].setGeometry(segmentPoint)
                    drawSegmentStyles[count].getText().setText(label)
                    styles.push(drawSegmentStyles[count])
                    count++
                })
            }
        }
        if (label) {
            const _labelStyle = drawLabelStyle(color)
            _labelStyle.setGeometry(point)
            _labelStyle.getText().setText(label)
            styles.push(_labelStyle)
        }
        if (type === 'Point' && !this.modifyUtil.getOverlay().getSource().getFeatures().length) {
            const tipStyle = drawTipStyle()
            tipPoint = geometry
            tipStyle.getText().setText(tipText)
            styles.push(tipStyle)
        }
        return styles
    }
}

// 标记样式
export function markerStyle() {
    return (feature: any) => {
        const data = feature.get('data')
        const level = data?.level || 4
        const name = data?.name
        let color = '#ff0000'
        if (level) {
            color = this.getLevelColor(level)
        }
        return new OlStyleStyle({
            image: new CircleStyle({
                radius: 4,
                fill: new Fill({ color: hexToColorWithAlpha(color, 0.5) }),
                stroke: new Stroke({ color: color })
            }),
            fill: new OlStyleFill({
                color: hexToColorWithAlpha(color, 0.5)
            }),
            stroke: new OlStyleStroke({
                color: color,
                lineDash: [10, 10],
                width: 2
            }),
            text: new OlStyleText({
                font: '16px sans-serif',
                text: name,
                offsetY: -10, // 垂直偏移
                fill: new Fill({
                    color: color
                }),
                stroke: new OlStyleStroke({
                    color: [255, 255, 255, 1],
                    width: 1
                })
            })
        })
    }
}

// 基础样式
export function baseStyle() {
    return (feature: any) => {
        const _text: string = feature.get('data')?.name
        return new OlStyleStyle({
            // image: new OlStyleIcon({
            //     src: new URL('@/assets/marker.png', import.meta.url).href,
            //     anchor: [0.5, 1],
            //     scale: 0.05
            // })
            // image: new CircleStyle({
            //     radius: 2,
            //     fill: new Fill({ color: 'red' }),
            //     stroke: new Stroke({ color: 'white', width: 1 }),
            // }),
            // text: new OlStyleText({
            //     font: '16px sans-serif',
            //     text: _text,
            //     fill: new Fill({
            //         color: [255, 255, 255, 1],
            //     }),
            //     stroke: new OlStyleStroke({
            //         color: [0, 0, 0, 1],
            //         width: 1
            //     }),
            // }),
        })
    }
}

// 堆场聚合样式
export function storageYardClusterStyle() {
    return (feature: { get: (arg0: string) => { (): any; new(): any; length: any } }) => {
        const size = feature.get('features').length
        let name = ''
        const features = feature.get('features')
        const originalFeature = (feature.get('features') as unknown as Array<any>)[0]
        // if (size > 1) {
        // } else {
        // }
        if (originalFeature.get('name')) {
            name = originalFeature.get('name')
        }

        const style = new OlStyleStyle({
            image: new CircleStyle({
                radius: 2,
                fill: new Fill({ color: 'red' })
                // stroke: new Stroke({ color: 'white', width: 1 }),
            })
            // text: new OlStyleText({
            //     text: '01',
            //     fill: new Fill({
            //         color: 'white',
            //     }),
            //     backgroundFill: new Fill({
            //         color: 'rgba(255, 0, 0, 1)', // 蓝色半透明背景
            //     }),
            //     // backgroundStroke: new Stroke({
            //     //     color: 'red',
            //     //     width: 2,
            //     // }),
            //     padding: [0, 0, 0, 0], // 文本与背景之间的距离
            //     scale: 1, // 文本大小
            //     rotation: 0, // 文本旋转角度
            // })
        })
        return style
    }
}

// 随机点位样式
export function randomPointStyle() {
    return (feature: { get: (arg0: string) => { (): any; new(): any; name: any } }) => {
        const name: any = feature.get('data')?.name
        let type = 'RegularShape'
        let color = 'red'
        if (name % 2 === 0) {
            color = 'white'
        } else if (name % 7 === 0) {
            type = 'CircleStyle'
        }
        if (type === 'RegularShape') {
            return new OlStyleStyle({
                image: new RegularShape({
                    fill: new Fill({ color: color }),
                    stroke: new Stroke({ color: 'black', width: 1 }),
                    points: 3,
                    radius: 6,
                    rotation: Math.PI / 4,
                    angle: Math.floor(Math.random() * (359)) + 1
                })
            })
        } else if (type === 'CircleStyle') {
            return new OlStyleStyle({
                image: new CircleStyle({
                    radius: 6, // 圆的半径
                    fill: new Fill({
                        color: 'red' // 填充颜色
                    }),
                    stroke: new Stroke({
                        color: 'black', // 圆边框颜色
                        width: 1
                    })
                })
            })
        }
    }
}