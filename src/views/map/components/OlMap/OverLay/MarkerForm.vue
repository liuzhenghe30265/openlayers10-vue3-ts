<template>
    <div class="marker-form">
        <el-form size="small" ref="ruleFormRef" :rules="rules" :model="form" label-width="auto"
            style="max-width: 600px">
            <el-form-item label="名称" prop="name">
                <el-input v-model="form.name" />
            </el-form-item>
            <!-- <el-form-item label="图层" prop="layerId">
                <el-select v-model="form.layerId" placeholder="请选择图层">
                    <el-option v-for="(item, index) of mapStore.markerlayers" :key="index" :label="item.name"
                        :value="item.id" />
                </el-select>
            </el-form-item> -->
            <el-form-item label="等级" prop="level">
                <el-select v-model="form.level" placeholder="请选择等级" @change="handleSelect">
                    <el-option v-for="(item, index) of mapStore.markerLevel" :key="index" :label="item.label"
                        :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="submitForm(ruleFormRef)">保存</el-button>
                <el-button @click="handleCancel()">取消</el-button>
            </el-form-item>
            <el-form-item label="轨迹运动">
                <el-button :type="animationStatus ? 'danger' : 'primary'" @click="handleAnimation()">{{ animationStatus
                    ? '停止' : '开始' }}</el-button>
            </el-form-item>
            <el-form-item label="速度">
                <el-slider v-model="animationSpeed" :min="1" :max="500" :show-tooltip="false"
                    @input="animationSpeedChange" />
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import useMap from '@/hooks/useMap'
const {
    changeFeatureLevel,
    saveMarker,
    getGeometryTypeValue,
    destoryDrawUtil,
    getMarkerDetailsById,
    handleAnimationSpeed,
    handleAnimationControl
} = useMap()

import { useMapStore } from '@/stores/map'
const mapStore = useMapStore()

watch(() => mapStore.editMarker, async (val: any) => {
    if (val) {
        const info = await getMarkerDetailsById(val)
        form.name = info.name
        form.layerId = info.layerId
        form.level = info.level
        form.geometryType = info.geometryType
    }
})

const coordinates = computed(() => {
    return mapStore.currentFeature
})

const animationStatus = ref(false)
const animationSpeed = ref(50)
const handleAnimation = () => {
    animationStatus.value = !animationStatus.value
    handleAnimationControl(animationStatus.value ? 'start' : 'stop', coordinates.value)
}
const animationSpeedChange = (val: number) => {
    handleAnimationSpeed(val)
}

const ruleFormRef = ref<FormInstance>()
const rules = reactive<FormRules>({
    name: [
        { required: true, message: '请输入名称', trigger: 'blur' }
    ],
    layerId: [
        {
            required: true,
            message: '请选择图层',
            trigger: 'change'
        }
    ],
    level: [
        {
            required: false,
            message: '请选择等级',
            trigger: 'change'
        }
    ]
})

const form = reactive({
    name: '',
    layerId: '1',
    level: 1,
    geometryType: 1
})

const resetAnimation = () => {
    animationStatus.value = false
    handleAnimationControl()
}

const handleCancel = () => {
    resetAnimation()
    resetForm(ruleFormRef.value)
    destoryDrawUtil()
}

const resetForm = (formEl: FormInstance | undefined) => {
    resetAnimation()
    if (!formEl) return
    formEl.resetFields()
}

const submitForm = async (formEl: FormInstance | undefined) => {
    if (!formEl) return
    await formEl.validate(async (valid, fields) => {
        if (valid) {
            form.geometryType = getGeometryTypeValue(mapStore.drawStatus)
            const res = await saveMarker(form)
            if (res?.code === 200) {
                resetForm(ruleFormRef.value)
            }
        } else {
            console.log('error submit!', fields)
        }
    })
}

const handleSelect = (val: number) => {
    changeFeatureLevel(form.layerId, mapStore.editMarker, val)
}
</script>

<style lang="scss" scoped>
.marker-form {
    background: #fff;
    padding: 20px;
    transform: translateX(10px) translateY(10px);
}
</style>
