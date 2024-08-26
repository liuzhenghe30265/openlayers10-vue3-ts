import { saveAs } from 'file-saver'
import 'ol/ol.css'
import Map, { type MapOptions } from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import OlLayerVector from 'ol/layer/Vector'
import { Vector as VectorSource } from 'ol/source'
import OlSourceVector from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ.js'
import TileWMS from 'ol/source/TileWMS'
import { Cluster } from 'ol/source'
import { Layer, Group as LayerGroup } from 'ol/layer.js'
import GeoJSON from 'ol/format/GeoJSON'
import Polyline from 'ol/format/Polyline.js'
import {
    defaults as Defaults,
    MousePosition,
    ScaleLine,
    Rotate,
    ZoomSlider,
    FullScreen
} from 'ol/control'
import OlStyleCircle from 'ol/style/Circle'
import OlStyleStyle from 'ol/style/Style'
import OlStyleIcon from 'ol/style/Icon'
import OlStyleText from 'ol/style/Text'
import OlStyleFill from 'ol/style/Fill'
import OlStyleStroke from 'ol/style/Stroke'
import Feature from 'ol/Feature'
import OlGeomPoint from 'ol/geom/Point'
import { Fill, RegularShape, Stroke, Style, Circle as CircleStyle, Icon } from 'ol/style.js'
import { LineString, MultiPoint, Point, Polygon } from 'ol/geom'
import VectorLayer from 'ol/layer/Vector'
import { fromLonLat, transform } from 'ol/proj.js'
import { Draw, Modify, Snap, Select } from 'ol/interaction'
import { altKeyOnly, click, pointerMove } from 'ol/events/condition.js'
import Overlay from 'ol/Overlay.js'
import { getVectorContext } from 'ol/render.js'

import { drawStyle, markerStyle, baseStyle, storageYardClusterStyle } from './style/index'
import { processCoordinates, genCoordinates, getClosestPointToScreen } from './tools'
import gcj02Mecator from './gcj02Mecator'

import { config } from './config'
import mock from './mock.json'

import Animation from './plugins/animation'

export type IMap = Map | null

interface _MapOptions extends MapOptions {
    getLevelColor: Function
    destoryDraw: Function
    markerDetails: Function
    markerResult: Function
}

