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
    private static List<TaskItem> tasks = new()
    {
        new TaskItem { Id = 1, Title = "Задача 1", isTrue = true},
        new TaskItem { Id = 2, Title = "Задача 2", isTrue = false},
        new TaskItem { Id = 3, Title = "Задача 3", isTrue = true},
    };

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(tasks);
    }

    [HttpDelete("id")]
    
    public IActionResult Delete(int id)
    {
        foreach (var task in tasks)
        {
            if (task.Id == id) 
            {
                tasks.Remove(task);
                return CreatedAtAction(nameof(GetAll), task);
            }
        }
        return NotFound();
    }

    [HttpPost]
    public IActionResult Add(TaskItem task)
    {
        tasks.Add(task);
        return CreatedAtAction(nameof(GetAll), task);
    }

    [HttpGet("id")]
    public IActionResult Check(int id)
    {
        foreach (var task in tasks )
        {
            if (task.Id == id)
            {
                return Ok(task);
            }
        }
        return NotFound();
    }
}