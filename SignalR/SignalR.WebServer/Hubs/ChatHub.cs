using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using SignalR.WebServer.Hubs.Models;

namespace SignalR.WebServer.Hubs
{
    [HubName("chatHub")]
    public class ChatHub : Hub
    {
        private static ConcurrentDictionary<string, UserConnection> ConnectedUsers = new ConcurrentDictionary<string, UserConnection>();

        public void Hello()
        {
            Clients.All.hello();
        }
        public void Send(string to, string content)
        {
            Clients.Others.receiveMessage(Context.ConnectionId, to, content);
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            this.Leave();
            return base.OnDisconnected(stopCalled);
        }

        public UserConnection Update(UserConnection userData)
        {
            UserConnection user = null;

            if (ConnectedUsers.TryGetValue(Context.ConnectionId, out user))
            {
                ConnectedUsers.TryUpdate(Context.ConnectionId, new UserConnection()
                {
                    Age = userData.Age,
                    Id = Context.ConnectionId,
                    NickName = userData.NickName
                }, user);

                ConnectedUsers.TryGetValue(Context.ConnectionId, out user);
                Clients.Others.userUpdated(user);
                return user;
            }
            return user;
        }

        public UserConnection[] Join(UserConnection userData)
        {

            var connectedUsers = ConnectedUsers.Values.ToArray();
            try
            {
                userData.Id = Context.ConnectionId;
                var connection = new UserConnection()
                {
                    Id = Context.ConnectionId,
                    Age = userData.Age,
                    NickName = userData.NickName
                };
                ConnectedUsers[Context.ConnectionId] = connection;

                Clients.Others.newUser(userData);
            }
            catch (Exception)
            {
                return null;
            }
            return connectedUsers;
        }
        public void Leave()
        {
            ConnectedUsers.TryRemove(Context.ConnectionId, out var r);
            Clients.Others.userLeft(Context.ConnectionId);
        }
    }
}