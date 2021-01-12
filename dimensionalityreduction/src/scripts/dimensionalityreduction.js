import {ProcrustesTransformation} from "./modules/Transformation";

if (!window) {
    window = self;
}

(function (window) {
    const dr = {};
    dr.ProcrustestTransformation = ProcrustesTransformation;
    //Expose
    window.dr = dr;

})(window);
