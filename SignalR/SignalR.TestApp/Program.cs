using MongoDB.Bson;
using SignalR.ChatStorage.Models;
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
            Regex regex = new Regex("(:D)");
            Console.WriteLine(regex.IsMatch(":D"));
        }
    }
}
