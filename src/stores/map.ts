import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'

interface layerType {
    id: string
    status: boolean
    name: string
}

export const useMapStore = defineStore('map', () => {
    const geometryTypes = ref([
        {
            label: '点',
            value: 1,
            code: 'Point'
        },
        {
            label: '折现',
            value: 2,
            code: 'LineString'
        },
        {
            label: '多边形',
            value: 3,
            code: 'Polygon'
        }
    ])

    const markerLevel = ref([
        {
            label: '一级',
            value: 1,
            color: '#FC2F2F'
        },
        {
            label: '二级',
            value: 2,
            color: '#FF8E47'
        },
        {
            label: '三级',
            value: 3,
            color: '#FAC02B'
        },
        {
            label: '四级',
            value: 4,
            color: '#1C92FF'
        }
    ])

    const markerDetails: any = ref() // 标注信息（弹窗）
    function setMarkerDetails(data: any) {
        markerDetails.value = data
    }

    const editMarker = ref('') // 当前正在编辑的标注
    function setEditMarker(data: string) {
        editMarker.value = data
    }

    const markerlayers = ref<layerType[]>([]) // 图层列表
    function setMarkerLayers(data: []) {
        markerlayers.value = data
    }

    const currentFeature = ref([]) // 绘制的坐标顶点
    function setCurrentFeature(data: []) {
        currentFeature.value = data
    }

    const drawStatus = ref('') // 绘制状态
    function setDrawStatus(data: string) {
        drawStatus.value = data
    }

    const baseLayer = ref(1) // 底图
    function setBaseLayer(data: number) {
        baseLayer.value = data
    }

    return {
        geometryTypes,
        markerLevel,
        markerDetails, setMarkerDetails,
        editMarker, setEditMarker,
        markerlayers, setMarkerLayers,
        currentFeature, setCurrentFeature,
        drawStatus, setDrawStatus,
        baseLayer, setBaseLayer
    }
})
