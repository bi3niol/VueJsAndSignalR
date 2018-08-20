using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using MongoDB.Bson;
using SignalR.ChatStorage.Models;
using SignalR.ChatStorage.Services;
using SignalR.WebServer.Extentions;
using SignalR.WebServer.Hubs.Models;

namespace SignalR.WebServer.Hubs
{
    [HubName("chatHub")]
    public class ChatHub : Hub
    {
        private static ConcurrentDictionary<string, Account> ConnectedUsers = new ConcurrentDictionary<string, Account>();

        private AccountService _accountService;
        private AccountService AccountService
        {
            get
            {
                if (_accountService != null)
                    return _accountService;
                _accountService = new AccountService("SignalRChatDB");
                return _accountService;
            }
        }

        public void Send(string to, string content)
        {
            var id = ObjectId.Parse(to);
            var message = AccountService.AddMessage(ConnectedUsers[Context.ConnectionId].Id, id, content);
            Clients.All.receiveMessage(message);
        }

        public async Task<Message[]> GetMessagesOfConversation(string partnerId, string lastMessageId = null)
        {
            ObjectId accountId = ObjectId.Parse(partnerId),
                messageId = string.IsNullOrEmpty(lastMessageId) ? ObjectId.Empty : ObjectId.Parse(lastMessageId);
            var res = await ConnectedUsers[Context.ConnectionId].GetMessagesOfConversation(accountId, messageId, AccountService);
            return res;
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            this.Leave();
            return base.OnDisconnected(stopCalled);
        }

        public Account Update(Account account)
        {
            Account user = account;

            //if (ConnectedUsers.TryGetValue(Context.ConnectionId, out user))
            //{
            //    ConnectedUsers.TryUpdate(Context.ConnectionId, new Account()
            //    {
            //        Age = userData.Age,
            //        Id = Context.ConnectionId,
            //        NickName = userData.NickName
            //    }, user);

            //    ConnectedUsers.TryGetValue(Context.ConnectionId, out user);
            //    Clients.Others.userUpdated(user);
            //}

            return user;
        }

        public Account[] Join(Account userData)
        {
            Account user = AccountService.Login(userData.NickName);
            if (user == null)
                user = AccountService.RegisterNewAccount(userData);

            user.Password = null;
            user.Connected = true;
            SetConnectionState(user.Id, true);
            ConnectedUsers[Context.ConnectionId] = user;

            Account[] connectedUsers = AccountService.GetUsersExcept(user.Id);

            return connectedUsers;
        }
        public void Leave()
        {
            Account account;
            if (ConnectedUsers.TryRemove(Context.ConnectionId, out account))
                SetConnectionState(account.Id, false);
        }

        private void SetConnectionState(ObjectId objectId, bool state)
        {

            Account update = AccountService.AccountRepository.GetEntity(objectId);
            update.Connected = state;
            AccountService.AccountRepository.Update(update);

            Clients.All.userConnectedStateChanged(objectId, state);
        }
    }
}