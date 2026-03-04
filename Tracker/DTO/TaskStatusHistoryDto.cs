public class TaskStatusHistoryDto
{
    public int Id { get; set; }
    public string OldStatus { get; set; }
    public string NewStatus { get; set; }
    public DateTime CreatedAt { get; set; }
}