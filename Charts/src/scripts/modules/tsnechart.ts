import * as d3 from "d3";
import {Title, BiplotSettings} from "./biplot";
export interface TSNEChartSettings extends BiplotSettings{

}
// let w;
// function startWorker(fileName, data, onResult){
//     if(typeof(Worker)!== "undefined"){
//         if(w===undefined){
//             w = new Worker(fileName);
//             w.postMessage(data);
//         }
//         w.onmessage = function (event){
//             onResult(event.data);
//         };
//     }
//     else{
//         throw "Browser doesn't support web worker";
//     }
// }
export class TSNEChart{
    private settings: TSNEChartSettings = {
        showAxes: false,
        paddingLeft: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingRight: 0,
        contentPaddingLeft: 0,
        contentPaddingTop: 0,
        contentPaddingBottom: 0,
        contentPaddingRight: 0,
    }
    private data;
    private contentWidth: number;
    private contentHeight: number;
    constructor(htmlContainer, tsneData: number[][], tsneChartSettings: TSNEChartSettings){
        // let thisObject
    }
}