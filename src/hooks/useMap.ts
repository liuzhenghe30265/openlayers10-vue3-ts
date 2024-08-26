import { inject, toRaw, watch, h, render, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
    geoJSONToVertices,
    getClosestPointToScreen,
    verticesToGeoJSON,
    isGeoJSON,
    isJSONString
} from '@/utils/map/tools'
import { markerStyle, randomPointStyle } from '@/utils/map/style'
import { useMapStore } from '@/stores/map'
import { useMapApi } from '@/api/map/index'
const mapApi = useMapApi()

import type { LayerData, LayerParams, MarkerData, MarkerParams } from '@/api/map/types'

const getVerticesByGeoJsonString = (geoJson: string, type: string) => {
    const _geoJson = JSON.parse(geoJson)
    const data = geoJSONToVertices(_geoJson, type)
    return data
}

const getLevelColor = (level: number): string => {
    const mapStore = useMapStore()
    const data = mapStore.markerLevel[mapStore.markerLevel.findIndex(_ => _.value === level)]?.color
    return data
}

const getGeometryTypeCode = (value: number | undefined) => {
    const mapStore = useMapStore()
    const data = mapStore.geometryTypes[mapStore.geometryTypes.findIndex(_ => _.value === value)]?.code
    return data
}
const getGeometryTypeValue = (code: string) => {
    const mapStore = useMapStore()
    const data = mapStore.geometryTypes[mapStore.geometryTypes.findIndex(_ => _.code === code)]?.value
    return data
}

const getLevelValue = (value: number) => {
    const mapStore = useMapStore()
    const data = mapStore.markerLevel[mapStore.markerLevel.findIndex(_ => _.value === value)]
    return data
}
const getLayerValue = (layerId: string) => {
    const mapStore = useMapStore()
    const data = mapStore.markerlayers[mapStore.markerlayers.findIndex(_ => _.id === layerId)]
    return data
}

const changeFeatureLevel = (layerId: string, featureId: string, level: number) => {
    window.$mapInstance.setFeatureStyle(layerId, featureId, level)
}

const handleAnimationSpeed = (speed: number) => {
    window.$mapInstance.animationSpeed(speed)
}
const handleAnimationControl = (type?: string, coordinates?: any[]) => {
    window.$mapInstance.animationHandler(type, coordinates)
}

const handleMarkerDetails = async (data?: { id: string, geoJson: string, geometryType: number }) => {
    const mapStore = useMapStore()
    window.$mapInstance.addOverlay('markerDetails', document.getElementById('markerDetails'), null)
    mapStore.setMarkerDetails(null)
    // if (data?.id) {
        const res = data
        // const res = await getMarkerDetailsById(data.id)
        if (res) {
            mapStore.setMarkerDetails(res)
            const geoJson = JSON.parse(res.geoJson)
            const type = getGeometryTypeCode(res.geometryType)
            const coordinates = geoJSONToVertices(geoJson, type)
            const closestPoint: any = getClosestPointToScreen(coordinates, window.$mapInstance.map)
            // const closestPoint = [13111035.322802128, 4722442.146208884] // debugger
            window.$mapInstance.addOverlay('markerDetails', document.getElementById('markerDetails'), closestPoint)
        }
    // }
}

const handleMarkerForm = (type: string, coordinates: [], closestPoint: any, id: string | undefined) => {
    const mapStore = useMapStore()
    window.$mapInstance.addOverlay('markerForm', document.getElementById('markerForm'), closestPoint)
    if (!closestPoint) return
    mapStore.setCurrentFeature(coordinates)
    if (id) {
        // 编辑
        mapStore.setEditMarker(id)
    }
}

// 完成绘制后重置 store 中 Draw 相关的数据
const resetDrawStatus = async () => {
    const mapStore = useMapStore()
    if (mapStore.editMarker) {
        // 还原未保存的标注
        const data = await getMarkerDetailsById(mapStore.editMarker)
        if (data) {
            window.$mapInstance.resetFeatureGemo(data)
        }
    }
    mapStore.setDrawStatus('')
    mapStore.setEditMarker('')
}

// 编辑标注（添加一个编辑状态的标注）
const handleEditMarker = (data: MarkerData) => {
    const mapStore = useMapStore()
    const type = getGeometryTypeCode(data.geometryType)
    mapStore.setDrawStatus(type)
    window.$mapInstance.featureToModifyStatus(data, type)
    handleMarkerDetails()
}

const handleDeleteMarker = (data: MarkerData) => {
    ElMessageBox.confirm(
        '确认删除？',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
        }
    )
        .then(async () => {
            const res: any = await mapApi.deleteMarker({
                id: data.id,
                layerId: ''
            })
            if (res?.code === 200) {
                ElMessage({
                    message: '删除成功！',
                    type: 'success'
                })
                window.$mapInstance.removeFeatureById(data.layerId, data.id)
                handleMarkerDetails()
            } else {
                ElMessage({
                    message: '删除失败！',
                    type: 'error'
                })
            }
        })
        .catch(() => {

        })
}

