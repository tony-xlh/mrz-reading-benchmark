import { MRZReader, ReaderConfig, OCRResult, DetectionResult } from "./reader/MRZReader";
import { DetectionStatistics, EngineDataTableRow, GroundTruth, PerformanceMetrics, Point, EngineStatistics, Rect } from "./definitions/definitions";
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

export function ConvertOCRResultsToGroundTruth(OCRResults:OCRResult[]):GroundTruth[] {
  const listOfGroundTruth:GroundTruth[] = [];
  for (let index = 0; index < OCRResults.length; index++) {
    const result = OCRResults[index];
    listOfGroundTruth.push(ConvertOCRResultToGroundTruth(result));
  }
  return listOfGroundTruth;
}

export function ConvertOCRResultToGroundTruth(result:OCRResult):GroundTruth {
  const groundTruth:GroundTruth = {
    text: result.text,
    attrib:{Type:"text"},
    value_attrib:{},
    x1:result.x1,
    x2:result.x2,
    x3:result.x3,
    x4:result.x4,
    y1:result.y1,
    y2:result.y2,
    y3:result.y3,
    y4:result.y4
  }
  return groundTruth;
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
