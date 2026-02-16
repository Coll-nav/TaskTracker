using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Data;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class CommentController : ControllerBase
{
    private readonly AppDbContext _context;

    public CommentController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("{taskId}")]
    public async Task<IActionResult> AddComment(int taskId,  Comment comment)
    {
        var parentTask = await _context.Tasks.FindAsync(taskId);
        if (parentTask == null) return NotFound();
        comment.TaskId =  taskId;
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
        return Ok(new {message = "Комментарий успешно создан"});
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var comment = await _context.Comments.FindAsync(id);
        if (comment == null) return NotFound();
        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
        return NoContent();
    }
    
}