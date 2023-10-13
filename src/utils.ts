import { MRZReader, ReaderConfig, OCRResult, DetectionResult } from "./reader/MRZReader";
import { EngineDataTableRow, PerformanceMetrics, EngineStatistics } from "./definitions/definitions";
import leven from 'leven';
import { Project } from "./project";
import localForage from "localforage";

//scanned.jpg => scanned
export const getFilenameWithoutExtension = (filename:string) => {
  if (filename.lastIndexOf(".") != -1) {
    return filename.substring(0,filename.lastIndexOf("."));
  }else{
    return filename;
  }
}

export const readFileAsDataURL = async (file:File):Promise<string> => {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.onload = function(e:any){
      resolve(e.target.result);
    };
    fileReader.onerror = function () {
      reject('oops, something went wrong.');
    };
    fileReader.readAsDataURL(file);
  });
}

export const readFileAsText = async (file:File):Promise<string> => {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.onload = function(e:any){
      resolve(e.target.result);
    };
    fileReader.onerror = function () {
      reject('oops, something went wrong.');
    };
    fileReader.readAsText(file);
  });
}

export const removeProjectFiles = async (project:Project) => {
  for (let index = 0; index < project.info.images.length; index++) {
    const imageName = project.info.images[index];
    await localForage.removeItem(project.info.name+":image:"+imageName);
    await localForage.removeItem(project.info.name+":groundTruth:"+getFilenameWithoutExtension(imageName)+".txt");
  }
  const detectionResultFileNamesList:undefined|null|string[] = await localForage.getItem(project.info.name+":detectionResultFileNamesList");
  if (detectionResultFileNamesList) {
    for (let index = 0; index < detectionResultFileNamesList.length; index++) {
      const filename = detectionResultFileNamesList[index];
      await localForage.removeItem(project.info.name+":detectionResult:"+filename);  
    }
  }
  //await localForage.removeItem(project.info.name+":settings");
  await localForage.removeItem(project.info.name+":detectionResultFileNamesList");
  await localForage.removeItem(project.info.name+":results.zip");
  project.info.images = [];
}

export function dataURLtoBlob(dataURL:string):Blob {
  const mime = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const binary = atob(dataURL.split(',')[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
     array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: mime});
}

export function BlobtoDataURL(blob:Blob):Promise<string> {
  return new Promise(function (resolve,reject) {
    const fr = new FileReader();
    fr.onload = function (e) {
      if (e.target) {
        if (typeof(e.target.result) === "string") {
          resolve(e.target.result);
        }else{
          reject("")
        }
      }
    }
    fr.readAsDataURL(blob)
  });
}

export async function loadProjectReaderConfigs(projectName:string){
  const configs:undefined|null|ReaderConfig[] = await localForage.getItem(projectName+":settings");
  if (configs) {
    return configs;
  }else{
    return defaultReaderConfigs();
  }
}

export function defaultReaderConfigs() {
  const engines = MRZReader.getEngines();
  const configs:ReaderConfig[] = [];
  for (const engine of engines) {
    const config:ReaderConfig = {
      engine:engine,
      displayName:engine,
      settings:[]
    }
    configs.push(config);
  }
  return configs;
}

export function sleep(time:number){
  return new Promise(function(resolve){
    setTimeout(resolve, time);
  });
}

export function moveItemUp(arr:any[], index:number) {
  if (index <= 0 || index > arr.length - 1) { //out of bounds
    return arr;
  }else{
    const item = arr.splice(index,1)[0]; //delete the item
    arr.splice(index - 1,0,item); //add the item
    return arr;
  }
}

export function moveItemDown(arr:any[], index:number) {
  if (index < 0 || index + 1 > arr.length - 1) { //out of bounds
    return arr;
  }else{
    const item = arr.splice(index,1)[0]; //delete the item
    arr.splice(index + 1,0,item); //add the item
    return arr;
  }
}


export const calculateEngineStatistics = async (project:Project,engine:string,category?:string) => {
  const projectName = project.info.name;
  const newRows = [];
  let totalElapsedTime = 0;
  let totalCorrectFiles = 0;
  let totalDetectedFiles = 0;
  let totalScore = 0;
  for (let index = 0; index < project.info.images.length; index++) {
    const imageName = project.info.images[index];
    if (category) {
      if (imageName.split("/")[0] != category) { //not of the category
        continue;
      }
    }
    
    const groundTruthString:string|null|undefined = await localForage.getItem(projectName+":groundTruth:"+getFilenameWithoutExtension(imageName)+".txt");
    if (groundTruthString) {
      let elapsedTime = "";
      const detectionResultString:string|null|undefined = await localForage.getItem(projectName+":detectionResult:"+getFilenameWithoutExtension(imageName)+"-"+engine+".json");
      if (detectionResultString) {
        const detectionResult:DetectionResult = JSON.parse(detectionResultString);
        totalDetectedFiles = totalDetectedFiles + 1;
        elapsedTime = detectionResult.elapsedTime.toString();
        totalElapsedTime = totalElapsedTime + detectionResult.elapsedTime;
        const text = getJointResults(detectionResult.results);
        const score = calculateSimilarity(groundTruthString,text);
        if (score === 1.0) {
          totalCorrectFiles = totalCorrectFiles + 1;
        }
        const row:EngineDataTableRow = {
          number: (index + 1),
          filename: imageName,
          groundTruth: groundTruthString,
          detectedText: text,
          time: elapsedTime,
          score:score
        }
        totalScore = totalScore + score;
        newRows.push(row);
      }
    }
  }
  
  const performanceMetrics:PerformanceMetrics = {
    fileNumber: project.info.images.length,
    correctFilesNumber: totalCorrectFiles,
    score: totalScore/totalDetectedFiles,
    averageTime: parseFloat((totalElapsedTime / totalDetectedFiles).toFixed(2))
  }
  const engineStatistics:EngineStatistics = {
    name:engine,
    metrics:performanceMetrics,
    rows:newRows
  };
  return engineStatistics;
}

function getJointResults(results:OCRResult[]){
  let s = "";
  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    s = s + result.text;
    if (index < results.length - 1) {
      s = s + "\r\n";
    }
  }
  return s;
}

function calculateSimilarity(str1:string,str2:string):number{
  const distance = leven(str1, str2);
  return 1 - distance/Math.max(str1.length,str2.length);
}