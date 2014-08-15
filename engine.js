function Engine(canvas){
	this.FRAME_DELAY = 20;
	this.canvas = canvas.getContext('2d');
	this.objects = [];
	this.addObject = function(image, x,y,layer){
		var obj = new DrawObject(image,this.canvas,x,y);
		if(!(typeof  layer == 'number')) layer = 0;
		if(!this.objects[layer]) this.objects[layer] = [];
		this.objects[layer].push(obj);
		return obj;
	};
	this.addTextObject = function(text,x,y,layer){
		var obj = new TextObject(text,this.canvas,x,y);
		if(!(typeof  layer == 'number')) layer = 0;
		if(!this.objects[layer]) this.objects[layer] = [];
		this.objects[layer].push(obj);
		return obj;
	};
	this.addRectObject = function(fillStyle, x, y,widht,height, layer){
		var obj = new RectObject(fillStyle,this.canvas,x,y,widht,height);
		if(!(typeof  layer == 'number')) layer = 0;
		if(!this.objects[layer]) this.objects[layer] = [];
		this.objects[layer].push(obj);
		return obj;
	};
	this.events = [];
	this.addEvent = function(object, event, x, y, image){
		var ev = new ObjectEvent(object, event, x, y, image);
		this.events.push(ev);
		return ev;
	};
	this.background = null;
	this.setBackground = function(image){
		this.background = new Background(image,this.canvas);
	};
	this.draw = function(){
		this.drawBackground();
/*		for (var j in this.objects){ TODO: i think it's slower, than redrawing bg
			if(!this.objects.hasOwnProperty(j)) continue;
			for(var i = 0; i< this.objects[j].length; i++){
				*//*if(this.objects[i].moved || this.objects[i].removed)*//* //TODO: check performance without this
				this.background.drawRectangle(this.objects[j][i].prevRectangle);
			}
		}*/

		for(j in this.objects){
			if(!this.objects.hasOwnProperty(j)) continue;
			for(i = 0; i< this.objects[j].length; i++){
				if(this.objects[j][i].removed){
					//this.background.drawRectangle(this.objects[i].prevRectangle);
					this.objects[j].splice(i,1);
				} else {
					this.objects[j][i].draw();
				}
			}
		}

	};
	this.drawBackground = function(){
		this.background.draw();
	};


	this.timeout = null;

	this.step = function(){
		var that = this;
		this.draw();
		this.handleEvents();
		this.timeout = setTimeout(function(){that.step()},this.FRAME_DELAY);
	};

	this.handleEvents = function(){
		while(!this.events.length == 0){
			var event = this.events.pop();
			if(event.event == 'move'){
				event.object.move(event.x,event.y);
			} else if(event.event == 'moveTo'){
				event.object.moveTo(event.x,event.y);
			} else if(event.event == 'setImage'){
				event.object.setImage(event.image);
			} else if(event.event == 'remove'){
				event.object.remove();
			}
		}
	};

	this.start = function (){
		this.drawBackground();
		this.step();
	};

	this.stop = function(){
		clearTimeout(this.timeout);
	};
}

function Background(image,canvas){
	this.canvas = canvas;
	this.image = image;
	this.width = document.body.offsetWidth * window.devicePixelRatio;
	this.scaleFactor = this.width/ this.image.width;
	if(this.image.height * this.scaleFactor < document.body.offsetHeight * window.devicePixelRatio){
		this.scaleFactor = document.body.offsetHeight * window.devicePixelRatio / this.image.height;
	}
	this.draw = function(){
		this.canvas.drawImage(this.image,0,0,this.image.width * this.scaleFactor,this.image.height * this.scaleFactor);
	};
	this.drawRectangle= function(rectangle){
		if(!rectangle) return;
		this.canvas.drawImage(this.image,rectangle[0]/this.scaleFactor
			,rectangle[1]/this.scaleFactor,
			rectangle[2]/this.scaleFactor,
			rectangle[3]/this.scaleFactor,
			rectangle[0],rectangle[1],rectangle[2],rectangle[3]);
	};
}

function DrawObject(image, canvas, x,y){
	//this.moved = true;
	this.image = image;
	this.canvas = canvas;
	this.x = x;
	this.y = y;
	this.prevRectangle = null;
	this.removed = false;
	this.draw = function(){
		//if(!this.moved) return;  TODO: performance check
		this.canvas.drawImage(this.image,this.x,this.y,this.image.width,this.image.height);
		//this.prevRectangle = [this.x,this.y,this.image.width,this.image.height];
		//this.moved = false;
	};
	this.remove = function(){
		this.removed = true;
	};
	this.setImage = function(image){
		this.image = image;
		this.moved = true;
	};
	this.move = function(x,y){
		this.x+=x;
		this.y+=y;
		//this.moved = true;
	};
	this.moveTo = function(x,y){
		this.x=x;
		this.y=y;
		//this.moved = true;
	};
}

function RectObject(fillStyle, canvas, x,y,width,height){
	this.fillStyle = fillStyle;
	this.canvas = canvas;
	this.x = x;
	this.y = y;
	this.removed = false;
	this.draw = function(){
		this.canvas.fillStyle=this.fillStyle;
		this.canvas.fillRect(this.x,this.y,width,height);
	};
	this.remove = function(){
		this.removed = true;
	};
	this.setStyle = function(fillStyle){
		this.fillStyle = fillStyle;
		this.moved = true;
	};
	this.move = function(x,y){
		this.x+=x;
		this.y+=y;
		//this.moved = true;
	};
	this.moveTo = function(x,y){
		this.x=x;
		this.y=y;
		//this.moved = true;
	};
}


function TextObject(text, canvas,x,y){
	this.fontOptions = {fillStyle:"#cca747", font:"bold 65px sans-serif"};
	this.text = text;
	this.canvas = canvas;
	this.x = x;
	this.y = y;
	this.setText = function(text){
		this.text = text;
		//this.moved = true;
		this.measureText();
	};
	this.setCanvasOptions = function(){
		this.canvas.fillStyle = this.fontOptions.fillStyle;
		this.canvas.font = this.fontOptions.font;
	};
	this.measureText = function(){
		this.width = this.canvas.measureText(this.text);
		if(this.width.width) this.width = this.width.width;
		this.height = parseInt(this.fontOptions.font.match(/(\d+)px/)[1]);
	};
	this.setFontOptions = function(fillStyle,font){
		this.fontOptions.fillStyle = fillStyle;
		this.fontOptions.font = font;
		this.setCanvasOptions();
		this.measureText();
	};

	this.setCanvasOptions();
	this.measureText();
}
TextObject.prototype = new DrawObject();
TextObject.prototype.draw = function(){
	this.setCanvasOptions();
	this.canvas.fillText(this.text,this.x,this.y);
	this.prevRectangle = [this.x,this.y,this.width,this.height];
	//this.moved = false;
};


//var EVENT_TYPES = ['move','moveTo','setImage','remove'];
function ObjectEvent(object, event, x, y, image){
	this.object = object;
	this.event = event;
	this.x = x;
	this.y = y;
	this.image = image;
}