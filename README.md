# mrz-reading-benchmark

An MRZ reading benchmark tool in Quasar. It can create MRZ reading benchmark projects which save the test results and images in indexedDB. The benchmark can run purely in the browser.

Currently, only [Dynamsoft Label Recognizer](https://www.dynamsoft.com/label-recognition/overview/) is included.

## Features

* Run batch MRZ reading on an image dataset
* Calculate metrics like reading rate of files, correct characters rate (score) and average time
* Highlight misread characters
* Compare the performance of different MRZ reading libraries
* Compare the performance in categories
* Export and import of benchmark projects
## Dive into Formats

* MRZ Detection Result
   
   ```ts
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
   ```
   
   MRZ detection result is saved in the above format in JSON with the `.json` extension.

* Ground Truth

   Plain text:

   ```
   P<BELBISONETTE<<ELENA<<<<<<<<<<<<<<<<<<<<<<<
   RDDFJ0N3G9BEL9808221F2301284<<<<<<<<<<<<<<06
   ```
   
   Ground truth is saved with the `.txt` extension.

* Remote Projects

   Put the files like the following example to the dataset folder as remote projects. Users can download them to check them out locally. The files can be retrieved using the export feature.

   ```
   │  projects.json
   │
   │─ Project
           detection_result_filenames.json
           project_manifest.json
           results.zip
           MRZ1.jpg
           MRZ2.jpg
   ```

## How to run the app

### Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
