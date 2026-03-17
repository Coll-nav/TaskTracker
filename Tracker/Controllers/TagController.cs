using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Data;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/tags")]

public class TagController : ControllerBase
{
    private readonly AppDbContext _context;

    public TagController(AppDbContext context)
    {
        _context = context;
    }
    
    [HttpGet] 
    public async Task<IActionResult> GetAllTags()
    {
        var tags = await _context.Tags.ToListAsync();
        return Ok(tags);
    }
    
    [HttpPost] //Создание самого тега в системе
    public async Task<IActionResult> CreateTag([FromBody] Tag newTag)
    {
        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == newTag.Name);
        if(tag != null) return Conflict();
        _context.Tags.Add(newTag);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("tasks/{taskId}/tags/{tagId}")] // привязка к самой задаче
    public async Task<IActionResult> AddTag(int taskId, int tagId)
    {
        var task = await _context.Tasks
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.Id == taskId);
        var tag = await _context.Tags.FindAsync(tagId);
        task.Tags.Add(tag);
        await _context.SaveChangesAsync();
        return Ok(new {message = "Тег привязан к задаче"});
    }
    [HttpDelete("{tagId}")]
    public async Task<IActionResult> DeleteTag(int tagId)
    {
        var tag = await _context.Tags.FindAsync(tagId);
        if(tag == null) return NotFound();
        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("tasks/{taskId}/tags/{tagId}")]
    public async Task<IActionResult> RemoveTag(int taskId, int tagId)
    {
        var task = await _context.Tasks
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.Id == taskId);
        var tag = await _context.Tags.FindAsync(tagId);
        if(task == null || tag == null) return NotFound();
        task.Tags.Remove(tag);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

