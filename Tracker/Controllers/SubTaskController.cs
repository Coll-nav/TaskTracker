using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Data;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class SubTaskController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public SubTaskController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("{taskId}/subtask")]
    public async Task<IActionResult> AddSubTask(int taskId, SubTask task)
    {
        var parentTask = await _context.Tasks.FindAsync(taskId);
        if(parentTask == null) return NotFound("Parent task not found");
        task.TaskId = taskId;
        _context.SubTasks.Add(task);
        await _context.SaveChangesAsync();
        return Ok(new {message = "Подзадача добавлена"});
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> PatchSubTask(int id, [FromBody] SubTask NewStatus)
    {
        var task = await _context.SubTasks.FindAsync(id);
        if (task == null) return NotFound(new {message = "Задачи с таким id нету"});
        task.isDone = NewStatus.isDone;
        await _context.SaveChangesAsync();
        return Ok(new {message = "Статус задачи изменен"});
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSubTask(int id)
    {
        var task = await _context.SubTasks.FindAsync(id);
        if(task == null) return NotFound();
        _context.SubTasks.Remove(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}