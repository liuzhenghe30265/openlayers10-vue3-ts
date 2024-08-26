<template>
    <div class="map-container layout-pd">
        <MapMain />
    </div>
</template>

<script setup lang="ts">
import MapMain from './components/OlMap/MapMain.vue'
</script>

<style lang="scss" scoped>
.map-container {
    overflow: hidden;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
}
</style>