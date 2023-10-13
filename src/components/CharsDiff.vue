<script setup>
import { diffChars } from "diff";
import { onMounted, onUpdated, ref } from "vue";
const props = defineProps(['str1','str2'])
const diff = ref();

const getColor = (part) => {
  const color = part.added ? "green" : part.removed ? "red" : "black";
  return color;
}

onMounted(()=>{
  diff.value = diffChars(props.str1, props.str2);
})

onUpdated(()=>{
  diff.value = diffChars(props.str1, props.str2);
})



</script>

<template>
  <pre><span :style="{color:getColor(part)}" v-for="(part,index) in diff" v-bind:key="'c'+index">{{part.value}}</span></pre>
</template>

<style scoped>

</style>