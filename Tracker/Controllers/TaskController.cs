// Controllers/TasksController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Models;
using Tracker.Data;


namespace TaskTracker.Api.Controllers;

[ApiController] // главный атрибут для пользования другими
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet] // просмотр всех задач
    public async Task<IActionResult> GetTasks()
    {
        var tasks = await _context.Tasks.ToListAsync();
        if (tasks.Count == 0) return Ok("Список задач пуст");
        return Ok(tasks);
    }

    [HttpPost] //добавление задачи 
    public async Task<IActionResult> AddTask(TaskItem task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, new { message = "Задача добавлена" });
    }

    [HttpGet("{id}")] //поиск задачи по id
    public async Task<IActionResult> GetTaskById(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound(new {message = "Задачи с такими id нету"});
        return Ok(task);
    }

    [HttpDelete("{id}")] // удаление задачи по id
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound(new {message = "Задачи с такими id нету"});
        if (task.isTrue) return BadRequest(new { message = "Нельзя удалить выполненную задачу" });
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return Ok(new { message = $"Задача с номером {task.Id} успешно удалена" });
    }
}