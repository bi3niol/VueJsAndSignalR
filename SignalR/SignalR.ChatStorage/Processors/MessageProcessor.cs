using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace SignalR.ChatStorage.Processors
{
    internal static class MessageProcessor
    {
        private static Dictionary<Regex, Func<string, string>> rules = new Dictionary<Regex, Func<string, string>>
        {
            {new Regex("((http|https)://.*(png|jpg))",RegexOptions.Compiled), (s) => $"<img style='max-width:500px;' src='{s}'/>" },
            {new Regex("((C|D|E|F):.*(png|jpg))",RegexOptions.Compiled), (s) => $"<img style='max-width:500px;' src='{s}'/>" },
            {new Regex($"(\\n|{Environment.NewLine})",RegexOptions.Compiled), (s) => $"<br/>" },
            {new Regex("(:69:)",RegexOptions.Compiled), (s) => "<span>&#9803</span>" },
            {new Regex("([(]{1}(y|Y)[)]{1})",RegexOptions.Compiled), (s) => "<i class='em-svg em---1'></i>" },
            {new Regex("([(]{1}(n|N)[)]{1})",RegexOptions.Compiled), (s) => "<i class='em-svg em--1'></i>" },
            {new Regex("(:[c]{1})",RegexOptions.Compiled), (s) => "<i class='em-svg em-anguished'></i>" },
            {new Regex("(:(wrr|Wrr|WRR):)",RegexOptions.Compiled), (s) => "<i class='em-svg em-angry'></i>" },
            {new Regex("(:(o|O))",RegexOptions.Compiled), (s) => "<i class='em-svg em-astonished'></i>" },
            //{new Regex("([^]{2})",RegexOptions.Compiled), (s) => "<i class='em-svg em-blush'></i>" },
            {new Regex("(;[(]{1})",RegexOptions.Compiled), (s) => "<i class='em-svg em-cry'></i>" },
            {new Regex("(:[|]{1})",RegexOptions.Compiled), (s) => "<i class='em-svg em-expressionless'></i>" },
            {new Regex("(<3)",RegexOptions.Compiled), (s) => "<i class='em-svg em-heart'></i>" },
            {new Regex("(:P)",RegexOptions.Compiled), (s) => "<i class='em-svg em-yup'></i>" },
            {new Regex("((wc)|(WC))",RegexOptions.Compiled), (s) => "<i class='em-svg em-wc'></i>" },
            {new Regex("(hmm)",RegexOptions.Compiled), (s) => "<i class='em-svg em-thinking_face'></i>" },
            {new Regex("(:B)",RegexOptions.Compiled), (s) => "<i class='em-svg em-sunglasses'></i>" },
            {new Regex("(:D)",RegexOptions.Compiled), (s) => "<i class='em-svg em-smiley'></i>" },
            {new Regex("(:[)]{1})",RegexOptions.Compiled), (s) => "<i class='em-svg em-slightly_smiling_face'></i>" },
        };
        public static string ProcessContent(string content)
        {
            Regex regex = new Regex(string.Join("|", rules.Keys.Select(e => e.ToString())));
            return regex.Replace(content, (m) =>
            {
                string res = m.Value;
                var rgx = rules.Keys.FirstOrDefault(r => r.IsMatch(res));
                if (rgx != null && res != "")
                    res = rules[rgx](res);

                return res;
            });
            return content;
        }
    }
}
