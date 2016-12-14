function Marker(options){
	var option = options || {},
		fc;

	this.selection = "rect";
	this.element = option.element;
	this.color = option.color || "#000";

	fc = FusionCharts('chartobject-1');
    this.paper = fc.jsVars.instanceAPI.components.paper;
    this.mat = this.paper.rect(0, 0, this.paper.width, this.paper.height).attr({ fill: "#c7c7c7", opacity:".2"});

    this.mat.drag(this.dragMove.bind(this), this.dragStart.bind(this), this.dragEnd.bind(this));
}

Marker.prototype.dragStart = function(x, y, start){
		var temp;
		if(this.selection === "path"){     
            //for path draw
            temp = "M "+ event.layerX + " " + event.layerY ;
            this.element = this.paper.path(temp).attr({stroke: this.color});
        } else if(this.selection === "rect") {
            //for box draw
            this.element = this.paper.rect(event.layerX, event.layerY, 0, 0).attr({'stroke-width': "2px", stroke: this.color});
                
        } else if(this.selection === "text"){
            this.element = this.paper.text(event.layerX, event.layerY, text).attr({fill: this.color, "font-size": '15'});
        }
};


Marker.prototype.dragMove = function(dx, dy, x, y, event){
        if(this.selection === "path"){ 
            //for path operations
            var tempPath;
            tempPath = this.element.attr("path");
            tempPath += "L "+ event.layerX + " " + event.layerY;
            this.element.attr("path", tempPath);  
        
        } else if(this.selection === "rect") {   
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
            //for box operations
            if(this.paper){
                this.element.transform("T" + xoffset + "," + yoffset);
                this.element.attr({ width: dx, height: dy });    
            } else {
                this.element.attr({ x: event.layerX, y:event.layerY });    
            }
        
        } else if(this.selection === "text") {
            this.element.attr({x: event.layerX, y: event.layerY});
        }
};


Marker.prototype.dragEnd = function(event){
    this.element.drag(this.dragMove.bind({element: this.element, selection: this.selection}), null, null);
};

setTimeout(function(){
	var a = new Marker();
}, 1500);