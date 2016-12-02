var paper = Raphael(0, 0, '500', '500');

//make an object in the background on which to attach drag events
var mat = paper.rect(0, 0, paper.width, paper.height).attr("fill", "#FFF");

var circle = paper.circle(75, 75, 50);
var rect = paper.rect(150, 150, 50, 50);
var set = paper.set();

set.push(circle, rect);
set.attr({
    fill: 'red',
    stroke: 0
});

var box;
//set that will receive the selected items
var selections = paper.set();

var test = paper.set();

//DRAG FUNCTIONS
//when mouse goes down over background, start drawing selection box
function dragstart (x, y, event) {
    box = paper.rect(x, y, 0, 0).attr("stroke", "#000");    
}

//when mouse moves during drag, adjust box. If to left or above original point, you have to translate the whole box and invert the dx or dy values since .rect() doesn't take negative width or height
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
    box.transform("T" + xoffset + "," + yoffset);
    box.attr("width", dx);    
    box.attr("height", dy);    
}

function dragend (event) {
    //get the bounds of the selections
    var bounds = box.getBBox();
    test.push(box);
    console.log(test);
    //box.remove();
    reset();
    console.log(bounds);
    for (var c in set.items) {
        //here, we want to get the x,y vales of each object regardless of what sort of shape it is, but rect uses rx and ry, circle uses cx and cy, etc
        //so we'll see if the bounding boxes intercept instead
        var mybounds = set[c].getBBox();
        //do bounding boxes overlap?
        //is one of this object's x extremes between the selection's xextremes?
        if (mybounds.x >= bounds.x && mybounds.x <= bounds.x2 || mybounds.x2 >= bounds.x && mybounds.x2 <= bounds.x2) {
        //same for y
            if (mybounds.y >= bounds.y && mybounds.y <= bounds.y2 || mybounds.y2 >= bounds.y && mybounds.y2 <= bounds.y2) {
                selections.push(set[c]);       
            }
        }
        selections.attr("opacity", 0.5);
    }
}

function reset () {
    //empty selections and reset opacity;
    selections = paper.set();
    set.attr("opacity", 1);    
}

mat.drag(dragmove, dragstart, dragend);
mat.click(function(e) {
   reset(); 
});

