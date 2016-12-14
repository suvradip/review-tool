(function(){
    var paper,
    mat,
    set = [],
    temp,
    selections,
    rectColor,
    element,
    fc;

    selections = "rect";

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

    function deleteBG(){
        mat.remove();
    }

    function setConfig(obj){
        rectColor = obj.color;
        selections = obj.ele;
        text = obj.text;
    }


    //selections = "rect";
    function dragstart (x, y, event) {
        if(selections === "path"){     
            //for path draw
            temp = "M "+ event.layerX + " " + event.layerY ;
            element = paper.path(temp).attr({stroke: rectColor || "#000"});
        } else if(selections === "rect") {
            //for box draw
            element = paper.rect(event.layerX, event.layerY, 0, 0).attr("stroke", rectColor || "#000");
        } else if(selections === "text"){
            element = paper.text(event.layerX, event.layerY, text).attr({fill: rectColor || "#000", "font-size": '15'});
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
            element.attr("path", temp);  
        } else if(selections === "rect") {   
            //for box operations
            element.transform("T" + xoffset + "," + yoffset);
            element.attr("width", dx);    
            element.attr("height", dy);  
        } else if(selections === "text") {
            element.attr({x: event.layerX, y: event.layerY});
        }
    }

    function dragend (event) {
      set.push(element);  
    }


    //mat.drag(dragmove, dragstart, dragend);

    window.marking = {
        createMarker : create,
        deleteBG : deleteBG,
        deletMarkers : deleteMarker,
        setConfig: setConfig
    };

})();

