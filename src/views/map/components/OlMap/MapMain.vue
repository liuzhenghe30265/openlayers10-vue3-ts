<script setup lang="ts">
import * as turf from '@turf/turf'
import {
    inject,
    reactive,
    onMounted,
    type Ref,
    ref,
    shallowRef,
    watch
} from 'vue'
import ToolBar from './ToolBar.vue'
import OverLay from './OverLay/index.vue'

const mapOnloaded = ref(false)
import { omap, type IMap } from '@/utils/map'
import { randomPointStyle } from '@/utils/map/style'
import { useMapStore } from '@/stores/map'
const mapStore = useMapStore()
import useMap from '@/hooks/useMap'

const mapInstance: any = shallowRef(null) // map 实例

const handleDraw = (type: string) => {
    mapStore.setDrawStatus(mapStore.drawStatus ? '' : type)
    if (mapStore.drawStatus) {
        mapInstance.value.initDrawUtil({
            type: type
        })
    } else {
        mapInstance.value.initDrawUtil()
    }
}

// 模拟接口返回数据
import fireStationData from '@/mock/fireStation.json'
import editLayer from '@/mock/editLayer.json'
import containerLL from '@/assets/baseData/test.js'
const handleCustomLayer = (data: { layerId: string; status: boolean }) => {
    let list: any = []
    let geoJson = ''
    let styleFun = null
    let cluster = null
    let projection = 'EPSG:3857'
    if (data.layerId === 'FireStation') {
        list = fireStationData.items
        geoJson = 'geoJson'
    } else if (data.layerId === 'EditLayer') {
        list = editLayer.items
        geoJson = 'geoJson'
    } else if (data.layerId === 'StorageYard' || data.layerId === 'StorageYardCluster') {
        projection = 'EPSG:4326'
        for (const key in containerLL) {
            if (Object.prototype.hasOwnProperty.call(containerLL, key)) {
                const element = containerLL[key]
                list.push({
                    name: key,
                    coordinates: element.split(',')
                })
            }
        }
        if (data.layerId === 'StorageYardCluster') {
            cluster = {
                distance: parseInt('20', 10),
                minDistance: parseInt('0', 10)
            }
        }
    } else if (data.layerId === 'RandomPoint') {
        styleFun = randomPointStyle
        const extent = mapInstance.value.getExtent()
        list = turf
            .randomPoint(1000, {
                bbox: extent
            })
            .features.map((_, i) => {
                return {
                    name: i,
                    coordinates: _.geometry.coordinates
                }
            })
    }
    mapInstance.value.addCustomFeatures(
        data.status
            ? {
                layerId: data.layerId, // 添加到指定图层
                list, // 图形列表
                styleFun, // 自定义样式
                geoJson, // 是否为 GeoJSON 格式数据
                cluster, // 聚合方式
                projection // 坐标系
            } : {
                layerId: data.layerId
            }
    )
}

const handleChangeBaseLayer = (id: number) => {
    mapInstance.value.changeBaseLayer(id)
}
const handleLayerChange = (data: { id: any; visible: any }) => {
    mapInstance.value.setLayerVisible(data.id, data.visible)
}
const handleZoomOption = (data: { value: string }) => {
    mapInstance.value.setZoom(data.value)
}

const handleDownloadLayer = (layerId: string) => {
    mapInstance.value.downloadLayer(layerId)
}

// 图层对应的图形数据
const handleMarkLayerClick = async (data: { id: string; status: boolean }) => {
    const { refreshMarkerLayer } = useMap()
    refreshMarkerLayer(data.id)
}

// 图层分页数据
const handleGetMarkLayers = async () => {
    const { getMarkLayers } = useMap()
    await getMarkLayers({
        pageNo: 1,
        pageSize: 10,
        isAsc: false,
        sortBy: ''
    })

    // 默认打开所有图层（debugger）
    for (let index = 0; index < mapStore.markerlayers.length; index++) {
        const element = mapStore.markerlayers[index]
        element.status = true
        handleMarkLayerClick({
            id: element.id,
            status: true
        })
    }
}

// 初始化地图
const initMap = async () => {
    const { getLevelColor, handleMarkerDetails, handleMarkerForm, resetDrawStatus } = useMap()
    mapInstance['value'] = await omap({
        target: 'ol-map',
        getLevelColor: (level: number) => {
            const color = getLevelColor(level)
            return color
        },
        markerDetails: (data: any) => {
            handleMarkerDetails(data)
        },
        markerResult: (type: any, coordinates: any, closestPoint: any, id: any) => {
            handleMarkerForm(type, coordinates, closestPoint, id)
        },
        destoryDraw: () => {
            resetDrawStatus()
        }
    })
    window.$mapInstance = mapInstance.value

    mapOnloaded.value = true

    handleGetMarkLayers()
}

onMounted(() => {
    initMap()
})

</script>

<template>
    <div id="ol-map" class="ol-map">
        <ToolBar v-if="mapOnloaded" class="tool-bar" @downloadLayer="handleDownloadLayer" @draw="handleDraw"
            @customLayer="handleCustomLayer" @baseLayer="handleChangeBaseLayer" @zoomOption="handleZoomOption"
            @layerChange="handleLayerChange" @markLayer="handleMarkLayerClick" />
        <OverLay />
    </div>
</template>

<style lang="scss" scoped>
.ol-map {
    width: 100%;
    height: 100%;
}

.tool-bar {
    position: absolute;
    right: 50px;
    top: 50px;
    z-index: 9;
}
</style>