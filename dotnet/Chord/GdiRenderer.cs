using System;
using System.Collections.Generic;
using System.Text;
using System.Drawing;
using Jurassic.Library;
using Jurassic;
using System.Drawing.Drawing2D;

namespace Chord
{
    internal class GdiRendererConstructor: ClrFunction
    {
        internal GdiRendererConstructor(ScriptEngine engine)
            : base(engine.Function.InstancePrototype, "GdiRenderer", new GdiRendererInstance(engine.Object.InstancePrototype, true))
        {
        }
        [JSConstructorFunction]
        internal GdiRendererInstance Construct(int seed)
        {
            return new GdiRendererInstance(this.InstancePrototype, false);
        }
    }

    internal class GdiRendererInstance : ObjectInstance
    {
        internal GdiRendererInstance(ObjectInstance proto, bool isPrototype)
            : base(proto)
        {
            if (isPrototype)
            {
                this.PopulateFunctions();
            }
        }

        private Image _image;
        private Graphics _graphics;
        private int _lineWidth;
        
        [JSFunction(Name="init")]
        internal void Init(ObjectInstance info)
        {
            _image = new Bitmap((int)(double)info.GetPropertyValue("width"), (int)(double)info.GetPropertyValue("height"));
            _graphics = Graphics.FromImage(_image);
            _graphics.FillRectangle(Brushes.White, 0, 0, _image.Width,_image.Height);
            _graphics.SmoothingMode = SmoothingMode.AntiAlias;
            _lineWidth = (int)(double)info.GetPropertyValue("lineWidth");
            if (_lineWidth % 2 == 0)
            {
                _graphics.TranslateTransform(0.5f, 0.5f);
            }
        }

        [JSFunction(Name = "line")]
        internal void Line(double x1, double y1, double x2, double y2, double width, string cap)
        {
            var pen = new Pen(Brushes.Black, (float)width);
            if (cap == "square") {
                pen.SetLineCap(LineCap.Square, LineCap.Square, DashCap.Flat);
            } else if (cap == "round") {
                pen.SetLineCap(LineCap.Round, LineCap.Round, DashCap.Round);
            } else {
                throw new ArgumentException("Invalid cap: " + cap);
            }
            _graphics.DrawLine(pen, (float)x1, (float)y1, (float)x2, (float)y2);
        }

        [JSFunction(Name = "text")]
        internal void Text(double x, double y, string text, string font, double size, string baseline, string align)
        {
            var theFont = new Font(font, (float)size, GraphicsUnit.Pixel);
            SizeF textSize = _graphics.MeasureString(text, theFont);
            
            if (baseline == "middle") {
                y -= textSize.Height / 2.0;
            } else if (baseline == "bottom") {
                y -= textSize.Height;
            }
            if (align == "center")
            {
                x -= textSize.Width / 2.0;
            }
            else if (baseline == "right")
            {
                x -= textSize.Width;
            }


            _graphics.DrawString(text, theFont, Brushes.Black, new PointF((float)x, (float)y));
        }

        [JSFunction(Name = "rect")]
        internal void Rect(double x, double y, double width, double height)
        {
            _graphics.FillRectangle(Brushes.Black, (float)x-_lineWidth/2f, (float)y-_lineWidth/2f, (float)width+_lineWidth, (float)height+_lineWidth);
        }

        [JSFunction(Name = "circle")]
        internal void Circle(double x, double y, double radius, bool fillCircle)
        {
            var path = new GraphicsPath();
            RectangleF rect = new RectangleF((float)(x-radius), (float)(y-radius), (float)(radius*2), (float)(radius*2));
            path.AddArc(rect, 0, 360);
            if (fillCircle) {
                _graphics.FillPath(Brushes.Black, path);
            } else {
                _graphics.DrawPath(Pens.Black, path);
            }
        }

        [JSFunction(Name = "diagram")]
        internal object Diagram()
        {
            return _image;
        }
    }
}
