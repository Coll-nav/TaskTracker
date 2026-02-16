// Controllers/TasksController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        var tasks = await _context.Tasks
            .Include(t => t.SubTasks)
            .Include(t => t.Tags)
            .Include(t => t.Comments)
            .Include(t => t.TaskStatusHistories)
            .ToListAsync();
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
    public async Task<IActionResult> GetTaskById(int id) //пока оставить Include, но рассмотреть вариант с Select
    {
        //проблема в переборе, когда мы просим вернуть эелемент которого нет(не оптимизировано)
        var task = await _context.Tasks
            .Include(t => t.SubTasks)
            .Include(t => t.Tags)
            .Include(t => t.Comments)
            .Include(t => t.TaskStatusHistories)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (task == null) return NotFound(new {message = "Задачи с такими id нету"});
        return Ok(task);
    }
    
    
    //
    [HttpPatch("{id}/status")] //подумать над ним!!!!!
    public async Task<IActionResult> StatusTask(int id, [FromBody] Status newStatus)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound(new { message = "Задача не найдена" });

        var history = new TaskStatusHistory
        {
            OldStatus = task.Status,
            NewStatus = newStatus
        };
        task.Status = newStatus;
        _context.TaskStatusHistories.Add(history);
        await _context.SaveChangesAsync();
        
        return Ok(task);
        
    }
//


    [HttpPut("{id}")] // изменение задачи по id
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItem updatedTask)
    {
        if(!ModelState.IsValid) return BadRequest(ModelState); //прошли ли данные валидацию
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id); 
        if (task == null) return NotFound(new { message = "Задача не найдена" });
        task.Title = updatedTask.Title;
        //task.isDone = updatedTask.isTrue;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")] // удаление задачи по id
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound(new {message = "Задачи с такими id нету"});
        //if (task.isTrue) return BadRequest(new { message = "Нельзя удалить выполненную задачу" });
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}