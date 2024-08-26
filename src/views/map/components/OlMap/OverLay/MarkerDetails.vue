<template>
    <div class="marker-details">
        <el-form size="small" ref="ruleFormRef" label-width="auto" style="max-width: 600px">
            <el-form-item label="名称">
                {{ info?.name }}
            </el-form-item>
            <el-form-item label="图层">
                {{ getLayerName(info?.layerId) }}
            </el-form-item>
            <el-form-item label="等级">
                {{ getLevelName(info?.level) }}
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleEdit">编辑</el-button>
                <el-button type="danger" @click="handleDelete">删除</el-button>
            </el-form-item>

        </el-form>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMapStore } from '@/stores/map'
const mapStore = useMapStore()

import useMap from '@/hooks/useMap'
const {
    getLevelValue,
    getLayerValue,
    handleDeleteMarker,
    handleEditMarker
} = useMap()

const handleEdit = () => {
    handleEditMarker(info.value)
}

const handleDelete = () => {
    if (!mapStore.drawStatus && info.value.id) {
        handleDeleteMarker(info.value)
    }
}

const info = computed(() => {
    return mapStore.markerDetails
})

const getLayerName = computed(() => {
    return (val: string) => {
        const data = getLayerValue(val)
        return data?.name
    }
})
const getLevelName = computed(() => {
    return (val: number) => {
        const data = getLevelValue(val)
        return data?.label
    }
})
</script>

<style lang="scss" scoped>
.marker-details {
    background: #fff;
    padding: 10px;
    width: 200px;
    border-radius: 8px;
    transform: translateX(10px) translateY(10px);

    .el-form-item {
        margin-bottom: 0;
    }
}
</style>