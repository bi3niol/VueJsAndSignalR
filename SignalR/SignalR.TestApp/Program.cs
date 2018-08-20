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
            AccountService service = new AccountService("SignalRChatDB");

            foreach (var item in service.AccountRepository.GetAll())
            {
                if (string.IsNullOrEmpty(item.NickName))
                    service.AccountRepository.Remove(item);
                Console.WriteLine(item.NickName);
            }
        }
    }
}
