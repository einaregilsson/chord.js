

function Chord(canvas, name, positions, fingering) {
	this.init(canvas, name, positions, fingering);
}

//Defaults

Chord.defaultSize = 3;
Chord.defaultRenderer = 'canvas'; 
Chord.serverSideRenderUrl = 'http://chords.apphb.com/{name}.{format}?p={positions}&s={size}&f={fingers}';
Chord.serverSideRenderFormat = 'png';
Chord.renderOnLoad = true;
Chord.renderPreference = ['canvas', 'svg', 'vml', 'url'];
var MUTED = -1;


//Matches a named chord with optional fingerings
//              |Small      |Large chord with seperators            |        |Optional|
//              |Chord      |dashes, dots or spaces                 |        |Fingerings
Chord.regex = /([0-9xX]{4,6}|(?:x|X|\d\d?)(?:[-\. ](?:x|\d\d?)){3,5})\b(?:\s*\[([T\d]+)\])?(?:\s+(\d+))?(?:\s+(.*)\b)?/g;

Chord.prototype = {
	init : function(name, positions, fingers) {
		this.parse(positions, fingers);
		this.name = name;
		this.rawPositions = positions;
		this.rawFingers = fingers || '';
	},
	
	parse : function(frets, fingers) {
		this.positions = [];
		var raw = [];
		if (frets.match(/^[0-9xX]{1,6}$/)) {
			for (var i = 0; i < frets.length;i++) {
				raw.push(frets.charAt(i));
			}
		} else {
			raw = frets.split(/[^\dxX]/);
		}
		this.stringCount = raw.length;
		if (this.stringCount == 4) {
			this.fretCount = 4;
		} else {
			this.fretCount = 5;
		}
		var maxFret = 0;
		var minFret = 1000;
				
		for (var i in raw) {
			var c = raw[i];
			if (c.toLowerCase() == 'x') {
				this.positions.push(MUTED);
			} else {
				var fret = parseInt(c);
				if (fret > 0 && fret < minFret) {
					minFret = fret;
				}
				maxFret = Math.max(maxFret, fret);
				this.positions.push(fret);
			}
		}
		if (maxFret <=this.fretCount) {
			this.startFret = 1;
		} else {
			this.startFret = minFret;
		}
		this.fingerings = [];
		if (!fingers) {
			return;
		}
		var j = 0;
		for (var i = 0; i < fingers.length; i++) {
			for (;j<this.positions.length;j++) {
				if (this.positions[j] <= 0) {
					this.fingerings.push(null);
				} else {
					this.fingerings.push(fingers[i]);
					j++;
					break;
				}
			}
		}
	},
	
	drawMutedAndOpenStrings : function(info) {
		var r = this.renderer;
		for (var i in this.positions) {
			var pos = this.positions[i];
			var x = info.boxStartX+i*info.cellWidth;
			var y = info.nameFontSize + info.nameFontPaddingBottom + info.dotRadius-2;
			if (this.startFret > 1) {
				y+=info.nutSize;
			}
			if (pos == MUTED) {
				this.drawCross(info,x,y,info.muteStringRadius);
			} else if (pos == 0) {
				r.circle(x,y,info.openStringRadius,false);
			}
		}
	},
	
	drawPositions : function(info) {
		var r = this.renderer;
		for (var i in this.positions) {
			var pos = this.positions[i];
			if (pos > 0) {
				var relativePos = pos - this.startFret+1;
				var x = info.boxStartX+i*info.cellWidth;
				if (relativePos <= 5) {
					var y = info.boxStartY+relativePos*info.cellHeight-(info.cellHeight/2)
					r.circle(x,y,info.dotRadius,true);
				}
			}
		}
	},
	
	toString : function() {
		return 'Chord';
	},
	
	drawFretGrid : function(info) {
		var r = this.renderer;
		var width = (this.stringCount-1)*info.cellWidth;
		for (var i = 0; i <= this.stringCount-1; i++) {
			var x = info.boxStartX+i*info.cellWidth;
			r.line(x,info.boxStartY,x,info.boxStartY+this.fretCount*info.cellHeight, info.lineWidth, 'square');
		}
		
		for (var i = 0; i <= this.fretCount; i++) {
			var y = info.boxStartY+i*info.cellHeight;
			r.line(info.boxStartX,y,info.boxStartX+width,y, info.lineWidth, 'square');
		}
	},
	
	drawNut : function(info) {
		var r = this.renderer;
		if (this.startFret == 1) {
			r.rect(info.boxStartX, info.boxStartY-info.nutSize,info.boxWidth,info.nutSize);
		} else {
			r.text(info.boxStartX-info.dotRadius, info.boxStartY + info.cellHeight / 2.0, this.startFret+'', info.font, info.fretFontSize, 'middle', 'right');
		}
	},
	
	drawName : function(info) {
		var r = this.renderer;
		r.text(info.width/2.0, 0, this.name, info.font, info.nameFontSize, 'top', 'center');
	},
	
	//It's better to specify this explicitly. Trying to scale in a nice way to doesn't works so well.
	sizes : {
		cellWidth 				: [ 4,  6,  8, 10, 12, 14, 16, 18, 20, 22], 
		nutSize 				: [ 2,  3,  4,  5,  6,  7,  ,  9,], 
		lineWidth 				: [ 1,  1,  1,  1,  1,  2], 
		dotRadius 				: [ 2,  3,  4,  5,  6,  6], 
		openStringRadius		: [ 1,  2,  3,  4,  5,  5], 
		muteStringRadius 		: [ 2,  3,  4,  5,  6,  7], 
		nameFontSize			: [12, 16, 20, 24, 28, 32], 
		nameFontPaddingBottom 	: [ 4,  4,  5,  4,  4,  4], 
		fingerFontSize 			: [ 7,  8,  9, 11, 13, 13],
		fretFontSize			: [ 6,  8, 10, 12, 14, 14]
		
	},
	
	calculateDimensions : function(scale) {
		var info = {};
		scale--;
		for (var name in this.sizes) {
			info[name] = this.sizes[name][scale];
		}

		info.scale = scale;
		info.positions = this.rawPositions;
		info.fingers = this.rawFingers;
		info.name = this.name;
		//info.cellWidth = scale + 3;
		info.cellHeight = info.cellWidth;
		//info.nutSize = Math.round(info.cellHeight * 0.4);
		//info.lineWidth = Math.max(1.0,Math.floor(info.cellHeight/6.0));
		//info.dotRadius = info.cellWidth/2-3;
		info.dotWidth = 2*info.dotRadius;
		info.font = 'Arial';
		//info.nameFontSize = Math.round(1.8*info.cellHeight);
		//info.nameFontPaddingBottom = 4;
		//info.fingerFontSize = Math.round(info.cellHeight*1.2);

		info.boxWidth = (this.stringCount-1)*info.cellWidth;
		info.boxHeight = (this.fretCount)*info.cellHeight;
		info.width = info.boxWidth + 4*info.cellWidth;
		info.height = info.nameFontSize + info.nameFontPaddingBottom + info.dotWidth + info.nutSize + info.boxHeight + info.fingerFontSize + 2;
		info.boxStartX = Math.round(((info.width-info.boxWidth)/2));
		info.boxStartY = Math.round(info.nameFontSize + info.nameFontPaddingBottom + info.nutSize + info.dotWidth);	
		return info;
	},
	
	draw : function(scale) {
		var info = this.calculateDimensions(scale);
		this.renderer.init(info);
		this.drawFretGrid(info);
		this.drawNut(info);
		this.drawName(info);
		this.drawMutedAndOpenStrings(info);
		this.drawPositions(info);
		this.drawFingerings(info);
		this.drawBars(info);
	},
	
	getDiagram : function(scale, renderer) {
		this.renderer = new Chord.renderers[renderer || 'canvas']();
		this.draw(scale);
		return this.renderer.diagram();
	},
	
	drawBars : function(info) {
		var r = this.renderer;
		if (this.fingerings.length>0) {
			var bars = {};
			for (var i = 0; i < this.positions.length; i++) {
				var fret = this.positions[i];
				if (fret > 0) {
					if (bars[fret]&& bars[fret].finger == this.fingerings[i]) {
						bars[fret].length = i - bars[fret].index;
					} else {
						bars[fret] = { finger:this.fingerings[i], length:0, index:i};
					}
				}
			}
			for (var fret in bars) {
				if (bars[fret].length > 0) {
					var xStart = info.boxStartX+bars[fret].index * info.cellWidth;
					var xEnd = xStart+bars[fret].length*info.cellWidth;
					var relativePos = fret - this.startFret+1;
					var y = info.boxStartY+relativePos*info.cellHeight-(info.cellHeight/2);
					r.line(xStart,y,xEnd,y, info.dotRadius, 'square');
				}
			}

			//Explicit, calculate from that
		} else {
			//Try to guesstimate whether there is a bar or not				
			var barFret = this.positions[this.positions.length-1];
			if (barFret <= 0) {
				return;
			}
			if (this.positions.join('') == '-1-10232') { //Special case for the D chord...
				return;
			}
			var startIndex = -1;

			for (var i = 0; i < this.positions.length-2;i++) {
				var fret = this.positions[i];
				if (fret > 0 && fret < barFret) {
					return;
				} else if (fret == barFret && startIndex == -1) {
					startIndex = i;
				} else if (startIndex != -1 && fret < barFret) {
					return;
				}
			}
			if (startIndex >= 0) {
				var xStart = info.boxStartX+startIndex * info.cellWidth;
				var xEnd = (this.positions.length-1)*info.cellWidth;
				var relativePos = barFret - this.startFret+1;
				var y = info.boxStartY+relativePos*info.cellHeight-(info.cellHeight/2);
				r.line(xStart,y,xEnd,y, info.dotRadius, 'square');
			}
		}
	},
	
	drawCross : function(info, x, y, radius) {
		var r = this.renderer;
		var angle = Math.PI/4
		var lineWidth = info.lineWidth*1.05;
		for (var i = 0; i < 2; i++) {
			var startAngle = angle + i*Math.PI/2;
			var endAngle = startAngle + Math.PI;

			var startX = x + radius * Math.cos(startAngle);
			var startY = y + radius * Math.sin(startAngle);
			var endX = x + radius * Math.cos(endAngle);
			var endY = y + radius * Math.sin(endAngle);
			
			r.line(startX,startY,endX,endY,lineWidth,'round');
		}
	},
	
	drawFingerings : function(info) {
		var r = this.renderer;
		var fontSize = info.fingerFontSize;
		for (var i in this.fingerings) {
			var finger = this.fingerings[i]
			var x = info.boxStartX+i*info.cellWidth;
			var y = info.boxStartY+info.boxHeight;
			if (finger) {
				r.text(x,y,finger, info.font, fontSize, 'top', 'center');
			} 
		}
	}
}