export class OMap {
    [x: string]: any
    map: IMap = null
    constructor(opts: _MapOptions, cbs: any) {
        this.$animation = null
        this.getLevelColor = cbs.getLevelColor
        this.destoryDraw = cbs.destoryDraw
        this.markerDetails = cbs.markerDetails
        this.markerResult = cbs.markerResult
        this.pointerMoveSelect = null
        this.drawType = null
        this.drawUtil = null
        this.modifyUtil = null
        this.snapUtil = null
        this.selectUtil = null
        this.init(opts)
    }
    private init(opts: _MapOptions) {
        this.map = new Map(opts)

        // this.map.getView().setRotation(103 * (Math.PI / 180))

        // 鼠标事件
        this.addEventHandler()

        // this.addPointerMoveSelect()
    }
    private addEventHandler() {
        this.map?.on('pointermove', this.pointermoveAction.bind(this))
        this.map?.on('singleclick', this.singleclickAction.bind(this))

        const contextmenu: any = 'contextmenu'
        this.map?.on(contextmenu, this.contextmenuAction.bind(this))
    }
    animationSpeed(speed: number) {
        this.$animation?.setSpeed(speed)
    }
    animationHandler(type?: string, coordinates?: any[]) {
        if (!(type && coordinates?.length)) {
            this.$animation?.destory()
            this.$animation = null
            return
        }
        if (!this.$animation) {
            this.$animation = new Animation(this, {
                coordinates: coordinates
            })
        }
        if (type === 'start') {
            this.$animation?.startAnimation()
        } else if (type === 'stop') {
            this.$animation?.stopAnimation()
        } else if (type === 'destroy') {
            this.$animation?.destory()
            this.$animation = null
        }
    }
    // 添加覆盖物图层
    addOverlay(id: string | number, dom: any, position: any) {
        if (!id) {
            return
        }
        let layer: any = null
        if (this.map?.getOverlayById(id)) {
            layer = this.map?.getOverlayById(id)
        } else {
            layer = new Overlay({
                id: id,
                element: dom,
                // position: position,
                stopEvent: true
            })
            this.map?.addOverlay(layer)
        }
        if (!dom) {
            // 清除
            this.map?.removeOverlay(layer)
            return
        }
        layer.setPosition(position)
        return layer
    }
    removePointerMoveSelect() {
        this.map?.removeInteraction(this.pointerMoveSelect)
    }
    addPointerMoveSelect() {
        this.pointerMoveSelect = new Select({
            condition: pointerMove
        })
        this.map?.addInteraction(this.pointerMoveSelect)
    }
    // 根据 layer 及 Feature id 删除 Feature
    removeFeatureById(layerId: string | number, featureId: string | number) {
        const layer: any = this.getLayerById(layerId)
        const source = layer.getSource()
        const feature = layer.getSource().getFeatureById(featureId)
        if (feature) {
            source.removeFeature(feature)
        }
    }
    // 根据 layer 及 Feature id 获取 Feature
    getFeatureById(layerId: string | number, featureId: string | number) {
        const layer: any = this.getLayerById(layerId)
        const feature = layer.getSource().getFeatureById(featureId)
        return feature
    }
    async featureToModifyStatus(data: any, type: string) {
        const feature = this.getFeatureById(data.layerId, data.id)
        this.initDrawUtil({
            type: type,
            feature: feature
        })
        const geometry = feature.getGeometry()
        const coordinates = geometry.getCoordinates()
        this.handleDrawResult(coordinates, data.id)
    }
    resetFeatureGemo(data: any) {
        const feature = this.getFeatureById(data.layerId, data.id)
        const _feature: any = new GeoJSON().readFeature(data.geoJson)
        const _geometry = _feature.getGeometry()
        feature?.setGeometry(_geometry)

        const _data = feature.get('data')
        _data.level = data.level
        feature.setStyle(markerStyle.call(this))
    }

    getMap() {
        return this.map
    }
    getExtent() {
        const view = this.map?.getView()
        const extent = view?.calculateExtent(this.map?.getSize())
        return extent
    }
    // 获取所有图层
    getAllLayers() {
        return this.map?.getLayers().getArray()
    }
    // 设置图层显示隐藏
    setLayerVisible(id: string | number, visible: boolean) {
        const layer: any = this.getLayerById(id)
        layer.setVisible(visible)
    }
    // 自定义缩放功能
    setZoom(type: string) {
        const view = this.map?.getView()
        const zoom = view?.getZoom()
        if (zoom) {
            if (type === 'zoomIn') {
                if (zoom > config.maxZoom) return
                view?.setZoom(zoom + 1)
            } else if (type === 'zoomOut') {
                if (zoom < config.minZoom) return
                view?.setZoom(zoom - 1)
            }
        }
    }
    // 根据 id 移除图层
    removeLayerById(id: string | number) {
        const layer = this.getLayerById(id)
        if (layer) {
            this.map?.removeLayer(layer)
        }
    }
    // 根据 id 获取图层
    getLayerById(id: string | number) {
        return this.findLayerByProperty('id', id)
    }
    // 根据指定属性查找对应图层
    findLayerByProperty(propertyName: string, propertyValue: any) {
        let target
        this.map?.getLayers().forEach(function (layer) {
            if (layer.get(propertyName) === propertyValue) {
                target = layer
            }
        })
        return target
    }
    // 添加矢量标注图层
    addVectorLayer(id: string | number, type?: string | undefined, url?: string) {
        let layer = null
        if (this.getLayerById(id)) {
            // 图层已存在
            layer = this.getLayerById(id)
        } else {
            layer = new OlLayerVector({
                source: new OlSourceVector()
            })
            if (type && type === 'geojson') {
                layer = new OlLayerVector({
                    source: new OlSourceVector({
                        url: url,
                        format: new GeoJSON()
                    })
                })
            }
            layer.set('id', id)
            this.map?.addLayer(layer)
        }
        return layer
    }
    // 底图切换
    changeBaseLayer(id: number) {
        const layers = this.getAllLayers()
        const _layers = layers?.filter(_ => _.get('type') === 'base')
        _layers?.map(_ => _.setVisible(false))
        const layer: any = this.getLayerById(id)
        layer.setVisible(true)
    }

