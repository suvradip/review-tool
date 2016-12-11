var paper,
    mat,
    set,
    box,
    line,
    temp,
    selections;

paper = Raphael(0, 0, '500', '500');
mat = paper.rect(0, 0, paper.width, paper.height).attr("fill", "#FFF");

selections = "path1";
function dragstart (x, y, event) {
    if(selections === "path"){     
        //for path draw
        temp = "M "+ x + " " + y ;
        line = paper.path(temp);
    } else {
        //for box draw
        box = paper.rect(x, y, 0, 0).attr("stroke", "#000");
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
        temp += "L "+ x + " " +y;
        line.attr("path", temp);  
    } else {   
        //for box operations
        box.transform("T" + xoffset + "," + yoffset);
        box.attr("width", dx);    
        box.attr("height", dy);  
    }
}

function dragend (event) {
    
}


mat.drag(dragmove, dragstart, dragend);


