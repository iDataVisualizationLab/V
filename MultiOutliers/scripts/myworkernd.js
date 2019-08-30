importScripts('outliagnosticsnd.min.js');
onmessage = function(e){
    let outliag = null;
    if(getUniqueSize(e.data.data)>3){
        const ops = e.data.options;
        debugger
        outliag = outliagnosticsnd(e.data.data, ops);
    }
    const result = {};
    result.outliag = outliag;
    result.year = e.data.year;
    result.country = e.data.country;
    postMessage(result);

};
function getUniqueSize(data) {
    const setdata = new Set(data.map(v => v.join(',')));
    return setdata.size;
}
