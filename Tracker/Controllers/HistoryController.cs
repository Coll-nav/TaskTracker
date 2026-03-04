using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Data;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class HistoryController:  ControllerBase
{
    private readonly AppDbContext _context;
    
    public HistoryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHistoryies()
    {
        var history = _context.TaskStatusHistories
            .OrderByDescending(h => h.CreatedAt)
            .Select(s => new TaskStatusHistoryDto
            {
                Id = s.Id,
                OldStatus = s.OldStatus.ToString(),
                NewStatus = s.NewStatus.ToString(),
                CreatedAt = s.CreatedAt
            }).ToList();
        return Ok(history);
    }
    
    /*[HttpGet("{id}")]
    public async Task<IActionResult> GetIdHistoryies(int id)
    {
        var history = _context.TaskStatusHistories
            .Where(t => t.Id == id)
            .Select(h => new
            {
                h.Id,
                h.OldStatus,
                h.NewStatus,
                h.CreatedAt
            }).FirstOrDefaultAsync();
        if(history == null) return NotFound(new {message = "Task status history not found"});
        return Ok(history);
    }*/
}