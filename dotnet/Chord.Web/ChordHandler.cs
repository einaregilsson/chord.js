using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Drawing.Imaging;
using System.Text.RegularExpressions;

namespace Chord.Web
{
    public class ChordHandler : IHttpHandler
    {
        public bool IsReusable
        {
            get { return true; }
        }


        private ImageFormat GetFormat(string format) {
            switch(format){
                case "png":
                    return ImageFormat.Png;
                case "jpg":
                    return ImageFormat.Jpeg;
                case "gif":
                    return ImageFormat.Gif;
                case "bmp":
                    return ImageFormat.Bmp;
                default:
                    return ImageFormat.Png;
            }
        }
        public void ProcessRequest(HttpContext context)
        {
            Match m = Regex.Match(context.Request.Path, @"/(?<name>[^/\.]{1,12})(\.(?<format>png|bmp|gif|jpe?g))?$");
            if (!m.Success)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "text/html";
                context.Response.Write("ERROR: Invalid chord url");
                context.Response.End();
            }

            string name = m.Groups["name"].Value;
            string format = m.Groups["format"].Value;
            if (format == "")
            {
                format = "png";
            }

            string positions = context.Request.QueryString["p"] ?? context.Request.QueryString["positions"] ?? "000000";
            string fingers = context.Request.QueryString["f"] ?? context.Request.QueryString["fingers"];

            string sSize = context.Request.QueryString["s"] ?? context.Request.QueryString["size"];
            int size;
            if (sSize != null && int.TryParse(sSize, out size))
            {
                size = Math.Max(1, Math.Min(50, size));
            }
            else
            {
                size = 3;
            }

            ImageFormat imgFormat = GetFormat(format);
            context.Response.ContentType = "image/" + format;
            new Chord(name, positions, fingers).GetDiagram(size).Save(context.Response.OutputStream,imgFormat);
            context.Response.End();
        }
    }
}