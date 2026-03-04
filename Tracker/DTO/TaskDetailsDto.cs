public class TaskDetailsDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public List<SubTaskDto> SubTasks { get; set; }
    public List<CommentDto> Comments { get; set; }
    public List<string> Tags { get; set; }
    public List<TaskStatusHistoryDto> history { get; set; }
}