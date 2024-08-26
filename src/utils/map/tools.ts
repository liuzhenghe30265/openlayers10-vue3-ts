import type { Coordinate } from 'ol/coordinate'
import { transform, fromLonLat } from 'ol/proj'
import { asArray, type Color } from 'ol/color'
import { Geometry } from 'ol/geom'
import { getArea, getLength } from 'ol/sphere.js'

export const formatLength = (line: Geometry) => {
    const length = getLength(line)
    let output
    if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + ' km'
    } else {
        output = Math.round(length * 100) / 100 + ' m'
    }
    return output
}

export const formatArea = (polygon: Geometry) => {
    const area = getArea(polygon)
    let output
    if (area > 10000) {
        output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2'
    } else {
        output = Math.round(area * 100) / 100 + ' m\xB2'
    }
    return output
}

export function genCoordinates(coordinates: any[], type: string) {
    if (type === 'Point') {
        return [coordinates]
    } else if (type === 'LineString') {
        return coordinates
    } else if (type === 'Polygon') {
        return coordinates[0]
    } else {
        throw new Error('Unsupported geometry type')
    }
}

export function geoJSONToVertices(geoJson: any, type: string) {
    if (type === 'Point') {
        return [geoJson.geometry.coordinates]
    } else if (type === 'LineString') {
        return geoJson.geometry.coordinates
    } else if (type === 'Polygon') {
        return geoJson.geometry.coordinates[0]
    } else {
        throw new Error('Unsupported geometry type')
    }
}

export function verticesToGeoJSON(vertices: any[], type: string) {
    if (type === 'Point') {
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: vertices[0] // 假设vertices是一个包含单个点坐标的数组
            }
        }
    } else if (type === 'LineString') {
        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: vertices // 假设vertices是一个包含线上多个点坐标的数组
            }
        }
    } else if (type === 'Polygon') {
        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [vertices] // 假设vertices是一个包含多边形边界的点坐标数组
            }
        }
    } else {
        throw new Error('Unsupported geometry type')
    }
}

/**
 * 将16进制颜色转换为带透明度的颜色字符串
 * @param {string} hexColor 16进制颜色值，例如: '#ff0000'
 * @param {number} alpha 透明度值（0到1之间）
 * @returns {string} 带透明度的CSS颜色字符串，例如: 'rgba(255,0,0,0.5)'
 */
export function hexToColorWithAlpha(hexColor: string | Color, alpha: number): string {
    // 将16进制颜色转换为RGB数组
    const rgb = asArray(hexColor)
    // 添加透明度值到RGB数组
    rgb[3] = alpha
    // 将RGB数组转换为带透明度的CSS颜色字符串
    return `rgba(${rgb.join(',')})`
}

export function isJSONString(str: string) {
    try {
        JSON.parse(str)
        return true
    } catch (e) {
        return false
    }
}

// 判断是否为 GeoJSON 格式的数据
export function isGeoJSON(obj: { type: string; coordinates: any; } | null) {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'type' in obj &&
        typeof obj.type === 'string' &&
        (
            obj.type === 'Feature' ||
            obj.type === 'FeatureCollection' ||
            obj.type === 'Point' ||
            obj.type === 'MultiPoint' ||
            obj.type === 'LineString' ||
            obj.type === 'MultiLineString' ||
            obj.type === 'Polygon' ||
            obj.type === 'MultiPolygon' ||
            obj.type === 'GeometryCollection'
        )
    )
}

// 获取屏幕宽度和高度的函数
function getScreenSize() {
    const width = window.innerWidth
    const height = window.innerHeight
    return { width, height }
}

// 计算距离函数
function calculateDistanceToPoint(map: { getSize?: () => any[]; getPixelFromCoordinate: any }, point: Coordinate, screenSize: { width: number; height: number }) {
    const pixel = map.getPixelFromCoordinate(point)
    const dx = screenSize.width - pixel[0]
    const dy = screenSize.height - pixel[1]
    return Math.sqrt(dx * dx + dy * dy)
}

// 找出离屏幕右下角最近的点
export function getClosestPointToScreen(points: any, map: { getSize: () => any[]; getPixelFromCoordinate: (arg0: Coordinate) => any; }) {
    const { width, height } = getScreenSize()
    let closestDistance = Infinity
    let closestPoint: Coordinate | undefined
    for (const point of points) {
        const distance = calculateDistanceToPoint(map, point, { width, height })
        if (distance < closestDistance) {
            closestDistance = distance
            closestPoint = point
        }
    }

    // const list: { coordinates: any }[] = []
    // window.$mapInstance.addCustomFeatures({
    //     layerId: 'Test',
    //     list: list
    // })
    // window.$mapInstance.addCustomFeatures({
    //     layerId: 'Test2',
    //     list: list
    // })
    // for (let index = 0; index < points.length; index++) {
    //     const element = points[index];
    //     list.push({
    //         coordinates: element
    //     })
    // }
    // window.$mapInstance.addCustomFeatures({
    //     layerId: 'Test',
    //     list: list
    // })
    // window.$mapInstance.addCustomFeatures({
    //     layerId: 'Test2',
    //     list: [
    //         {
    //             coordinates: closestPoint
    //         }
    //     ],
    //     styleFun: randomPointStyle
    // })

    return closestPoint
}

// 转换坐标系
export function transformCoordinates(feature: { getGeometry: () => { (): any; new(): any; getCoordinates: { (): any; new(): any; }; setCoordinates: { (arg0: any): void; new(): any; }; }; }) {
    // 假设feature是GeoJSON中的一个要素
    const coordinates = feature.getGeometry().getCoordinates()
    const transformedCoordinates = coordinates.map((coord: Coordinate) => {
        // 假设'EPSG:4326'是WGS84坐标系，'EPSG:3857'是GCJ02坐标系
        return transform(coord, 'EPSG:4326', 'EPSG:3857')
    })
    feature.getGeometry().setCoordinates(transformedCoordinates)
}

// 处理 geojson 中每个坐标点
export function processCoordinates(geojson: { type: string; coordinates: any[]; geometries: any[]; geometry: any; features: any[]; }, processPoint: (arg0: any) => void) {
    if (geojson.type === 'Point') {
        processPoint(geojson.coordinates)
    } else if (geojson.type === 'MultiPoint' || geojson.type === 'LineString') {
        geojson.coordinates.forEach(processPoint)
    } else if (geojson.type === 'MultiLineString' || geojson.type === 'Polygon') {
        geojson.coordinates.forEach((ring: any[]) => ring.forEach(processPoint))
    } else if (geojson.type === 'MultiPolygon') {
        geojson.coordinates.forEach((polygon: any[]) => polygon.forEach((ring: any[]) => ring.forEach(processPoint)))
    } else if (geojson.type === 'GeometryCollection') {
        geojson.geometries.forEach((geometry: any) => processCoordinates(geometry, processPoint))
    } else if (geojson.type === 'Feature') {
        processCoordinates(geojson.geometry, processPoint)
    } else if (geojson.type === 'FeatureCollection') {
        geojson.features.forEach((feature: any) => processCoordinates(feature, processPoint))
    }
}
