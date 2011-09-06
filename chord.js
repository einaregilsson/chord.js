CELL_WIDTH = 10
CELL_HEIGHT = 10
LINE_WIDTH = 1
HALF_LINE_WIDTH = LINE_WIDTH / 2.0
DOT_RADIUS = Math.floor(0.45*CELL_WIDTH)
NUT_SIZE = 3
DOT_WIDTH = 2*DOT_RADIUS
X = CELL_WIDTH*2
Y = CELL_HEIGHT*2
MUTED = -1

function Chord(canvas, name, positions, fingering) {
	this.init(canvas, name, positions, fingering)
}

//Matches a named chord with optional fingerings
//              |Small      |Large chord with seperators            |        |Optional|
//              |Chord      |dashes, dots or spaces                 |        |Fingerings
Chord.regex = /([0-9xX]{4,6}|(?:x|X|\d\d?)(?:[-\. ](?:x|\d\d?)){3,5})\b(\s*\[([T\d]+)\])?/g

Chord.prototype = {
	init : function(canvas, name, positions, fingers, scale) {
		this.canvas = canvas
		this.parse(positions, fingers)
		this.name = name
	},
	
	calculateDimensions : function() {
		var sc = this.scale
		var s = function(v) { return Math.round(sc*v,0) }
		this.cellWidth = s(CELL_WIDTH)
		this.cellHeight = s(CELL_HEIGHT)
		this.lineWidth = Math.max(s(LINE_WIDTH),1)
		this.halfLineWidth = this.lineWidth/2.0
		this.nutSize = s(NUT_SIZE)
		this.dotRadius = s(DOT_RADIUS)
		this.dotWidth = 2*this.dotRadius
		this.boxWidth = (this.stringCount-1)*this.cellWidth
		this.boxHeight = this.fretCount*this.cellHeight
		this.nameFontSize = 2*this.cellHeight
		this.nameFont = this.nameFontSize + 'px Arial'
		this.ctx.font = this.nameFont
		this.ctx.textBaseline = 'top'
		var nameWidth = this.ctx.measureText(this.name).width + 4
		var stdWidth = this.boxWidth + 3.5*this.cellWidth
		this.width = Math.max(nameWidth,stdWidth)*this.canvasScale
		this.height = this.boxHeight+ 4.5*this.cellHeight*this.canvasScale
		this.translateX = Math.round((this.width-this.canvasScale*this.boxWidth)/2,0)
		this.translateY = Math.round(this.canvasScale*(this.nutSize+this.dotWidth+this.nameFontSize),0)
		if (this.lineWidth%2 ==1) {
			this.translateX+=0.5
			this.translateY+=0.5
		}
	},
	
	parse : function(frets, fingers) {
		this.positions = []
		var raw = [];
		if (frets.match(/^[0-9xX]{1,6}$/)) {
			for (var i = 0; i < frets.length;i++) {
				raw.push(frets.charAt(i))
			}
		} else {
			raw = frets.split(/[^\dxX]/)
		}
		this.stringCount = raw.length;
		if (this.stringCount == 4) {
			this.fretCount = 4;
		} else {
			this.fretCount = 5;
		}
		var maxFret = 0 
		var minFret = 1000
		for (var i in raw) {
			var c = raw[i]
			if (c.toLowerCase() == 'x') {
				this.positions.push(MUTED)
			} else {
				var fret = parseInt(c)
				if (fret > 0 && fret < minFret) {
					minFret = fret
				}
				maxFret = Math.max(maxFret, fret)
				this.positions.push(fret)
			}
		}
		if (maxFret <=this.fretCount) {
			this.startFret = 1
		} else {
			this.startFret = minFret
		}
		this.fingerings = []
		if (!fingers) {
			return
		}
		var j = 0
		for (var i = 0; i < fingers.length; i++) {
			for (;j<this.positions.length;j++) {
				if (this.positions[j] <= 0) {
					this.fingerings.push(null)
				} else {
					this.fingerings.push(fingers[i])
					j++
					break
				}
			}
		}
	},
	
	drawMutedAndOpenStrings : function() {
		with(this) {
			for (var i in positions) {
				var pos = positions[i]
				var x = i*cellWidth
				var y = -nutSize*1.3 - dotRadius
				var y = -nutSize*1.3 - dotRadius
				if (startFret > 1) {
					y+=nutSize
				}
				if (pos == MUTED) {
					drawCross(x,y,dotRadius)
				} else if (pos == 0) {
					drawCircle(x,y,dotRadius)
				}
			}
		}
	},
	
	drawPositions : function() {
		with(this) {
			for (var i in positions) {
				var pos = positions[i]
				if (pos > 0) {
					var relativePos = pos - startFret+1
					var x = i*cellWidth
					if (relativePos <= 5) {
						var y = relativePos*cellHeight-(cellHeight/2)
						drawCircle(x,y,dotRadius,true)
					}
				}
			}
		}
	},
	
	toString : function() {
		return 'Chord';
	},
	
	drawFretGridAndNut : function() {
		with(this) {
			ctx.beginPath()
			var width = (stringCount-1)*cellWidth
			for (var i = 0; i <= this.stringCount-1; i++) {
				var x = i*cellWidth
				ctx.moveTo(x, 0)
				ctx.lineTo(x, this.fretCount*cellHeight)
			}
			
			for (var i = 0; i <= this.fretCount; i++) {
				var y = i*cellHeight
				ctx.moveTo(0, y)
				ctx.lineTo(width, y)
			}
			
			ctx.stroke()
			if (startFret == 1) {
				ctx.save()
				ctx.beginPath()
				ctx.lineWidth = nutSize
				ctx.lineCap = 'butt'
				ctx.moveTo(-halfLineWidth,-0.5*nutSize)
				ctx.lineTo(boxWidth+halfLineWidth,-0.5*nutSize)
				ctx.stroke()
				ctx.restore()
			} else {
				ctx.font = cellHeight + 'px Arial'
				ctx.textBaseline = 'middle'
				var x = -ctx.measureText(startFret+'').width-2*lineWidth - dotRadius
				ctx.fillText(startFret, x,cellHeight/2)
			}
		}
	},
	
	drawName : function() {
		with (this) {
			ctx.font = nameFont
			var nameWidth = ctx.measureText(name)
			ctx.textAlign = 'center'
			ctx.textBaseline = 'bottom'
			ctx.fillText(name, width/2, -nutSize-dotWidth)
		}
	},
	
	draw : function(options) {
		options = options || {}
		with(this) {
			this.scale = options.scale || 1
			this.canvasScale = options.canvasScale || 1
			this.ctx = canvas.getContext('2d')
			calculateDimensions()
			canvas.width = width
			canvas.height = height
			
			ctx.strokeRect(0.5,0.5,width-1,height-1)
			
			ctx.lineJoin = 'miter'
			ctx.lineWidth = lineWidth
			ctx.lineCap = 'square'
			ctx.strokeStyle = 'black'
			ctx.translate(translateX,translateY)
			if (canvasScale != 1) {
				ctx.scale(canvasScale, canvasScale)
			}
			drawFretGridAndNut()
			drawName()
			drawMutedAndOpenStrings()
			drawPositions()
			drawFingerings()
			drawBars()
		}
	},
	
	getImage : function(options) {
		this.draw(options)
		var img = document.createElement('img')
		img.src = this.canvas.toDataURL()
		return img
	},
	
	drawCircle : function(x,y,radius, fillCircle) {
		with(this.ctx) {
			beginPath()
			if (!fillCircle) {
				radius -= lineWidth
			}
			arc(x,y,radius,0,2*Math.PI,false)
			if (fillCircle) {
				fill()
			} else {
				stroke()
			}
		}
	},
	
	drawBars : function() {
		with(this) {
			if (fingerings.length>0) {
				var bars = {}
				for (var i = 0; i < positions.length; i++) {
					var fret = positions[i]
					if (fret > 0) {
						if (bars[fret]&& bars[fret].finger == fingerings[i]) {
							bars[fret].length = i - bars[fret].index
						} else {
							bars[fret] = { finger:fingerings[i], length:0, index:i}
						}
					}
				}
				for (var fret in bars) {
					if (bars[fret].length > 0) {
						var xStart = bars[fret].index * cellWidth
						var xEnd = xStart+bars[fret].length*cellWidth
						var relativePos = fret - startFret+1
						var y = relativePos*cellHeight-(cellHeight/2)
						ctx.lineWidth = dotRadius
						ctx.beginPath()
						ctx.moveTo(xStart,y)
						ctx.lineTo(xEnd,y)
						ctx.stroke()
					}
				}

				//Explicit, calculate from that
			} else {
				//Try to guesstimate whether there is a bar or not				
				var barFret = positions[positions.length-1];
				if (barFret <= 0) {
					return;
				}
				if (positions.join('') == '-1-10232') { //Special case for the D chord...
					return
				}
				var startIndex = -1;

				for (var i = 0; i < positions.length-2;i++) {
					var fret = positions[i];
					if (fret > 0 && fret < barFret) {
						return
					} else if (fret == barFret && startIndex == -1) {
						startIndex = i
					} else if (startIndex != -1 && fret < barFret) {
						return
					}
				}
				if (startIndex >= 0) {
					var xStart = startIndex * cellWidth
					var xEnd = (positions.length-1)*cellWidth
					var relativePos = barFret - startFret+1
					var y = relativePos*cellHeight-(cellHeight/2)
					ctx.lineWidth = dotRadius
					ctx.beginPath()
					ctx.moveTo(xStart,y)
					ctx.lineTo(xEnd,y)
					ctx.stroke()
				}
			}
		}
	},
	
	drawCross : function(x, y, radius) {
		with(this) {
			ctx.save()
			ctx.lineCap = 'round'
			ctx.lineWidth *= 1.5
			var angle = Math.PI/4
			for (var i = 0; i < 2; i++) {
				var startAngle = angle + i*Math.PI/2
				var endAngle = startAngle + Math.PI

				var startX = x + radius * Math.cos(startAngle)
				var startY = y + radius * Math.sin(startAngle)
				var endX = x + radius * Math.cos(endAngle)
				var endY = y + radius * Math.sin(endAngle)
				ctx.beginPath()
				ctx.moveTo(startX,startY)
				ctx.lineTo(endX,endY)
				ctx.stroke()
			}
			ctx.restore()
		}
	},
	
	drawFingerings : function() {
		with(this) {
			var fontSize = Math.ceil(cellHeight + 1 - Math.min(scale,1))
			ctx.font = fontSize + 'px Arial'
			ctx.textBaseline = 'top'
			ctx.textAlign = 'center'
			for (var i in fingerings) {
				var finger = fingerings[i]
				var x = i*cellWidth
				var y = this.fretCount*cellHeight
				if (finger) {
					ctx.fillText(finger,x,y)
				} 
			}
		}
	}
}


if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', function() {
		Chord.render(document.getElementsByTagName('span'))
	}, true)
}

Chord.render = function(elements) {
	
	var canvas = document.createElement('canvas');
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		var chordDef = el.getAttribute('data-chord');
		var chordName = el.firstChild.nodeValue;
		if (chordDef && chordDef.match(Chord.regex)) {
			el.replaceChild(new Chord(canvas, chordName, RegExp.$1, RegExp.$3).getImage(), el.firstChild);
		}
	}
}