    // 导出 geojson 文件
    downloadLayer(layerId: string) {
        if (!layerId) return
        const layer = this.addVectorLayer(layerId)
        if (!layer) return
        const features: any = layer.getSource()?.getFeatures()
        const geojsonFormat = new GeoJSON()
        const geojsonObject = geojsonFormat.writeFeaturesObject(features)
        const blob = new Blob([JSON.stringify(geojsonObject)], { type: 'application/geojson' })
        saveAs(blob, `${layerId}.geojson`)
    }

    // 添加 Feature 到指定图层
    addCustomFeatures(options: { layerId: string | number; list: any; geoJson: string; styleFun: Function; cluster: any; projection: string }) {
        const { layerId, list, geoJson, styleFun, cluster, projection } = options
        console.log('..........options', options)
        if (!layerId) return
        const layer = this.addVectorLayer(layerId)
        if (!layer) return
        if (!(list && list.length)) {
            layer.getSource()?.clear()
            return
        }
        const features = []
        for (let index = 0; index < list.length; index++) {
            const data = list[index]
            let feature: any = null
            if (geoJson && data[geoJson]) {
                /**
                 * GeoJSON 格式的数据
                    {
                        "geoJson": "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[13114096.55583975,4695259.962582067]},\"properties\":null}",
                        "name": "地下消防栓",
                        "id": 5573
                    }
                 */
                feature = new GeoJSON().readFeature(data[geoJson], {
                    // dataProjection: 'EPSG:3857',
                    // featureProjection: 'EPSG:4326'
                })
                feature.setId(data.id)
            } else {
                /**
                 * 点数据
                    {
                        "name": "A197506.1",
                        "coordinates": [
                            13113283.29941145,
                            4720213.685639639
                        ]
                    }
                 */
                let position = data.coordinates
                if (projection === 'EPSG:4326') {
                    position = fromLonLat(data.coordinates)
                }
                feature = new Feature({
                    geometry: new OlGeomPoint(position),
                    data: data
                })
                feature.setId(data.id)
            }
            feature.set('data', data)
            features.push(feature)
            if (styleFun) {
                feature.setStyle(styleFun.call(this))
            }
        }
        if (cluster) {
            const newSource = new Cluster({
                distance: cluster.distance,
                minDistance: cluster.minDistance,
                // distance: layer.getSource().getDistance(), // 保持与原来相同的聚合距离
                source: new OlSourceVector({
                    features: features
                })
            })
            layer.setSource(newSource)
        } else {
            layer.getSource()?.addFeatures(features)
        }
    }

    setFeatureStyle(layerId: string, featureId: string, level: number) {
        if (layerId && featureId) {
            // 编辑已有标注
            const feature = this.getFeatureById(layerId, featureId)
            const data = feature.get('data')
            data.level = level
            feature.setStyle(markerStyle.call(this))
        } else {
            // 绘制新标注
            const layer: any = this.getLayerById('DrawLayer')
            const source = layer.getSource()
            const features = source.getFeatures()
            features.forEach((feature: { get: (arg0: string) => any; set: (arg0: string, arg1: { level: number }) => void }) => {
                feature.set('data', {
                    level: level
                })
            })
        }
    }

