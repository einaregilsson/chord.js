using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Drawing.Imaging;

namespace Chord.Web
{
    public class ChordHandler : IHttpHandler
    {
        public bool IsReusable
        {
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "image/png";
            new Chord("E", "022100", "231").GetDiagram(5).Save(context.Response.OutputStream,ImageFormat.Png);
            context.Response.End();
        }
    }
}