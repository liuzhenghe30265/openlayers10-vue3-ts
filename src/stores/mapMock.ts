// 模拟接口数据

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'

export const useMapMockStore = defineStore('mapMock', () => {
    const markers = ref([
        {
            'id': '1',
            'layerId': '1',
            'name': '点标注',
            'level': 1,
            'geoJson': '{"type":"Feature","geometry":{"type":"Point","coordinates":[13123222.60172735,4744546.851402679]}}',
            'geometryType': 1
        },
        {
            'id': '2',
            'layerId': '1',
            'name': '线标注',
            'level': 2,
            'geoJson': '{"type":"Feature","geometry":{"type":"LineString","coordinates":[[13119349.790739119,4742584.967287915],[13121056.885148378,4737336.292123224],[13127171.847411193,4737361.770743873],[13131758.069108304,4738202.57805501],[13131656.152293032,4742406.614610695],[13131656.152293032,4744368.49872546]]}}',
            'geometryType': 2
        },
        {
            'id': '3',
            'layerId': '1',
            'name': '面标注',
            'level': 3,
            'geoJson': '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[13121540.514928775,4729233.967124995],[13131627.466513,4729463.27820985],[13134786.007685408,4724138.163684201],[13130659.527491862,4720978.768070196],[13123119.786680998,4722176.280735773],[13118942.360732839,4725233.76186718],[13121540.514928775,4729233.967124995]]]}}',
            'geometryType': 3
        }
    ])
    const saveMarker = (data: any) => {
        data.id = markers.value.length + 1
        markers.value.unshift(data)
    }

    const layers = ref([
        {
            'id': '1',
            'name': '自定义标注图层'
        }
    ])
    function setLayers(data: []) {
        layers.value = data
    }

    return {
        markers, saveMarker,
        layers, setLayers
    }
})
