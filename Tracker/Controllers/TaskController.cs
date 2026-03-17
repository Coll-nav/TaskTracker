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
    public async Task<IActionResult> GetTasks(
        [FromQuery] Status? status,
        [FromQuery] int? id,
        [FromQuery] string? word,
        [FromQuery] string? sort,
        [FromQuery] string? order,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 7
    )
    {
        var query = _context.Tasks.AsQueryable();

        if (status.HasValue) query = query.Where(t => t.Status == status.Value); //фильтр по статусу
        if (id.HasValue) query = query.Where(t => t.Id == id.Value); // фильтр по id
        //фильтрация по части слова
        if (!string.IsNullOrEmpty(word))  query = query.Where(t => t.Title.Contains(word) || t.Description.Contains(word));
        
        //сортировка
        switch (sort?.ToLower())
        {
            case "title":
                query = order == "asc" ? query.OrderBy(t => t.Title) : query.OrderByDescending(t => t.Title);
                break;
            case "date":
                query = order == "asc" ? query.OrderBy(t => t.CreatedAt) : query.OrderByDescending(t => t.CreatedAt);
                break;
        }
        
        var tasks = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TaskListItemDto {
                Id = t.Id,
                Title = t.Title,
                Status = t.Status.ToString(),
                SubTaskCount = t.SubTasks.Count,
                SubTaskCountDone = t.SubTasks.Count(s => s.isDone),
                CommentsCount = t.Comments.Count,
                Tags = t.Tags.Select(s => s.Name).ToList()
            })
            .ToListAsync();
        return Ok(tasks);
    }

    [HttpPost] //добавление задачи 
    public async Task<IActionResult> AddTask([FromBody] TaskItem task)
    {
        task.SubTasks = new List<SubTask>();
        task.Tags = new List<Tag>();
        task.Comments = new List<Comment>();
        task.TaskStatusHistories = new List<TaskStatusHistory>();
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, new { message = "Задача добавлена" });
    }

    [HttpGet("{id}")] //поиск задачи по id
    public async Task<IActionResult> GetTaskById(int id) //пока оставить Include, но рассмотреть вариант с Select
    {
        //
        
        //проверить это на работоспособность 
        
        //
        var tasks = await _context.Tasks
            .Where(t => t.Id == id)
            .Select(t => new TaskDetailsDto {
                Id = t.Id,
                Title = t.Title,
                Status = t.Status.ToString(),
                SubTasks = t.SubTasks.Select(s => new SubTaskDto
                {
                    Id = s.SubTaskId,
                    Name = s.SubTaskTitle,
                    isDone = s.isDone
                }).ToList(),
                Comments = t.Comments.Select(s => new CommentDto
                {
                    Id = s.CommentId,
                    Text = s.CommentText,
                    CreatedAt = s.CreatedAt
                }).ToList(),
                Tags = t.Tags.Select(s => s.Name).ToList(),
                history = t.TaskStatusHistories.Select(s => new TaskStatusHistoryDto
                {
                    Id = s.Id,
                    OldStatus = s.OldStatus.ToString(),
                    NewStatus = s.NewStatus.ToString(),
                    CreatedAt = s.CreatedAt
                }).ToList()
            }).ToListAsync();
        if (tasks == null) return NotFound(new {message = "Задачи с такими id нету"});
        return Ok(tasks);
    }
    
    //
    
    // это тоже проверить 
    
    //
    
    [HttpPatch("{id}/status")] //подумать над ним!!!!!
    public async Task<IActionResult> StatusTask(int id, [FromBody] Status newStatus)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound(new { message = "Задача не найдена" });

        var history = new TaskStatusHistory
        {
            TaskId = id,
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
    
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();
    
        task.CreatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
    
        return Ok(new { completedAt = task.CreatedAt });
    }

    [HttpPost("{id}/incomplete")]
    public async Task<IActionResult> IncompleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();
        
        await _context.SaveChangesAsync();
    
        return Ok();
    }
}