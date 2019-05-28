function setTransition(selections, transFunc) {
    selections.each(function(){
        let elm = d3.select(this)
        if (d3.active(this)) {
            d3.active(this).transition().on("end", () => {
                elm.call(transFunc);
            });
        } else {
            elm.call(transFunc);
        }
    });
}