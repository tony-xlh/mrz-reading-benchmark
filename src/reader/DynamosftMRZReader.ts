import { DLRLineResult, DLRResult, LabelRecognizer } from "dynamsoft-label-recognizer";
import { OCRResult, DetectionResult, Setting, SettingDef } from "./MRZReader";
import { DCEFrame } from "dynamsoft-camera-enhancer";

const defaultDLRengineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-label-recognizer@2.2.31/dist/";

let reader:LabelRecognizer;
export default class DynamsoftMRZReader {
  private settings:Setting[] = [];
  async init() : Promise<void> {
    if (!reader) {
      LabelRecognizer.engineResourcePath = defaultDLRengineResourcePath;
      reader = await LabelRecognizer.createInstance();
      reader.updateRuntimeSettingsFromString("MRZ");
    }
  }

  async detect(image: ImageBitmapSource|string|HTMLImageElement|HTMLVideoElement|DCEFrame) : Promise<DetectionResult> {
    if (!reader) {
      throw new Error("Dynamsoft Barcode Reader has not been initialized.");
    }
    const startTime = Date.now();
    const results = await reader.recognize(image as any);
    console.log(results);
    const elapsedTime = Date.now() - startTime;
    const ocrResults:OCRResult[] = [];
    results.forEach(result => {
        result.lineResults.forEach(lineResult=>{
            const ocrResult:OCRResult = this.wrapResult(lineResult);
            ocrResults.push(ocrResult);
        })
    });
    const decodingResult:DetectionResult = {
      elapsedTime:elapsedTime,
      results:ocrResults
    };
    return decodingResult;
  }

  wrapResult(result:DLRLineResult):OCRResult{
    return { 
      text:result.text,
      confidence: result.confidence,
      x1: result.location.points[0].x,
      x2: result.location.points[1].x,
      x3: result.location.points[2].x,
      x4: result.location.points[3].x,
      y1: result.location.points[0].y,
      y2: result.location.points[1].y,
      y3: result.location.points[2].y,
      y4: result.location.points[3].y
    };
  }


  async updateRuntimeSettings(template:string){
    if (template) {
      if (template.indexOf("{") != -1) { //json template
        console.log("Using JSON template: "+template);
        await reader.updateRuntimeSettingsFromString(template);
      }else{ //built-in template names
        console.log("Using built-in template: "+template);
        await reader.updateRuntimeSettingsFromString(template);
      }
    }else{
      await reader.resetRuntimeSettings();
    }
  }

  static getSupportedSettings():SettingDef[] {
    return [{name:"template",type:"string"}];
  }

  static getDefaultSettings():any {
    return {};
  }

  static getSettingOptions(key:string,settings:Setting[]):string[] {
    return [];
  }

  async setSettings(settings:Setting[]):Promise<void> {
    this.settings = settings;
    for (let index = 0; index < settings.length; index++) {
      const setting = settings[index];
      if (setting.name === "template") {
        await this.updateRuntimeSettings(setting.value);
      }
    }
  }
}