<script setup>
const props = defineProps(['diff'])

const getColor = (part) => {
  const color = part.added ? "green" : part.removed ? "red" : "black";
  return color;
}

</script>

<template>
  <pre><span :style="{color:getColor(part)}" v-for="(part,index) in props.diff" v-bind:key="'c'+index">{{part.value}}</span></pre>
</template>

<style scoped>

</style>