Chord.renderers = {}; 

Chord.renderers.canvas = function() {}
Chord.renderers.canvas.prototype = {

	init : function(info) {
		this.canvas = document.createElement('canvas');
		var ctx = this.ctx = this.canvas.getContext('2d');
		this.canvas.width = info.width;
		this.canvas.height = info.height;
		
		if (info.lineWidth%2==1){
			ctx.translate(0.5,0.5);
		}
		ctx.fillStyle = 'white';
		ctx.fillRect(-1,-1,this.canvas.width+2,this.canvas.height+2);
		ctx.fillStyle = 'black';

		ctx.lineJoin = 'miter';
		ctx.lineWidth = info.lineWidth;
		ctx.lineCap = 'square';
		ctx.strokeStyle = 'black';
	},
	
	line : function(x1,y1,x2,y2,width,cap) {
		var c = this.ctx;
		c.save();
		if (width) {
			c.lineWidth = width;
		}
		c.lineCap = cap || 'square';
		c.beginPath();
		c.moveTo(x1,y1);
		c.lineTo(x2,y2);
		c.stroke();
		c.restore();
	},
	
	text : function(x,y,text,font,size,baseline,align) {
		this.ctx.font = size + 'px ' + font;
		this.ctx.textBaseline = baseline;
		this.ctx.textAlign = align;
		this.ctx.fillText(text,x,y)
	},
	
	rect : function(x,y,width,height) {
		var lw = this.ctx.lineWidth;
		this.ctx.fillRect(x-lw/2.0,y-lw/2.0,width+lw,height+lw);
	},
	
	circle : function(x,y,radius, fillCircle) {
		var c = this.ctx;
		c.beginPath();
		c.arc(x,y,radius,2*Math.PI,false)
		if (fillCircle) {
			c.fill();
		} else {
			c.stroke();
		}
	},
	
	diagram : function() {
		var img = document.createElement('img');
		img.src = this.canvas.toDataURL();
		return img;
	}
};

