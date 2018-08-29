using MongoDB.Bson;
using SignalR.ChatStorage.Models;
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
                if (string.IsNullOrEmpty(item.Login))
                    item.Login = item.NickName;
                if (string.IsNullOrEmpty(item.Password))
                    item.Password = "";
                service.AccountRepository.Update(item);
            }
            foreach (var item in service.MessagesRepository.GetEntitiesByExpression(m=>string.IsNullOrEmpty(m.FromName)))
            {
                item.FromName = service.AccountRepository.GetEntity(item.From)?.NickName;
                service.MessagesRepository.Update(item);
            }
        }
    }
}
