<script setup lang="ts">
import {
    ref,
    reactive,
    watch,
    computed,
    onMounted
} from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

import { useMapStore } from '@/stores/map'
const mapStore = useMapStore()

import useMap from '@/hooks/useMap'

const emit = defineEmits([
    'downloadLayer',
    'draw',
    'customLayer',
    'baseLayer',
    'zoomOption',
    'layerChange',
    'markLayer'
])

import { config } from '@/utils/map/config'
const baseLayer = reactive(config.baseLayer)

const subLayer = reactive(config.subLayer)
// watch(() => subLayer, (val) => {
//     console.log('watch subLayer', val)
//     console.log(config.subLayer)
// }, {
//     deep: true,
//     immediate: true
// })

const drawTypes = reactive([
    {
        label: '点',
        value: 'Point',
        icon: new URL('@/assets/images/toolBar/Point.png', import.meta.url).href,
        status: computed(() => {
            return mapStore.drawStatus === 'Point'
        })
    },
    {
        label: '折线',
        value: 'LineString',
        icon: new URL('@/assets/images/toolBar/LineString.png', import.meta.url).href,
        status: computed(() => {
            return mapStore.drawStatus === 'LineString'
        })
    },
    {
        label: '多边形',
        value: 'Polygon',
        icon: new URL('@/assets/images/toolBar/Polygon.png', import.meta.url).href,
        status: computed(() => {
            return mapStore.drawStatus === 'Polygon'
        })
    }
])

const zoomOption = reactive([
    {
        label: '',
        value: 'zoomIn',
        icon: new URL('@/assets/images/toolBar/icon04.png', import.meta.url).href
    },
    {
        label: '',
        value: 'zoomOut',
        icon: new URL('@/assets/images/toolBar/icon05.png', import.meta.url).href
    }
])

const customLayer = reactive([
    // {
    //     label: '堆场',
    //     layerId: 'StorageYard',
    //     status: false
    // },
    // {
    //     label: '堆场（聚合）',
    //     layerId: 'StorageYardCluster',
    //     status: false
    // },
    // {
    //     label: '消防点位分布管理图层',
    //     layerId: 'FireStation',
    //     status: false
    // },
    // {
    //     label: '编辑图层',
    //     layerId: 'EditLayer',
    //     status: false
    // },
    {
        label: '随机点位',
        layerId: 'RandomPoint',
        status: false
    }
])

const handleDraw = (data: { value: string }) => {
    emit('draw', data.value)
}

const handleAddLayer = () => {
    ElMessageBox.prompt('', '添加图层', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPattern:
            /^.+$/,
        inputErrorMessage: '不能为空'
    })
        .then(async ({ value }) => {
            const { addLayer } = useMap()
            const res = await addLayer({
                name: value
            })
            if (res?.code === 200) {
                ElMessage({
                    message: '添加成功！',
                    type: 'success'
                })
                const { getMarkLayers } = useMap()
                getMarkLayers({
                    pageNo: 1,
                    pageSize: 10,
                    isAsc: false,
                    sortBy: ''
                })
            } else {
                ElMessage({
                    message: '添加失败！',
                    type: 'error'
                })
            }
        })
        .catch(() => {
            ElMessage({
                message: '添加失败！',
                type: 'error'
            })
        })
}

const handleDeleteLayer = (data: { id: string }) => {
    ElMessageBox.confirm('', '确认删除？', {
        confirmButtonText: '确认',
        cancelButtonText: '取消'
    })
        .then(async () => {
            const { deleteLayer } = useMap()
            const res = await deleteLayer(data.id)
            if (res?.code === 200) {
                ElMessage({
                    message: '删除成功！',
                    type: 'success'
                })
                const { getMarkLayers } = useMap()
                getMarkLayers({
                    pageNo: 1,
                    pageSize: 10,
                    isAsc: false,
                    sortBy: ''
                })
            } else {
                ElMessage({
                    message: '删除失败！',
                    type: 'error'
                })
            }
        })
        .catch(() => {
            ElMessage({
                message: '删除失败！',
                type: 'error'
            })
        })
}

