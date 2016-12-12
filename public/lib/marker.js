(function(){
    var paper,
    mat,
    set = [],
    box,
    line,
    temp,
    selections,
    fc;

function create(){
    fc = FusionCharts('chartobject-1');
    paper = fc.jsVars.instanceAPI.components.paper;
    mat = paper.rect(0, 0, paper.width, paper.height).attr({ fill: "#c7c7c7", opacity:".2"});
    set.push(mat);
    mat.drag(dragmove, dragstart, dragend);
}

function deleteMarker(){
    for(var k in set)
        set[k].remove();
}

// fc = FusionCharts('chartobject-1');
// paper = fc.jsVars.instanceAPI.components.paper;

// //paper = Raphael(document.getElementsByTagName('svg'));
// mat = paper.rect(0, 0, paper.width, paper.height).attr({ fill: "#ffffff", opacity:0, id:"custome-ele"});

selections = "path1";
function dragstart (x, y, event) {
    if(selections === "path"){     
        //for path draw
        temp = "M "+ event.layerX + " " + event.layerY ;
        line = paper.path(temp);
    } else {
        //for box draw
        box = paper.rect(event.layerX, event.layerY, 0, 0).attr("stroke", "#000");
    }
}

/*when mouse moves during drag, adjust box. If to left or above original point, 
you have to translate the whole box and invert the dx or dy values since .rect() doesn't 
take negative width or height*/
function dragmove (dx, dy, x, y, event) {
    var xoffset = 0,
        yoffset = 0;
    if (dx < 0) {
        xoffset = dx;
        dx = -1 * dx;
    }
    if (dy < 0) {
        yoffset = dy;
        dy = -1 * dy;
    }
    if(selections === "path"){ 
        //for path operations
        temp += "L "+ event.layerX + " " + event.layerY;
        line.attr("path", temp);  
    } else {   
        //for box operations
        box.transform("T" + xoffset + "," + yoffset);
        box.attr("width", dx);    
        box.attr("height", dy);  
    }
}

function dragend (event) {
  set.push(box);  
}


//mat.drag(dragmove, dragstart, dragend);

window.marking = {
    createMarker : create,
    deletMarker : deleteMarker
};

})();

