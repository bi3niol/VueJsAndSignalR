using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using MongoDB.Bson;
using SignalR.ChatStorage.Models;
using SignalR.ChatStorage.Services;

namespace SignalR.WebServer.Extentions
{
    public static class AccountExtentions
    {
        public static async Task<Message[]> GetMessagesOfConversation(this Account account, ObjectId otherAccountId, ObjectId lastLoadedMessageId, AccountService service, int pageSize = 20)
        {
            Message lastMessage = await service.MessagesRepository.GetEntityAsync(lastLoadedMessageId);
            DateTime lastMessageSentOn = lastMessage == null ? DateTime.Now : lastMessage.MessageSentOn;

            return service.MessagesRepository.GetEntitiesByExpression(m =>
            ((m.From == account.Id && m.To == otherAccountId)
            || (m.From == otherAccountId && m.To == account.Id))
            && m.MessageSentOn < lastMessageSentOn).OrderByDescending(m => m.MessageSentOn).Take(pageSize).ToArray();
        }
    }
}