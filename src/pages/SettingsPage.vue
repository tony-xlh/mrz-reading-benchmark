<template>
  <q-page>
    <div class="full">
      <div class="header">
        <div class="text-h6 fontOswald">{{projectName}}</div>
      </div>
      <div class="container">
        <q-list bordered class="rounded-borders">
          <q-item-label header>Barcode Reader Configuration</q-item-label>
          <div v-for="(config,index) of readerConfigs" v-bind:key="index">
            <q-item>
              <q-item-section top>
                <q-item-label>
                  <label>Engine: </label>
                  <select v-model="config.engine">
                    <option v-for="engine of supportedEngines" v-bind:key="'config-'+engine" :value="engine">
                      {{ engine }}
                    </option>
                  </select>
                </q-item-label>
                <q-item-label lines="1">
                  <label>Display Name: </label>
                  <input type="text" v-model="config.displayName"/>
                </q-item-label>
                <q-item-label lines="1">
                  <label>Color: </label>
                  <input type="text" v-model="config.color"/>
                  <span>
                    <q-btn class="gt-xs" size="12px" flat dense round icon="colorize"/>
                    <q-popup-edit v-model="config.color" auto-save v-slot="scope">
                      <q-color v-model="scope.value"/>
                    </q-popup-edit>
                  </span>
                </q-item-label>
              </q-item-section>
              <q-item-section top side>
                <div class="text-grey-8 q-gutter-xs">
                  <q-btn class="gt-xs" size="12px" flat dense round icon="arrow_upward" v-on:click="moveUp(index)" />
                  <q-btn class="gt-xs" size="12px" flat dense round icon="arrow_downward" v-on:click="moveDown(index)" />
                  <q-btn class="gt-xs" size="12px" flat dense round icon="delete" v-on:click="deleteConfig(index)" />
                  <q-btn class="gt-xs" size="12px" flat dense round icon="settings" v-on:click="showSettingsModal(index,config.engine)" />
                </div>
              </q-item-section>
            </q-item>
            <q-separator spaced />
          </div>
          <q-item>
            <dynamsoft-button label="Add Configuration" v-on:click="addConfig"></dynamsoft-button>
            <dynamsoft-button style="margin-left:10px;" label="Save" v-on:click="save"></dynamsoft-button>
          </q-item>
    </q-list>
      </div>
    </div>
  </q-page>
  <q-dialog v-model="showSettings">
    <q-card>
      <q-card-section>
        <div class="text-h6">Settings</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div v-for="setting in MRZReaderSettings" v-bind:key="setting.name">
          <div>
            <label for="'settings-' + setting.name">{{ setting.name + ":" }}</label>
          </div>
          <div v-if="setting.type === 'string'">
            <textarea :id="'settings-' + setting.name" v-model="setting.value"/>
          </div>
          <div v-if="setting.type === 'select'">
            <select v-model="setting.value">
              <option v-for="option in getSettingOptions(setting.name)" v-bind:key="'engine-'+option" :value="option">{{ option }}</option>
            </select>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat v-close-popup color="primary" label="Save" @click="saveSettings()"/>
        <q-btn flat v-close-popup color="primary" label="Close"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { MRZReader, ReaderConfig, Setting } from "src/reader/MRZReader";
import DynamsoftButton from "src/components/DynamsoftButton.vue";
import { moveItemUp, moveItemDown, defaultReaderConfigs, loadProjectReaderConfigs, getLocalForage } from "src/utils"

const projectName = ref("");
const router = useRouter();
const readerConfigs = ref([] as ReaderConfig[]);
const supportedEngines = ref([] as string[]);
const showSettings = ref(false);
const MRZReaderSettings = ref([] as Setting[]);
const settingOptions = ref({} as any);
let selectedIndex = -1;
let localForage = getLocalForage();
onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  supportedEngines.value = MRZReader.getEngines();
  console.log(projectName.value);
  const configs = await loadProjectReaderConfigs(router.currentRoute.value.params.name as string);
  readerConfigs.value = configs;
});

const createDefaultConfigs = () => {
  readerConfigs.value = defaultReaderConfigs();
}

const addConfig = () => {
  const configs = readerConfigs.value;
  const config:ReaderConfig = {
      engine:supportedEngines.value[0],
      displayName:supportedEngines.value[0],
      settings:[]
    }
  configs.push(config);
  readerConfigs.value = configs;
}

const moveUp = (index:number) => {
  moveItemUp(readerConfigs.value,index);
}

const moveDown = (index:number) => {
  moveItemDown(readerConfigs.value,index);
}

const deleteConfig = (index:number) => {
  const configs = readerConfigs.value;
  configs.splice(index,1);
  readerConfigs.value = configs;
}

const save = async () => {
  const configs:ReaderConfig[] = JSON.parse(JSON.stringify(readerConfigs.value));
  await localForage.setItem(projectName.value+":settings",configs);
  alert("Saved");
}

const saveSettings = () => {
  if (selectedIndex != -1) {
    readerConfigs.value[selectedIndex].settings = JSON.parse(JSON.stringify(MRZReaderSettings.value));
  }
}

const showSettingsModal = async (index:number,selectedEngine:string) => {
  selectedIndex = index;
  MRZReaderSettings.value
  const settingDefItems = MRZReader.getSupportedSettings(selectedEngine);
  const defaultSettings = MRZReader.getDefaultSettings(selectedEngine);
  const settings = readerConfigs.value[selectedIndex].settings;
  const keysOfOptionalSettings = [];
  
  for (let index = settings.length - 1; index >= 0; index--) {
    const setting = settings[index];
    let settingInDef = false;
    for (const settingDef of settingDefItems) {
      if (setting.name === settingDef.name) {
        settingInDef = true;
        break;
      }
    }
    if (settingInDef === false) { //setting not in def. Maybe the engine is changed.
      settings.splice(index,1);
    }
  }
    
  for (const settingDef of settingDefItems) {
    let exist = false;
    if (settingDef.type === "select") {
      keysOfOptionalSettings.push(settingDef.name);
    }
    for (const setting of settings) {
      if (setting.name === settingDef.name) {
        exist = true;
        break;
      }
    }
    if (!exist) { //add default items
      const value = defaultSettings[settingDef.name] ?? "";
      settings.push({name:settingDef.name,value:value,type:settingDef.type});
    }
  }
  MRZReaderSettings.value = settings;
  getSettingsOptions(keysOfOptionalSettings,selectedEngine);
  showSettings.value = true;
}

const getSettingOptions = (key:string):string[] => {
  return settingOptions.value[key];
}

const getSettingsOptions = async (keys:string[],selectedEngine:string) => {
  const optionsOfSettings:any = {};
  for (const key of keys) {
    const optionsOfSetting = await MRZReader.getSettingOptions(selectedEngine,key,MRZReaderSettings.value);  
    optionsOfSettings[key] = optionsOfSetting;
  }
  settingOptions.value = optionsOfSettings;
}

const change = (config:ReaderConfig,newValue:any) => {
  console.log("change");
  console.log(newValue);
}

</script>
<style scoped>
.full {
  width:100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container {
  width: 100%;
  padding-left: 30px;
  padding-right: 30px;
  padding-bottom: 30px;
}

label {
  font-weight: normal;
}
</style>