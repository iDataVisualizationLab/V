import {ProcrustesTransformation} from "./modules/Transformation";
import {projectionOptimizer, projectionOptimizerSGD} from "./modules/ProjectionOptimizer";
import {incremental_mean_and_var} from './modules/IncrementalPCA';
import {pcaUncertainty, optimizerUncertainty, uncertainty} from "./modules/Uncertainty";
import {PCA} from 'ml-pca';
import {projectToPCs, invertToOriginalSpace} from "./modules/pca";

if (!window) {
    window = self;
}

(function (window) {
    const dr = {};
    dr.ProcrustestTransformation = ProcrustesTransformation;
    dr.projectionOptimizer = projectionOptimizer;
    dr.projectionOptimizerSGD = projectionOptimizerSGD;
    dr.incremental_mean_and_var = incremental_mean_and_var;
    dr.PCA = PCA;
    dr.invertToOriginalSpace = invertToOriginalSpace;
    dr.projectToPCs = projectToPCs;
    dr.pcaUncertainty = pcaUncertainty;
    dr.optimizerUncertainty = optimizerUncertainty;
    dr.uncertainty = uncertainty;

    //Expose
    window.dr = dr;
})(window);