Chord.renderers.svg = function(){ }
Chord.renderers.svg.prototype = {
	
	newElement : function(name) {
		return document.createElementNS("http://www.w3.org/2000/svg", name);
	},
	
	init : function(info) {
		this.svg = this.newElement('svg');
		this.svg.setAttribute('width', info.width);
		this.svg.setAttribute('height', info.height);
		this.svg.setAttribute('style', 'background-color:white;');
		this.group = document.createElementNS("http://www.w3.org/2000/svg", "g");
		if (info.lineWidth%2==1) {
			this.group.setAttribute('transform', 'translate(0.5,0.5)');
		}
		this.group.setAttribute('stroke-linejoin', 'miter');
		this.svg.appendChild(this.group);
	},
	
	line : function(x1,y1,x2,y2,width,cap) {
		var line = this.newElement('line');
		line.x1.baseVal.value = x1;
		line.x2.baseVal.value = x2;
		line.y1.baseVal.value = y1;
		line.y2.baseVal.value = y2;
		line.setAttribute('stroke', 'black');
		line.setAttribute('stroke-width', width);
		line.setAttribute('stroke-linecap', cap);
		this.group.appendChild(line);
	},
	
	text : function(x,y,text,font,size,baseline,align) {
		var anchors = { left:'start', right:'end', center:'middle' };
		var baselines = { middle:'middle', top:'text-before-edge', bottom:'text-after-edge' };
		var textNode = this.newElement('text');
		textNode.setAttribute('x', x);
		textNode.setAttribute('y', y);
		textNode.setAttribute('font-family', font);
		textNode.setAttribute('font-size', size + 'px');
		textNode.setAttribute('text-anchor', anchors[align]);
		textNode.setAttribute('alignment-baseline', baselines[baseline]);
		textNode.appendChild(document.createTextNode(text));
		this.group.appendChild(textNode);
	},
	
	rect : function(x,y,width,height) {
		var rect = this.newElement('rect');
		rect.x.baseVal.value = x-0.5;
		rect.y.baseVal.value = y-0.5;
		rect.width.baseVal.value = width+1;
		rect.height.baseVal.value = height+1;
		rect.setAttribute('fill', 'black');
		this.group.appendChild(rect);
	},
	
	circle : function(x,y,radius, fillCircle) {
		var circle = this.newElement('circle');
		circle.cx.baseVal.value = x;
		circle.cy.baseVal.value = y;
		circle.r.baseVal.value = radius;
		if (fillCircle) {
			circle.setAttribute('fill', 'black');
		} else {
			circle.setAttribute('fill', 'white');
			circle.setAttribute('stroke', 'black');
		}
		this.group.appendChild(circle);
	},
	
	diagram : function() {
		return this.svg;
	}
};

