using System.Text.Json.Serialization;
public class Comment
{
    public int CommentId { get; set; }
    public string? CommentText { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TaskId { get; set; }
    [JsonIgnore]
    public TaskItem Task { get; set; }
}