

function Chord(canvas, name, positions, fingering) {
	this.init(canvas, name, positions, fingering);
}
var MUTED = -1;


//Matches a named chord with optional fingerings
//              |Small      |Large chord with seperators            |        |Optional|
//              |Chord      |dashes, dots or spaces                 |        |Fingerings
Chord.regex = /([0-9xX]{4,6}|(?:x|X|\d\d?)(?:[-\. ](?:x|\d\d?)){3,5})\b(\s*\[([T\d]+)\])?/g;

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
			var x = i*info.cellWidth;
			var y = -info.nutSize*1.3 - info.dotRadius;
			var y = -info.nutSize*1.3 - info.dotRadius;
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
				var x = i*info.cellWidth;
				if (relativePos <= 5) {
					var y = relativePos*info.cellHeight-(info.cellHeight/2)
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
			var x = i*info.cellWidth;
			r.line(x,0,x,this.fretCount*info.cellHeight);
		}
		
		for (var i = 0; i <= this.fretCount; i++) {
			var y = i*info.cellHeight;
			r.line(0,y,width,y);
		}
	},
	
	drawNut : function(info) {
		var r = this.renderer;
		if (this.startFret == 1) {
			r.rect(0,-info.nutSize,info.boxWidth,info.nutSize,true);
		} else {
			r.text(-info.cellWidth, info.cellHeight / 2.0, this.startFret+'', info.font, info.cellHeight, 'middle', 'right');
		}
	},
	
	drawName : function(info) {
		var r = this.renderer;
		r.text(info.boxWidth/2.0, -info.dotWidth-info.nutSize, this.name, info.font, info.nameFontSize, 'bottom', 'center');
	},
	
	draw : function(scale) {
	
		var info ={};
		info.cellWidth = Math.round(4*scale);
		info.cellHeight = info.cellWidth;
		info.nutSize = Math.round(info.cellHeight * 0.4);
		info.lineWidth = Math.floor(scale);
		info.dotRadius = Math.round(0.4*info.cellWidth,1); 
		info.dotWidth = 2*info.dotRadius;
		info.font = 'Arial';
		info.nameFontSize = Math.round(1.8*info.cellHeight);;
		info.boxWidth = (this.stringCount-1)*info.cellWidth;
		info.boxHeight = (this.fretCount-1)*info.cellHeight;
		info.width = info.boxWidth + 3*info.cellWidth;
		info.height = info.boxHeight + info.nameFontSize + info.nutSize + info.dotWidth + Math.round(info.cellHeight*2.4);
		info.originX = Math.round(((info.width-info.boxWidth)/2)*scale);
		info.originY = Math.round((info.nameFontSize + info.nutSize + info.dotWidth)*scale);	
		this.renderer.init(info);
		this.drawFretGrid(info);
		this.drawNut(info);
		this.drawName(info);
		this.drawMutedAndOpenStrings(info);
		this.drawPositions(info);
		this.drawFingerings(info);
		this.drawBars(info);
	},
	
	getImage : function(scale) {
		this.renderer = this.canvasRenderer;
		this.draw(scale);
		var img = document.createElement('img');
		img.src = this.renderer.canvas.toDataURL();
		return img;
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
					var xStart = bars[fret].index * info.cellWidth;
					var xEnd = xStart+bars[fret].length*info.cellWidth;
					var relativePos = fret - this.startFret+1;
					var y = relativePos*info.cellHeight-(info.cellHeight/2);
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
				var xStart = startIndex * info.cellWidth;
				var xEnd = (this.positions.length-1)*info.cellWidth;
				var relativePos = barFret - this.startFret+1;
				var y = relativePos*info.cellHeight-(info.cellHeight/2);
				r.line(xStart,y,xEnd,y, info.dotRadius);
			}
		}
	},
	
	drawCross : function(info, x, y, radius) {
		var r = this.renderer;
		var angle = Math.PI/4
		for (var i = 0; i < 2; i++) {
			var startAngle = angle + i*Math.PI/2;
			var endAngle = startAngle + Math.PI;

			var startX = x + radius * Math.cos(startAngle);
			var startY = y + radius * Math.sin(startAngle);
			var endX = x + radius * Math.cos(endAngle);
			var endY = y + radius * Math.sin(endAngle);
			r.line(startX,startY,endX,endY,1.5*info.lineWidth,'round');
		}
	},
	
	drawFingerings : function(info) {
		var r = this.renderer;
		var fontSize = info.cellHeight*1.4;
		for (var i in this.fingerings) {
			var finger = this.fingerings[i]
			var x = i*info.cellWidth;
			var y = this.fretCount*info.cellHeight;
			if (finger) {
				r.text(x,y,finger, info.font, fontSize, 'top', 'center');
			} 
		}
	}
}

Chord.prototype.canvasRenderer = {

	init : function(info) {
		this.canvas = document.createElement('canvas');
		var ctx = this.ctx = this.canvas.getContext('2d');
		this.canvas.width = info.width;
		this.canvas.height = info.width;
		
		if (info.lineWidth%2==1){
			ctx.translate(-0.5,-0.5);
		}
		ctx.strokeRect(0,0,this.canvas.width-1,this.canvas.height-1);

		ctx.translate(info.originX, info.originY);
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
		if (!fillCircle) {
			radius -= c.lineWidth;
		}
		radius = Math.floor(radius)+0.5;
		c.arc(x,y,radius,2*Math.PI,false)
		if (fillCircle) {
			c.fill();
		} else {
			c.stroke();
		}
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
			el.replaceChild(new Chord(chordName, RegExp.$1, RegExp.$3).getImage(1), el.firstChild);
		}
	}
}
