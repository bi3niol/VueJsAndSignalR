using SignalR.ChatStorage.Models;

namespace Worker.TaskProcessor
{
    interface ITaskProcessor
    {
        void ProcessTask(ServerTask task);
    }
}
