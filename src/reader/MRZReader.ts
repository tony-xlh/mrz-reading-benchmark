import DynamsoftMRZReader from "./DynamosftMRZReader";
import { DCEFrame } from "dynamsoft-camera-enhancer";

export class MRZReader {
  private engine = "Dynamsoft";
  private reader!: DynamsoftMRZReader;
  static async createInstance(engine:string):Promise<MRZReader> {
    const reader = new MRZReader();
    reader.setEngine(engine);
    await reader.init()
    return reader;
  }

  setEngine(name:string) {
    this.engine = name;
  }

  getEngine():string {
    return this.engine;
  }

  async init(): Promise<void> {
    if (this.engine === "Dynamsoft") {
      this.reader = new DynamsoftMRZReader();
    }
    await this.reader.init();
  }

  detect(image:ImageBitmapSource|string|HTMLImageElement|HTMLVideoElement|DCEFrame): Promise<DetectionResult> {
    return this.reader.detect(image);
  }

  static getEngines():string[] {
    return ["Dynamsoft"];
  }

  static getSupportedSettings(engine:string):SettingDef[] {
    return DynamsoftMRZReader.getSupportedSettings();
  }

  static getDefaultSettings(engine:string):any {
    return DynamsoftMRZReader.getDefaultSettings();
  }

  static async getSettingOptions(engine:string,key:string,settings:Setting[]):Promise<string[]> {
    return DynamsoftMRZReader.getSettingOptions(key,settings);
  }

  async setSupportedSettings(settings:Setting[]):Promise<void> {
    return this.reader.setSettings(settings);
  }
}

export interface DetectionResult {
  elapsedTime:number;
  results:OCRResult[];
}

export interface OCRResult {
  text:string;
  confidence?: number;
  x1:number;
  x2:number;
  x3:number;
  x4:number;
  y1:number;
  y2:number;
  y3:number;
  y4:number;
}

export interface ReaderConfig {
  engine:string;
  displayName:string;
  color?:string;
  settings:Setting[];
}

export interface Setting {
  name:string;
  value:string;
  type?:"string"|"select";
}

export interface SettingDef {
  name: string;
  type:"string"|"select";
}
