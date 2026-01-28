using Microsoft.AspNetCore.Mvc;

public class TaskItem
{
    public int Id { get; set; } //номер
    public string Title { get; set; } //название
    public bool isTrue {get; set;} //выполнено или нет
    
}