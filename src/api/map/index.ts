import request from '@/utils/request'

import type { LayerData, LayerParams, MarkerData, MarkerParams } from './types'

import { useMapMockStore } from '@/stores/mapMock'
import { toRaw } from 'vue'

/**
 * 地图接口
 * @method getMarkersByLayerId 根据图层 id 获取图形
 */
export function useMapApi() {
    return {
        addLayer: (data: LayerData) => {
            return request({
                url: `/layer`,
                method: 'post',
                data
            })
        },
        deleteLayer: (id: string) => {
            return request({
                url: `/layer/${id}`,
                method: 'delete'
            })
        },
        updateLayer: (data: LayerData) => {
            return request({
                url: `/layer`,
                method: 'put',
                data
            })
        },
        getLayers: (params: LayerParams): any => {
            return new Promise((resolve, reject) => {
                const { layers } = useMapMockStore()
                resolve({
                    data: {
                        list: layers
                    }
                })
            })
        },
        updateMarker: (data: MarkerData) => {
            const _data: any = toRaw(data)
            const { markers } = useMapMockStore()
            const index = markers.findIndex(_ => _.id === data.id)
            markers.splice(index, 1, _data)
            return new Promise(resolve => {
                resolve({
                    code: 200
                })
            })
        },
        getMarkerDetails: (params: MarkerParams): any => {
            const { markers } = useMapMockStore()
            const data = markers[markers.findIndex(_ => _.id === params.id)]
            return new Promise(resolve => {
                resolve({
                    code: 200,
                    data: data
                })
            })
        },
        saveMarker: (data: MarkerData): any => {
            const { saveMarker } = useMapMockStore()
            saveMarker(data)
            return new Promise(resolve => {
                resolve({
                    code: 200
                })
            })
        },
        deleteMarker: (params: MarkerData) => {
            const { markers } = useMapMockStore()
            const index = markers.findIndex(_ => _.id === params.id)
            markers.splice(index, 1)
            return new Promise(resolve => {
                resolve({
                    code: 200
                })
            })
        },
        getMarkersByLayerId: (params: MarkerData): any => {
            return new Promise((resolve) => {
                const { markers } = useMapMockStore()
                resolve({
                    code: 200,
                    data: {
                        list: markers
                    }
                })
            })
        }
    }
}