const getMarkerDetailsById = async (id: string) => {
    const res = await mapApi.getMarkerDetails({
        id,
        layerId: ''
    })
    if (res?.code === 200 && res.data) {
        return res.data
    }
}

const getMarkersByLayerId = async (id: string) => {
    const res = await mapApi.getMarkersByLayerId({
        layerId: id,
        id: ''
    })
    if (res?.code === 200) {
        if (res.data?.list) {
            // const list = res.data?.list
            // for (let index = 0; index < list.length; index++) {
            //     const element = list[index]
            //     if (!isGeoJSON(JSON.parse(element.geoJson))) {
            //         element.geoJson = `{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[13111765.987455826, 4720427.634090358], [13111582.466111442, 4720811.465571434], [13112005.15746278, 4721090.645191557], [13112143.634368492, 4720335.0966628], [13111765.987455826, 4720427.634090358]]]}, "properties": null}`
            //     }
            // }

            const list = res.data.list.filter((_: any) => {
                return isGeoJSON(JSON.parse(_.geoJson))
            })
            return list
        }
    }
}

const addLayer = async (data: LayerData) => {
    const res = await mapApi.addLayer(data)
    return res
}

const deleteLayer = async (layerId: string) => {
    const res = await mapApi.deleteLayer(layerId)
    return res
}

const updateLayer = async (data: LayerData) => {
    const res = await mapApi.updateLayer(data)
    return res
}

const getMarkLayers = async (params: LayerParams) => {
    const mapStore = useMapStore()
    const res = await mapApi.getLayers(params)
    if (res?.data) {
        const list = res.data.list
        mapStore.setMarkerLayers(list)

        // 添加图层到 map
        for (let index = 0; index < list.length; index++) {
            const item = list[index]
            window.$mapInstance.addCustomFeatures(
                {
                    layerId: item.id, // 添加到指定图层
                    list: [] // 图形列表
                }
            )
        }
        return list
    }
}

const destoryDrawUtil = () => {
    window.$mapInstance.destoryDrawUtil()
    handleMarkerForm('', [], null, undefined)
}

const saveMarker = async (form: MarkerData) => {
    const mapStore = useMapStore()
    const points = toRaw(mapStore.currentFeature)
    const geoJson = verticesToGeoJSON(points, mapStore.drawStatus)
    const data: MarkerData = {
        layerId: form.layerId,
        name: form.name,
        level: form.level,
        geoJson: JSON.stringify(geoJson),
        geometryType: form.geometryType
    }
    let res = null
    let successMsg = '添加成功！'
    let errorMsg = '添加失败！'
    if (mapStore.editMarker) {
        data.id = mapStore.editMarker
        successMsg = '编辑成功！'
        errorMsg = '编辑失败！'
        res = await mapApi.updateMarker(data)
    } else {
        res = await mapApi.saveMarker(data)
    }
    if (res?.code === 200) {
        ElMessage({
            message: successMsg,
            type: 'success'
        })
        // 添加到图层中
        window.$mapInstance.addCustomFeatures({
            layerId: form.layerId,
            list: [
                data
            ],
            geoJson: 'geoJson',
            styleFun: markerStyle
        })
        // 销毁绘制工具
        destoryDrawUtil()
    } else {
        ElMessage({
            message: errorMsg,
            type: 'error'
        })
    }
    return res
}

// 刷新图层数据
const refreshMarkerLayer = async (layerId: string | undefined) => {
    const mapStore = useMapStore()
    if (!layerId) return
    const status = mapStore.markerlayers[mapStore.markerlayers.findIndex(_ => _.id === layerId)].status
    window.$mapInstance.addCustomFeatures({
        layerId: layerId
    })
    if (status) {
        const res = await getMarkersByLayerId(layerId)
        window.$mapInstance.addCustomFeatures({
            layerId: layerId
        })
        window.$mapInstance.addCustomFeatures({
            layerId: layerId,
            list: res,
            geoJson: 'geoJson',
            styleFun: markerStyle
        })
    }
}

const init = () => {
    // watch(() => mapStore.drawStatus, (newVal, oldVal) => {
    //     if (newVal) {
    //         // window.$mapInstance.removePointerMoveSelect()
    //     } else {
    //         // window.$mapInstance.addPointerMoveSelect()
    //     }
    // }, {
    //     immediate: true
    // })
}

function useMap() {
    init()
    return {
        getVerticesByGeoJsonString,
        getLevelColor,
        getGeometryTypeCode,
        getGeometryTypeValue,
        getLevelValue,
        getLayerValue,
        changeFeatureLevel,
        handleAnimationSpeed,
        handleAnimationControl,
        handleMarkerDetails,
        handleMarkerForm,
        resetDrawStatus,
        handleEditMarker,
        handleDeleteMarker,
        destoryDrawUtil,
        getMarkerDetailsById,
        getMarkersByLayerId,
        addLayer,
        deleteLayer,
        updateLayer,
        getMarkLayers,
        refreshMarkerLayer,
        saveMarker
    }
}

export default useMap