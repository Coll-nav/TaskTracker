using System.Text.Json.Serialization;

public class TaskFile
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string FileName { get; set; }
    public string StoredFileName { get; set; } //имя файла на сервере 
    public string ContentType { get; set; } //тип файла 
    public long FileSize { get; set; } //размер файла 
    
    public TaskItem  Task { get; set; }
}