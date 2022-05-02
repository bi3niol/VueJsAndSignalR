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
    public class MessagesRepository : Repository<Message>
    {
        public MessagesRepository(IMongoDatabase database) : base(database, true)
        {
            var indexOptions = new CreateIndexOptions();
            var indexKeys = Builders<Message>.IndexKeys.Descending(hamster => hamster.MessageSentOn);
            var indexModel = new CreateIndexModel<Message>(indexKeys, indexOptions);
            var res = DataCollection.Indexes.CreateOne(indexModel);
        }
    }
}