    // 绘制
    handleDrawResult(coordinates: [], id?: string) {
        const _coordinates = genCoordinates(coordinates, this.drawType)
        const map: any = this.map
        const closestPoint: any = getClosestPointToScreen(_coordinates, map)
        if (this.markerResult) {
            this.markerResult(this.drawType, _coordinates, closestPoint, id)
        }
    }
    modifyEndHandler(e: any) {
        const modifiedFeatures = e.features
        modifiedFeatures.forEach((feature: { getGeometry: () => any }) => {
            const geometry = feature.getGeometry()
            const coordinates = geometry.getCoordinates()
            this.handleDrawResult(coordinates)
        })
    }
    drawEndHandler(e: any) {
        // const geometry = e.feature.getGeometry()
        // 把绘制的图形添加到指定 layer 上
        const layer: any = this.addVectorLayer('DrawLayer')
        e.feature.setStyle(drawStyle.call(this))
        layer?.getSource().addFeature(e.feature)

        const geometry = e.feature.getGeometry()
        const coordinates = geometry.getCoordinates()
        this.handleDrawResult(coordinates)
        this.drawUtil.setActive(false) // 只绘制一个图形
    }
    destoryDrawUtil() {
        if (this.drawUtil) {
            this.map?.removeInteraction(this.drawUtil)
            this.drawUtil = null
        }
        if (this.modifyUtil) {
            this.map?.removeInteraction(this.modifyUtil)
            this.modifyUtil = null
        }
        if (this.snapUtil) {
            this.map?.removeInteraction(this.snapUtil)
            this.snapUtil = null
        }
        if (this.selectUtil) {
            this.map?.removeInteraction(this.selectUtil)
            this.selectUtil = null
        }
        this.removeLayerById('DrawLayer')
        if (this.destoryDraw) {
            this.destoryDraw()
        }
    }
    initDrawUtil(options: any) {
        if (!options) {
            this.destoryDrawUtil()
            return
        }
        this.drawType = options.type
        const layer: any = this.addVectorLayer('DrawLayer')

        const source = new VectorSource()
        this.selectUtil = new Select({
            layers: [layer],
            style: drawStyle.call(this)
        })
        this.drawUtil = new Draw({
            source: source,
            type: options.type,
            style: drawStyle.call(this)
            // style: markerStyle.call(this)
        })
        this.modifyUtil = new Modify({
            source: source,
            style: drawStyle.call(this)
        })
        this.snapUtil = new Snap({
            source: source
        })

        if (options.feature) {
            this.selectUtil.getFeatures().push(options.feature)
            this.modifyUtil = new Modify({
                features: this.selectUtil.getFeatures(),
                style: drawStyle.call(this)
            })
            this.drawUtil.setActive(false) // 只绘制一次
        }

        this.map?.addInteraction(this.selectUtil)
        this.map?.addInteraction(this.drawUtil)
        this.map?.addInteraction(this.modifyUtil)
        this.map?.addInteraction(this.snapUtil)

        this.modifyUtil.on('modifyend', this.modifyEndHandler.bind(this))
        this.drawUtil.on('drawend', this.drawEndHandler.bind(this))
    }

    // 鼠标事件
    pickFeatureInfo(event: { pixel: any }) {
        const feature = this.map?.forEachFeatureAtPixel(
            event.pixel,
            (feature: any, layer: any) => {
                return feature
            }
        )
        return feature
    }
    pointermoveAction(event: any) {
        const feature = this.pickFeatureInfo(event)
        const targetElement = this.map?.getTargetElement()
        if (targetElement instanceof HTMLElement) {
            if (feature) {
                targetElement.style.cursor = 'pointer'
            } else {
                targetElement.style.cursor = ''
            }
        }
    }
    singleclickAction(event: any) {
        console.log(event)
        const feature = this.pickFeatureInfo(event)
        const data = feature?.get('data')
        console.log(feature, data)

        // 标注信息弹窗
        if (this.markerDetails) {
            this.markerDetails(data)
        }
    }
    contextmenuAction(event: {
        originalEvent: any; pixel: any; preventDefault: () => void
    }) {
        event.preventDefault()
        const feature = this.pickFeatureInfo(event)
        const data = feature?.get('data')

        // 移除详情窗口
        if (this.markerDetails) {
            this.markerDetails(data)
        }
    }
}

