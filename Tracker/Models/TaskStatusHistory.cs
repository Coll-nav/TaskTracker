using System.Text.Json.Serialization;
public class TaskStatusHistory
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public Status OldStatus { get; set; }
    public Status NewStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    
    [JsonIgnore]
    public TaskItem Task { get; set; }
}