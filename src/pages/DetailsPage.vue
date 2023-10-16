<template>
  <div class="q-pa-md example-row-equal-width">
    <div class="row">
      <div class="col" style="padding-right:10px;">
        <div>
          <label style="font-size: 16px;">Engines:</label>
        </div>
        <div class="row" style="padding-bottom: 20px;">
          <select v-model="selectedEngineDisplayName" @update:model-value="selectedEngineChanged($event)" style="min-width: 200px">
            <option v-for="config in readerConfigs" :value="config.displayName" v-bind:key="'engine-'+config.displayName">
              {{ config.displayName }}
            </option>
          </select>
        </div>
        <div class="row results">
          <div>
            <div>
              Ground Truth:
              <pre>{{ groundTruth }}</pre>
            </div>
            <div>
              Detection Result:
              <pre>{{ getJointResults(ocrResults) }}</pre>
            </div>
          </div>
        </div>
        <div style="max-height:75vh;overflow:auto;">
          <img class="mrz-image" :src="dataURL" alt="image"/>
        </div>
        <div v-if="!dataURL">Downloading... </div>
      </div>
    </div>
    <div class="row">
      <q-btn outline color="red" label="Delete this image" v-on:click="deleteThisImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { MRZReader, ReaderConfig, OCRResult, DetectionResult } from "src/reader/MRZReader";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import localForage from "localforage";
import { getJointResults, BlobtoDataURL, dataURLtoBlob, getFilenameWithoutExtension, loadProjectReaderConfigs } from "src/utils";
import { Project } from "src/project";
import { useMeta } from "quasar";
import DynamsoftButton from "src/components/DynamsoftButton.vue";
const router = useRouter();
const projectName = ref("");
const imageName = ref("");
const selectedEngineDisplayName = ref("");
const readerConfigs = ref([] as ReaderConfig[])
const imgWidth = ref(0);
const imgHeight = ref(0);
const dataURL = ref("");
const ocrResults = ref([] as OCRResult[]);
const groundTruth = ref("");

let reader: MRZReader;

onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  imageName.value = router.currentRoute.value.params.imageName as string;
  selectedEngineDisplayName.value = router.currentRoute.value.params.engine as string;
  const configs = await loadProjectReaderConfigs(router.currentRoute.value.params.name as string);
  readerConfigs.value = configs;
  useMeta({
    // sets document title
    title: 'Barcode Reading Benchmark - '+ projectName.value + ' - ' + imageName.value,
  })
  loadImage();
  loadOCRResultsAndGroundTruth(router.currentRoute.value.params.engine as string);
});

const getSelectedReaderConfig = (displayName?:string) => {
  let name;
  if (displayName) {
    name = displayName;
  }else{
    name = selectedEngineDisplayName.value;
  }
  for (const config of readerConfigs.value) {
    if (config.displayName === name) {
      return config;
    }
  }
  return undefined;
}

const loadImage = async () => {
  const imageDataURL:string|null|undefined = await localForage.getItem(projectName.value+":image:"+imageName.value);
  if (imageDataURL) {
    let img = new Image();
    img.src = imageDataURL;
    img.onload = function(){
      imgWidth.value = img.width;
      imgHeight.value = img.height;
      dataURL.value = imageDataURL;
    }
  }else{
    const resp = await fetch ("./dataset/"+projectName.value+"/"+imageName.value);
    const blob = await resp.blob();
    if (blob.size>0) {
      const convertedDataURL = await BlobtoDataURL(blob);
      await localForage.setItem(projectName.value+":image:"+imageName.value,convertedDataURL);
      loadImage();
    }
  }
}

const loadOCRResultsAndGroundTruth = async (displayName?:string,detectionResult?:DetectionResult) => {
  let name;
  if (displayName) {
    name = displayName;
  }else{
    name = selectedEngineDisplayName.value;
  }
  if (detectionResult) {
    ocrResults.value = detectionResult.results;
  }else{
    const detectionResultString:string|null|undefined = await localForage.getItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName.value)+"-"+name+".json");
    if (detectionResultString) {
      detectionResult = JSON.parse(detectionResultString);
      if (detectionResult) {
        ocrResults.value = detectionResult.results;
      }
    }else{
      ocrResults.value = [];
    }
  }
  const groundTruthString:string|null|undefined = await localForage.getItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(imageName.value)+".txt");
  if (groundTruthString) {
    groundTruth.value = groundTruthString;
  }
}

const selectedEngineChanged = (displayName:string) => {
  selectedEngineDisplayName.value = displayName;
  loadOCRResultsAndGroundTruth(displayName);
}

const deleteThisImage = async () => {
  localForage.removeItem(projectName.value+":image:"+imageName.value);
  localForage.removeItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(imageName.value)+".txt");
  const savedProjects = await localForage.getItem("projects");
  if (savedProjects) {
    const projects:Project[] = JSON.parse(savedProjects as string);
    for (let i = 0; i < projects.length; i++) {
      if (projects[i].info.name === projectName.value) {
        const project = projects[i];
        const newImages = [];
        for (let j = 0; j < project.info.images.length; j++) {
          const name = project.info.images[j];
          if (name != imageName.value) { //skip the current image
            newImages.push(name);
          }
        }
        project.info.images = newImages;
      }
    }
    await localForage.setItem("projects", JSON.stringify(projects));
    alert("deleted");
  }
}

const downloadImage = () => {
  if (dataURL.value) {
    const blob = dataURLtoBlob(dataURL.value);
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob);
    link.download = imageName.value;
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }else{
    alert("The image has not been downloaded.");
  }
}
</script>
<style>

pre {
  padding: 5px;
  margin: 0;
  white-space: break-spaces;
  word-wrap: break-word;
}

.fade {
  animation-name: fadeIn;
  animation-duration: 1.5s;
}

@keyframes fadeIn {
  from {
    opacity: 0.4;
  }
  to {
    opacity: 1;
  }
}

.list-header {
  padding:10px;
  background: #eeeeee;
}

.list {
  margin-right:10px;
}

.mrz-image {
  width: 50%;
}

.image-container {
  width: 50%;
}
</style>
