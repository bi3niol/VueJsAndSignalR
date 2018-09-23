namespace SignalR.ChatStorage.DTOs
{
    public abstract class EntityDTO<T>
    {
        public abstract T GetEntity();
    }
}