function subProcess(data: any) {
    return new Promise<void>(resolve => {
        if (data.source === 'geojson') {
            // 处理 geojson
            if (data.url) {
                fetch(data.url).then(response => response.json())
                    .then(geojsonFeature => {
                        data.geojsonFeature = geojsonFeature
                        resolve(data)
                    })
            } else {
                resolve(data)
            }
        } else {
            resolve(data)
        }
    })
}
async function handleSubLayers(list: string | any[]) {
    const layers: any[] = []
    let layer = null
    for (let index = 0; index < list.length; index++) {
        const item = list[index]
        const result: any = await subProcess(item)
        if (result.source === 'wms') {
            layer = new TileLayer({
                source: new TileWMS({
                    url: result.url,
                    params: result.params || { 'LAYERS': 'topp:states', 'TILED': true },
                    serverType: 'geoserver',
                    transition: 0
                }),
                visible: result.visible,
                zIndex: 9
            })
        } else if (result.source === 'geojson') {
            // const geojsonFormat = new GeoJSON()
            // const features = geojsonFormat.readFeatures(result.geojsonFeature)

            // 投影坐标系转换
            // const vectorSource = new VectorSource({
            //     features: (new GeoJSON()).readFeatures(result.geojsonFeature),
            // })
            // vectorSource.getFeatures().forEach(feature => {
            //     const geom: any = feature.getGeometry()
            //     feature.setGeometry(geom.clone().transform('EPSG:3857', 'EPSG:4326'))
            // })

            layer = new VectorLayer({
                source: new VectorSource({
                    url: item.url,
                    format: new GeoJSON()
                }),
                // source: vectorSource,
                visible: item.visible,
                zIndex: 9
            })
        }
        layer?.set('title', item.name)
        layer?.set('type', item.type)
        layer?.set('id', item.id)
        layers.push(layer)
    }
    return new Promise(resolve => {
        resolve(layers)
    })
}

export const omap = async (opts: _MapOptions) => {
    const layers = []
    // 底图
    if (config.baseLayer && config.baseLayer.length) {
        for (let index = 0; index < config.baseLayer.length; index++) {
            const item = config.baseLayer[index]
            if (item.source === 'xyz') {
                const layer = new TileLayer({
                    source: new XYZ({
                        projection: gcj02Mecator, // 统一坐标系，默认是 EPSG:3857，转换为 GCJ-02（谷歌坐标），解决从其他平台（geojson.io 等）导入的坐标或 geojson 数据出现偏移问题
                        url: item.url
                    }),
                    visible: item.visible
                })
                layer.set('title', item.name)
                layer.set('type', item.type)
                layer.set('id', item.id)
                layers.push(layer)
            }
        }
    }

    // 子图层
    const subLayers: any = await handleSubLayers(config.subLayer)
    for (let index = 0; index < subLayers.length; index++) {
        const sublayer = subLayers[index]
        layers.push(sublayer)
    }

    const controls =
        opts.controls ||
        Defaults({ zoom: false }).extend([
            new ScaleLine(), // 比例尺控件
            new Rotate({
                autoHide: false
            })
            // new ZoomSlider(), // 缩放滑块刻度控件
            // new FullScreen(), // 全屏控件
            // new MousePosition({
            //     coordinateFormat: function (coordinate) {
            //         return `东经${coordinate?.[0]} 北纬${coordinate?.[1]}`
            //     }
            // }) // 鼠标位置控件
        ])
    return new OMap(
        Object.assign(
            {
                layers,
                controls,
                target: opts.target,
                view:
                    opts.view ||
                    new View({
                        projection: config.projection,
                        center: config.center,
                        zoom: config.zoom,
                        maxZoom: config.maxZoom,
                        minZoom: config.minZoom
                    })
            },
            opts
        ),
        // 在组件中调用对应的 hooks 方法
        {
            getLevelColor: (level: number) => {
                return opts.getLevelColor(level)
            },
            markerDetails: (data: any) => {
                opts.markerDetails(data)
            },
            markerResult: (type: any, coordinates: any, closestPoint: any, id: any) => {
                opts.markerResult(type, coordinates, closestPoint, id)
            },
            destoryDraw: () => {
                opts.destoryDraw()
            }
        }
    )
}

omap.prototype = OMap.prototype
