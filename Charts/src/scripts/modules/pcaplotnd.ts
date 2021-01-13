import * as d3 from "d3";
import {PCA} from "ml-pca";
import {Biplot, BiplotSettings} from "./biplot";

export class PCAPlotND extends Biplot {
    constructor(htmlContainer, biplotData: number[][], biplotSettings: BiplotSettings) {
        super(htmlContainer, biplotData, biplotSettings);
    }

    public async plotScatter() {
    }
}