Chord.renderers.url = function(){ }
Chord.renderers.url.prototype = {
	
	init : function(info) {
		this.info = info;
	},
	
	line : function(x1,y1,x2,y2,width,cap) {},
	text : function(x,y,text,font,size,baseline,align) {},
	rect : function(x,y,width,height,fillRect) {},
	circle : function(x,y,radius, fillCircle) {},
	
	diagram : function() {
		var img = document.createElement('img');
		var url = Chord.serverSideRenderUrl
					.replace('{name}', escape(this.info.name))
					.replace('{positions}', this.info.positions)
					.replace('{fingers}', this.info.fingers)
					.replace('{size}', this.info.scale)
					.replace('{format}', Chord.serverSideRenderFormat);
		img.setAttribute('src', url);
		return img;
	}
};


Chord.renderers.vml = function(){ }
Chord.renderers.vml.prototype = {
	
	newElement : function(name) {
		var el = document.createElementNS("urn:schemas-microsoft-com:vml", name);
		el.style.behavior = 'url(#default#VML)';
		return el;
	},
	
	init : function(info) {
		this.rect = this.newElement('rect');
		this.svg.setAttribute('width', info.width);
		this.svg.setAttribute('height', info.height);
		this.svg.setAttribute('style', 'background-color:white;');
		this.group = document.createElementNS("http://www.w3.org/2000/svg", "g");
		if (info.lineWidth%2==1) {
			this.group.setAttribute('transform', 'translate(0.5,0.5)');
		}
		this.lineWidth = info.lineWidth;
		this.group.setAttribute('stroke-linejoin', 'miter');
		this.svg.appendChild(this.group);
	},
	
	line : function(x1,y1,x2,y2,width,cap) {
		var line = this.newElement('line');
		line.x1.baseVal.value = x1;
		line.x2.baseVal.value = x2;
		line.y1.baseVal.value = y1;
		line.y2.baseVal.value = y2;
		line.setAttribute('stroke', 'black');
		line.setAttribute('stroke-width', width);
		line.setAttribute('stroke-linecap', cap);
		this.group.appendChild(line);
	},
	
	text : function(x,y,text,font,size,baseline,align) {
		var anchors = { left:'start', right:'end', center:'middle' };
		var baselines = { middle:'middle', top:'text-before-edge', bottom:'text-after-edge' };
		var textNode = this.newElement('text');
		textNode.setAttribute('x', x);
		textNode.setAttribute('y', y);
		textNode.setAttribute('font-family', font);
		textNode.setAttribute('font-size', size + 'px');
		textNode.setAttribute('text-anchor', anchors[align]);
		textNode.setAttribute('alignment-baseline', baselines[baseline]);
		textNode.appendChild(document.createTextNode(text));
		this.group.appendChild(textNode);
	},
	
	rect : function(x,y,width,height,fillRect) {
		var rect = this.newElement('rect');
		rect.x.baseVal.value = x-lineWidth/2.0;
		rect.y.baseVal.value = y-lineWidth/2.0;
		rect.width.baseVal.value = width+lineWidth;
		rect.height.baseVal.value = height+lineWidth;
		rect.setAttribute('fill', 'black');
		this.group.appendChild(rect);
	},
	
	circle : function(x,y,radius, fillCircle) {
		var circle = this.newElement('circle');
		circle.cx.baseVal.value = x;
		circle.cy.baseVal.value = y;
		circle.r.baseVal.value = radius;
		if (fillCircle) {
			circle.setAttribute('fill', 'black');
		} else {
			circle.setAttribute('fill', 'white');
			circle.setAttribute('stroke', 'black');
		}
		this.group.appendChild(circle);
	},
	
	diagram : function() {
		return this.svg;
	}
};

Chord.autoRender = function() {
	if (!Chord.renderOnLoad) {
		return;
	}
	Chord.render(document.getElementsByTagName('span'));
};

if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', Chord.autoRender, true);
} else if (window.attachEvent) {
	window.attachEvent('onload', Chord.autoRender);
}

Chord.render = function(elements) {
	
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		var chordDef = el.getAttribute('data-chord');
		var chordName = el.firstChild.nodeValue;
		if (chordDef && chordDef.match(Chord.regex)) {
			var size = Chord.defaultSize;
			if (RegExp.$3) {
				size = parseInt(RegExp.$3);
			}
			var renderer = RegExp.$4 || Chord.defaultRenderer;
			
			el.replaceChild(new Chord(chordName, RegExp.$1, RegExp.$2).getDiagram(size, renderer), el.firstChild);
		}
	}
}


//Setup some fallbacks...
if (!document.createElement('canvas').getContext) {
	Chord.renderers.canvas = Chord.renderers.url;
}
if (!document.createElementNS) {
	Chord.renderers.svg = Chord.renderers.url;
}



