// Controllers/TasksController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Models;
using Tracker.Data;


namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks()
    {
        var tasks = await _context.Tasks.ToListAsync();
        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult> AddTask(TaskItem task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTaskById(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();
        return Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}