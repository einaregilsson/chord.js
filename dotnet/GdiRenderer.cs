using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;
using Jurassic.Library;

namespace Chord
{
    class GdiRenderer : ObjectInstance
    {
        private Image _image;
        private Graphics _graphics;
        [JSFunction(Name="init")]
        public void Init(ObjectInstance info) {
            _image = new Bitmap((int)info.GetPropertyValue("width"), (int)info.GetPropertyValue("height"));
            _graphics = Graphics.FromImage(_image);
        }

        [JSFunction(Name = "line")]
        public void Line(float x1, float y1, float x2, float y2, float width, string cap)
        {
            var pen = new Pen(Brushes.Black, width);
            _graphics.DrawLine(pen, x1, y1, x2, y2);
        }

        [JSFunction(Name = "text")]
        public void Text(float x, float y, string text, string font, float size, string baseline, string align)
        {
        }

        [JSFunction(Name = "rect")]
        public void Rect(float x, float y, float width, float height, bool fillRect)
        {
        }

        [JSFunction(Name = "circle")]
        public void Circle(float x, float y, float radius, bool fillCircle)
        {

        }
        
	    public object Diagram(){
            return null;
        }
    }
}
