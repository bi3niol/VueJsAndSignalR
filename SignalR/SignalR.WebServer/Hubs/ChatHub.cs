using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
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

        public UserConnection[] Join(dynamic userData)
        {

            var connectedUsers = ConnectedUsers.Values.ToArray();
            try
            {
                userData.userId = Context.ConnectionId;
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
        }
    }
}