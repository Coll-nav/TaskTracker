
using System.Text.Json.Serialization;

public class SubTask
{
    public int SubTaskId { get; set; }
    public string? SubTaskTitle { get; set; }
    public bool isDone { get; set; }
    
    public int TaskId { get; set; }
    [JsonIgnore]
    public TaskItem Task { get; set; }
}