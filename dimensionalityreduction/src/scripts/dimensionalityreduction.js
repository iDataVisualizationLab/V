import {ProcrustesTransformation} from "./modules/Transformation";
import {projectionOptimizer} from "./modules/ProjectionOptimizer";

if (!window) {
    window = self;
}

(function (window) {
    const dr = {};
    dr.ProcrustestTransformation = ProcrustesTransformation;
    dr.projectionOptimizer = projectionOptimizer;
    //Expose
    window.dr = dr;
})(window);
