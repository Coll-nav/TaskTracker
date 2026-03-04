public  class TaskListItemDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SubTaskCount { get; set; }
    public int SubTaskCountDone { get; set; }
    public int CommentsCount { get; set; }
    public List<string> Tags { get; set; }
}