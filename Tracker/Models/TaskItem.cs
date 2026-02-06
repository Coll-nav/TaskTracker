using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

public class TaskItem
{
    public int Id { get; set; } //номер 
    [Required] //команда обязательного заполнение 
    [StringLength(100, ErrorMessage = "Название не должно быть длинне 100 символов")]
    public string Title { get; set; } //название
    public bool isTrue {get; set;} //выполнено ли
    
}
//обновить бд после всего этого