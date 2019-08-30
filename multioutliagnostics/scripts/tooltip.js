/* 2016 
 * Tuan Dang (on the BioLinker project, as Postdoc for EVL, UIC)
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */

var tipWidth = 270;
var tipHeight = 470;
var tip_svg;
var y_svg;

var colorHighlight = "#fc8";
var buttonColor = "#ddd";
var timeDelay = 150;


var tip = d3.tip()
  .attr('class', 'd3-tip')
  .style('border', '1px solid #000');


function brushingDataPoints(d,brushingIndex) { 
  updateElements(brushingIndex);
  showPopup(d,brushingIndex);

}

function brushingStreamText(brushingIndex) { 
  updateElements(brushingIndex);
}    


// brushingIndex is the index of country in the Country list
function updateElements(brushingIndex) { 
  // Update network
  for (var i=0; i<allSVG.length;i++){
      var svg2 = allSVG[i];
      for (var c=0; c<dataS.Countries.length;c++){
        if (c==brushingIndex){
          svg2.selectAll(".dataPoint"+c)
            .style("fill-opacity", function(d2){ return 1; });
           // .style("stroke-opacity", function(d2){ return 1; }); 
        }
        else{
          svg2.selectAll(".dataPoint"+c)
            .style("fill-opacity", function(d2){ return 0; })
           // .style("stroke-opacity", function(d2){ return 0.1; }); 
        }
      }  
      //svg.selectAll(".textCloud3") 
      //  .style("fill-opacity", function(d2){ return (dataS.Countries[brushingIndex] == d2[0].country) ? 1 : 0.1; });  
      svg.selectAll(".layerAbove")
        .style("fill-opacity", function(d2){ return (dataS.Countries[brushingIndex] == d2[0].country) ? 1 : 0.1; })
        .style("stroke-opacity", function(d2){ return (dataS.Countries[brushingIndex] == d2[0].country) ? 1 : 0; });  
      svg.selectAll(".layerBelow")
        .style("fill-opacity", function(d2){ return (dataS.Countries[brushingIndex] == d2[0].country) ? 1 : 0.1; })
        .style("stroke-opacity", function(d2){ return (dataS.Countries[brushingIndex] == d2[0].country) ? 1 : 0; });  
       
      svg.selectAll(".countryText")  
        .style("fill-opacity", function(d2){ return (dataS.Countries[brushingIndex]==d2[0].country) ? 1 : 0.25; });
      svg.selectAll(".textCloud3")  
        .style("fill-opacity", function(d2){ return (dataS.Countries[brushingIndex]==d2[0].country) ? 1 : 0.1; });    
      
      svg.selectAll(".maxAboveText")
         .style("fill-opacity", function(d2){ return (dataS.Countries[brushingIndex]==d2[0].country) ? 1 : 0.1; });  
      svg.selectAll(".maxBelowText")
         .style("fill-opacity", function(d2){ return (dataS.Countries[brushingIndex]==d2[0].country) ? 1 : 0.1; });
  }
}

function showPopup(d,brushingIndex) { 
  // Add time series of frequeny{}
  tip.html(function(d) {
    var str ="";
    str+="<b> Country info: </b>"
    str+="<table border='1px'  style='width:100%'>"
    str+=  "<tr><td>Country</td> <td align='right'>  <span style='color:black'>" +d.country+ "</span> </td></tr>";
    str+=  "<tr><td>Selected Year</td> <td align='right'>  <span style='color:black'>" +(minYear+d.year)+ "</span> </td></tr>";
    for (var v=0; v<dataS.Variables.length;v++){
      str+=  "<tr><td>"+dataS.Variables[v]+"</td> <td align='right'>  <span style='color:black'>" +d["v"+v]+ "</span> </td></tr>";
    }
    str+="</table> <br>"


    str+="<b> Scaterplot info: </b>";
    str+="<table border='0.5px'  style='width:100%'>";
    // **************************** Heading ****************************
    str+=  "<tr><td style='background-color:rgb(180,180,180);'>Scagnostics</td> <td align='center' style='background-color:rgb(180,180,180);'>Original Scaterplot</td> <td align='center' style='background-color:rgb(180,180,180);'>Leave '"+d.country+"' out</td> </tr>";
    
    for (var v=0; v<dataS.Variables.length;v++){
      if (v%2==1){
        var pair = Math.floor(v/2);
        for (var s=0; s<dataS.Scagnostics.length;s++){
          if (s==selectedScag)
            str+=  "<tr><td><b>"+dataS.Scagnostics[s]
               +"</b></td> <td align='center' style=\"background-color:"+hexToRgbA(colorRedBlue(d["Scagnostics"+pair][s]))+"\">  <span style='color:black; text-shadow: 0px 1px 1px #fff;'><b>" 
               +d["Scagnostics"+pair][s]+ "</b></span> </td> <td align='center' style=\"background-color:"+hexToRgbA(colorRedBlue(d["ScagnosticsLeave1out"+pair][s]))+"\">  <span style='color:black; text-shadow: 0px 1px 1px #fff;'><b>" 
               +d["ScagnosticsLeave1out"+pair][s]+ "</b></span> </td></tr>";
          else  
            str+=  "<tr><td>"+dataS.Scagnostics[s]
                +"</td> <td align='center' style=\"background-color:"+hexToRgbA(colorRedBlue(d["Scagnostics"+pair][s]))+"\">  <span style='color:black; text-shadow: 0px 1px 1px #fff;'>" 
                +d["Scagnostics"+pair][s]+ "</span> </td><td align='center' style=\"background-color:"+hexToRgbA(colorRedBlue(d["ScagnosticsLeave1out"+pair][s]))+"\">  <span style='color:black; text-shadow: 0px 1px 1px #fff;'>" 
                +d["ScagnosticsLeave1out"+pair][s]+ "</span> </td></tr>";
        }         
      }
    } 
    str+="</table>"
    return str;
      
   });   
  tip.direction('se');
  //tip.direction('n') 

  tip.offset([-d3.event.pageY+380,-d3.event.pageX]) // d3.event.pageX is the mouse position in the main windown
      
  tip.show(d);   
}    

function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
    }
    throw new Error('Bad Hex');
}

function hideTip(d) { 
  // Update network
  for (var i=0; i<allSVG.length;i++){
    var svg2 = allSVG[i];
    for (var c=0; c<dataS.Countries.length;c++){
       svg2.selectAll(".dataPoint"+c)
          .style("fill-opacity", pointOpacity)
          .style("stroke-opacity", 1); 
     }     
  }
  svg.selectAll(".layerAbove")  
        .style("fill-opacity", 1)
        .style("stroke-opacity", 0.5);  
  svg.selectAll(".layerBelow")  
        .style("fill-opacity", 1)
        .style("stroke-opacity", 0.5);  
  
  svg.selectAll(".textCloud3")  
        .style("fill-opacity", 1);    
  svg.selectAll(".countryText")  
        .style("fill-opacity", 1);       
  
  svg.selectAll(".maxAboveText")  
        .style("fill-opacity", 1);    
  svg.selectAll(".maxBelowText")  
        .style("fill-opacity", 1);       
  
  tip.hide();
}