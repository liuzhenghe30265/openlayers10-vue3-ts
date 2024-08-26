<template>
    <div class="animation-container">
        <img :src="icon" alt="">
    </div>
</template>

<script setup lang="ts">
const icon = new URL('@/assets/images/icon01.png', import.meta.url).href
</script>

<style lang="scss" scoped>
.animation-container {
    img {
        width: 40px;
    }
}
</style>
