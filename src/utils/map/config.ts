// 地图相关配置
import { fromLonLat, transform } from 'ol/proj.js'

// 坐标转换
// EPSG:4326 => EPSG:3857 fromLonLat([117.794011, 38.999252]) // [13112769.323017266, 4721564.42856456]
// EPSG:3857 => EPSG:4326 transform([13112769.323017266, 4721564.42856456], 'EPSG:3857', 'EPSG:4326')) // [117.794011, 38.999252]

// const tk: string = ''
export const config = {
    baseLayer: [
        {
            id: 1,
            source: 'xyz',
            name: '电子地图',
            type: 'base',
            url: `http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}`,
            visible: true
        },
        {
            id: 2,
            source: 'xyz',
            name: '卫星影像图',
            type: 'base',
            url: `http://webst01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=6&x={x}&y={y}&z={z}`,
            visible: false
        }
    ],
    subLayer: [
        {
            id: 'cite:2000',
            name: 'cite:2000',
            source: 'wms',
            type: 'sub',
            url: 'http://openlayers.vip/geoserver/cite/wms',
            params: { 'LAYERS': 'cite:2000', 'TILED': true },
            serverType: 'geoserver',
            transition: 0,
            visible: true
        },

        {
            id: 'ecoregions',
            name: 'ecoregions',
            source: 'geojson',
            type: 'sub',
            url: 'https://openlayers.org/data/vector/ecoregions.json',
            visible: false
        },
        {
            id: 'world-cities',
            name: 'world-cities',
            source: 'geojson',
            type: 'sub',
            // url: new URL('@/assets/baseData/world-cities.geojson', import.meta.url).href,
            url: 'https://openlayers.org/en/latest/examples/data/geojson/world-cities.geojson',
            visible: false
        },
        {
            id: 'U.S.A',
            name: 'U.S.A',
            source: 'wms',
            type: 'sub',
            url: 'https://ahocevar.com/geoserver/wms',
            params: { 'LAYERS': 'topp:states', 'TILED': true },
            serverType: 'geoserver',
            transition: 0,
            visible: false
        }
        // {
        //     id: 'geojsonObject',
        //     name: 'geojson 对象',
        //     source: 'geojson',
        //     type: 'sub',
        //     url: new URL('@/assets/baseData/geojsonObject.geojson', import.meta.url).href,
        //     visible: false
        // }
    ],
    center: fromLonLat([117.85724422035884, 39.09089038109377]),
    zoom: 12, // 默认缩放等级
    maxZoom: 25, // 最大缩放等级
    minZoom: 1, // 最小缩放等级
    // projection: 'EPSG:4326', // 坐标系规则
    projection: 'EPSG:3857',
    extent: [] // 边界值
}