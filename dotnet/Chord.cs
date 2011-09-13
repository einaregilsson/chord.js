using System.Drawing;
using System.IO;
using System.Reflection;
using Jurassic;

namespace Chord
{
    public class Chord
    {
        private static readonly ScriptEngine _engine;
        static Chord()
        {
            _engine = new ScriptEngine();
            _engine.SetGlobalValue("document", "foo");
            using (var reader = new StreamReader(Assembly.GetExecutingAssembly().GetManifestResourceStream("Chord.chord.js")))
            {
                string source = reader.ReadToEnd();
                _engine.Execute(source);
            }
            _engine.Execute(@"
                //Chord.renderers.gdi = GdiRenderer;

                function createChord(name, positions, fingers, size) {
                    return new Chord(name, positions, fingers).getDiagram(size, 'gdi');
                }
            ");
        }

        private readonly string _name;
        private readonly string _positions;
        private readonly string _fingers;

        public Chord(string name, string positions, string fingers=null)
        {
            _name = name;
            _positions = positions;
            _fingers = fingers;
        }

        public Image GetDiagram(int size)
        {
            return _engine.CallGlobalFunction<Image>("createChord", _name, _positions, _fingers, size);
        }
        

        public static void Main()
        {
            var x = new Chord("E", "022100", "231");
            var img = x.GetDiagram(3);
        }
    }

}
