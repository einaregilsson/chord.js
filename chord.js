

function Chord(canvas, name, positions, fingering) {
	this.init(canvas, name, positions, fingering);
}
var MUTED = -1;


//Matches a named chord with optional fingerings
//              |Small      |Large chord with seperators            |        |Optional|
//              |Chord      |dashes, dots or spaces                 |        |Fingerings
Chord.regex = /([0-9xX]{4,6}|(?:x|X|\d\d?)(?:[-\. ](?:x|\d\d?)){3,5})\b(?:\s*\[([T\d]+)\])?(?:\s+(\d+))?(?:\s+(.*)\b)?/g;

Chord.prototype = {
	init : function(name, positions, fingers) {
		this.parse(positions, fingers);
		this.name = name;
		this.renderer = this.canvasRenderer;
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
				this.drawCross(info,x,y,info.dotRadius);
			} else if (pos == 0) {
				r.circle(x,y,info.dotRadius);
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
			r.line(x,info.boxStartY,x,info.boxStartY+this.fretCount*info.cellHeight, info.lineWidth);
		}
		
		for (var i = 0; i <= this.fretCount; i++) {
			var y = info.boxStartY+i*info.cellHeight;
			r.line(info.boxStartX,y,info.boxStartX+width,y, info.lineWidth);
		}
	},
	
	drawNut : function(info) {
		var r = this.renderer;
		if (this.startFret == 1) {
			r.rect(info.boxStartX, info.boxStartY-info.nutSize,info.boxWidth,info.nutSize,true);
		} else {
			r.text(info.boxStartX-info.dotRadius, info.boxStartY + info.cellHeight / 2.0, this.startFret+'', info.font, info.cellHeight, 'middle', 'right');
		}
	},
	
	drawName : function(info) {
		var r = this.renderer;
		r.text(info.width/2.0, 0, this.name, info.font, info.nameFontSize, 'top', 'center');
	},
	
	calculateDimensions : function(scale) {
		var info ={};
		info.scale = scale;
		info.cellWidth = scale + 3;
		info.cellHeight = info.cellWidth;
		info.nutSize = Math.round(info.cellHeight * 0.4);
		info.lineWidth = Math.max(1.0,Math.floor(info.cellHeight/6.0));
		info.dotRadius = info.cellWidth/2-1;
		if (scale <= 4) {
			info.dotRadius++;
		}
		info.dotWidth = 2*info.dotRadius;
		info.font = 'Arial';
		info.nameFontSize = Math.round(1.8*info.cellHeight);
		if (scale <= 4) {
			info.nameFontSize +=2;
		}
		info.nameFontPaddingBottom = 4;
		info.fingerFontSize = Math.round(info.cellHeight*1.2);
		if (scale <= 4) {
			info.fingerFontSize++;
		}
		if (scale == 1) {
			info.fingerFontSize++;
		}
		info.boxWidth = (this.stringCount-1)*info.cellWidth;
		info.boxHeight = (this.fretCount)*info.cellHeight;
		info.width = info.boxWidth + 3*info.cellWidth;
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
		this.renderer = Chord.renderers[renderer || 'canvas'];
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
					r.line(xStart,y,xEnd,y, info.dotRadius);
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
				r.line(xStart,y,xEnd,y, info.dotRadius);
			}
		}
	},
	
	drawCross : function(info, x, y, radius) {
		var r = this.renderer;
		var angle = Math.PI/4
		var lineWidth = info.lineWidth;
		if (info.scale > 2 ) {
			lineWidth *= 1.2;
		}
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

//Defaults

Chord.defaultSize = 3;
Chord.defaultRenderer = 'canvas'; 

Chord.renderers = {}; 

Chord.renderers.canvas = {

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
	
	rect : function(x,y,width,height,fillRect) {
		if (fillRect) {
			this.ctx.fillRect(x-0.5,y-0.5,width+1,height+1);
		} else {
			this.ctx.strokeRect(x,y,width,height);
		}
	},
	
	circle : function(x,y,radius, fillCircle) {
		var c = this.ctx;
		c.beginPath();
		radius = Math.floor(radius) ;
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

Chord.renderers.svg = {
	
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
		this.group.appendChild(line);
	},
	
	text : function(x,y,text,font,size,baseline,align) {
		var textNode = this.newElement('text');
		textNode.x.baseVal.value = x;
		textNode.y.baseVal.value = y;
		textNode.setAttribute('font-family', font);
		textNode.setAttribute('font-size', size + 'px');
		textNode.setAttribute('baseline', baseline);
		textNode.appendChild(document.createTextNode(text));
		this.group.appendChild(textNode);
	},
	
	rect : function(x,y,width,height,fillRect) {
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


if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', function() {
		Chord.render(document.getElementsByTagName('span'));
	}, true)
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
