using MongoDB.Bson;
using SignalR.ChatStorage.Models;
using SignalR.ChatStorage.Processors;
using SignalR.ChatStorage.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace SignalR.TestApp
{
    class Program
    {
        static void Main(string[] args)
        {
            var s = @"sdaw https://www.youtube.com/watch?v=LViK-9GYfWo";
            Regex regex = new Regex(@"(http|https)://.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*)( |)", RegexOptions.Compiled);
            var res = regex.Match(s);
            Console.WriteLine(res.Groups[8]?.Value);
        }
    }
}
