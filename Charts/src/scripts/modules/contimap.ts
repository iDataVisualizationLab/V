import * as d3 from 'd3';
import {Annotations, LineChartSettings, StepSettings, Title, XAxisLabel, YAxisLabel} from "./linechart";

export interface ContiMapTimeLineSettings {
    [key: string]: any;

}

export interface ContiMapSettings {
    [key: string]: any;
    colorSchemes: any,
    width: number,
    height: number,
    timeLineSettings: ContiMapTimeLineSettings,

}

export class ContiMap{
    private settings: LineChartSettings = {
        showTimeLine: true,
        showYAxis: true,
    };
    constructor(htmlContainer, contiMapData, ) {
    }
}