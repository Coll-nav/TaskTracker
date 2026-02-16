using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

public enum Status
{
    New,
    InProgress,
    Done
}
public class TaskItem
{
    public int Id { get; set; } //номер 
    [Required] //команда обязательного заполнение 
    [StringLength(100, ErrorMessage = "Название не должно быть длинне 100 символов")]
    public string? Title { get; set; } //название
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public Status Status { get; set; }
    
    public ICollection<SubTask> SubTasks { get; set; } = new List<SubTask>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<TaskStatusHistory> TaskStatusHistories { get; set; } = new List<TaskStatusHistory>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
