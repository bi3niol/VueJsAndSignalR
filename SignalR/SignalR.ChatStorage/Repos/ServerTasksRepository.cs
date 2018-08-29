using Common.MongoDB;
using MongoDB.Driver;
using SignalR.ChatStorage.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SignalR.ChatStorage.Repos
{
    public class ServerTasksRepository : Repository<ServerTask>
    {
        public ServerTasksRepository(IMongoDatabase database) : base(database, true)
        {
        }
    }
}