const handleEditLayer = (data: { name: string; id: string }) => {
    ElMessageBox.prompt('', '', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPattern:
            /^.+$/,
        inputErrorMessage: '不能为空',
        inputValue: data.name
    })
        .then(async ({ value }) => {
            const { updateLayer } = useMap()
            const res = await updateLayer({
                id: data.id,
                name: value
            })
            if (res?.code === 200) {
                ElMessage({
                    message: '更新成功！',
                    type: 'success'
                })
                const { getMarkLayers } = useMap()
                getMarkLayers({
                    pageNo: 1,
                    pageSize: 10,
                    isAsc: false,
                    sortBy: ''
                })
            } else {
                ElMessage({
                    message: '更新失败！',
                    type: 'error'
                })
            }
        })
        .catch(() => {
            ElMessage({
                message: '更新失败！',
                type: 'error'
            })
        })
}

const handleDownLoad = (layerId: string) => {
    emit('downloadLayer', layerId)
}

const handleCustomLayerClick = (item: { label: string; layerId: string; status: boolean }) => {
    item.status = !item.status
    emit('customLayer', item)
}

const changeBaseLayer = (data: any) => {
    mapStore.setBaseLayer(data.id)
    emit('baseLayer', data.id)
}

const handleZoomClick = (data: { value: string }) => {
    emit('zoomOption', data)
}

const handleLayerClick = (data: { visible: boolean }) => {
    data.visible = !data.visible
    emit('layerChange', data)
}

const handleMarkLayerClick = (data: { status: boolean }) => {
    data.status = !data.status
    emit('markLayer', data)
}

</script>

<template>
    <div class="tool-bar-container">
        <div class="tbc-section">
            <div class="ts-item" :class="{ active: item.status }" v-for="(item, index) of drawTypes" :key="index"
                @click="handleDraw(item)">
                <span class="sp icon" :style="{ maskImage: `url(${item.icon})` }"></span>
                <!-- <span v-if="item.label" class="sp label">{{ item.label }}</span> -->
            </div>
        </div>
        <div class="tbc-section">
            <div class="ts-item" v-for="(item, index) of zoomOption" :key="index" @click="handleZoomClick(item)">
                <span class="sp icon" :style="{ maskImage: `url(${item.icon})` }"></span>
                <span v-if="item.label" class="sp label">{{ item.label }}</span>
            </div>
        </div>
        <div class="tbc-layers">
            <h3>图层显示</h3>
            <div class="tl-item" :class="{ active: mapStore.baseLayer === item.id }" @click="changeBaseLayer(item)"
                v-for="(item, index) of baseLayer" :key="index">
                <span class="sp label">{{ item.name }}</span>
            </div>
            <hr>
            <div class="tl-item" :class="{ active: item.status }" @click="handleMarkLayerClick(item)"
                v-for="(item, index) of mapStore.markerlayers" :key="index">
                <span class="sp label">{{ item.name }}</span>
                <!-- <el-icon @click.stop="handleEditLayer(item)"><Edit /></el-icon>
                <el-icon @click.stop="handleDeleteLayer(item)"><Delete /></el-icon> -->
            </div>
            <!-- <el-icon @click.stop="handleAddLayer()"><Plus /></el-icon> -->
            <hr>
            <div class="tl-item" :class="{ active: item.status }" @click="handleCustomLayerClick(item)"
                v-for="(item, index) of customLayer" :key="index">
                <span class="sp label">{{ item.label }}</span>
                <el-icon @click.stop="handleDownLoad(item.layerId)"><Download /></el-icon>
            </div>
            <hr>
            <div class="tl-item" :class="{ active: item.visible }" v-for="(item, index) of subLayer" :key="index"
                @click="handleLayerClick(item)">
                <span class="sp label">{{ item.name }}</span>
                <el-icon @click.stop="handleDownLoad(item.id)"><Download /></el-icon>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.tool-bar-container {
    user-select: none;
    display: flex;

    .tbc-section {
        display: flex;
        background: #fff;
        border-radius: 4px;
        margin: 0 0 0 20px;

        .ts-item {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 6px 10px;
            color: #828282;

            .sp {
                &.icon {
                    width: 30px;
                    height: 30px;
                    mask-size: contain;
                    mask-repeat: no-repeat;
                    mask-position: center;
                    background: #828282;
                }

                &.label {
                    margin: 0 0 0 10px;
                    font-size: 18px;
                }
            }

            &.active {
                color: #3478F5;

                .sp {
                    &.icon {
                        background: #3478F5;
                    }
                }
            }
        }
    }

    .tbc-layers {
        position: absolute;
        top: 50px;
        right: 0;
        width: max-content;
        background: #fff;
        border-radius: 4px;
        font-size: 16px;
        padding: 10px;

        .tl-item {
            margin: 10px 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;

            &.active {
                color: #3478F5;
            }
        }
    }
}
</style>