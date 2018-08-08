using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SignalR.WebServer.Hubs.Models
{
    public class UserConnection
    {
        public string Id { get; set; }
        public string NickName { get; set; }
        public int Age { get; set; }
    }
}