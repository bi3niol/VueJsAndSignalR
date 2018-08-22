using MongoDB.Bson;
using SignalR.ChatStorage.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SignalR.TestApp
{
    class Program
    {
        static void Main(string[] args)
        {
            ChatService service = new ChatService("SignalRChatDB");

            foreach (var item in service.AccountRepository.GetAll())
            {
                if (string.IsNullOrEmpty(item.NickName))
                    service.AccountRepository.Remove(item);
                Console.WriteLine(item.NickName);
            }
        }
    }
}
