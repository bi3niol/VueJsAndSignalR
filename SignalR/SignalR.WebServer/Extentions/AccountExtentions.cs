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
        public static async Task<Message[]> GetMessagesOfConversation(this Account account, ObjectId otherAccountId, ObjectId lastLoadedMessageId, ChatService service, bool isGroup, int pageSize = 20)
        {
            Message lastMessage = await service.MessagesRepository.GetEntityAsync(lastLoadedMessageId);
            DateTime lastMessageSentOn = lastMessage == null ? DateTime.Now : lastMessage.MessageSentOn;

            IQueryable<Message> messages = service.MessagesRepository.GetEntitiesByExpression(m => m.MessageSentOn < lastMessageSentOn);
            if (!isGroup)
                messages = messages.Where(m =>
                (m.From == account.Id && m.To == otherAccountId)
                || (m.From == otherAccountId && m.To == account.Id));
            else
                messages = messages.Where(m => m.GroupId == otherAccountId);

            return messages.OrderByDescending(m => m.MessageSentOn).Take(pageSize).ToArray();
        }
    }
}