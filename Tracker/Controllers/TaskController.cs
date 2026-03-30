// Controllers/TasksController.cs

using Microsoft.AspNetCore.Components.Web;
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
                Tags = t.Tags.Select(s => s.Name).ToList(),
                CreatedAt = t.CreatedAt,
                isDonedAt = t.isDonedAt,
                Deadline = t.Deadline
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
        task.CreatedAt = DateTime.Now;
        
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
    }

    [HttpGet("{id}")] //поиск задачи по id
    public async Task<IActionResult> GetTaskById(int id)
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
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")] // удаление задачи по id
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound(new {message = "Задачи с такими id нету"});
        
        var files = _context.TaskFiles.Where(f => f.TaskId == id);
        foreach (var file in files)
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(),"Uploads", file.StoredFileName);
            if(System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
        }
        _context.TaskFiles.RemoveRange(files);
        
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }
    
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();
    
        task.isDonedAt = DateTime.Now;
        await _context.SaveChangesAsync();
    
        return Ok(new {completedAt = task.isDonedAt });
    }

    [HttpPost("{id}/incomplete")]
    public async Task<IActionResult> IncompleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();
        
        await _context.SaveChangesAsync();
    
        return Ok();
    }

    [HttpPost("{id}/files")]
    public async Task<IActionResult> UploadFile(int id, IFormFile file)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        if (file == null || file.Length == 0) return BadRequest("Файл не выбран");

        var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads"); //куда его сохранять
        if (!Directory.Exists(uploadFolder))
        {
            Directory.CreateDirectory(uploadFolder); // если вдруг нету папки, то создаем ее 
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}"; // генерация уникалоьного имени
        var FilePath = Path.Combine(uploadFolder, uniqueFileName); //путь к файлу ( куда его сохранять )

        using (var stream = new FileStream(FilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var taskFile = new TaskFile
        {
            TaskId = id,
            FileName = file.FileName,
            FileSize = file.Length,
            StoredFileName = uniqueFileName,
            ContentType = file.ContentType,
        };
        _context.TaskFiles.Add(taskFile);
        await _context.SaveChangesAsync();
        //return Ok(new {id = taskFile.id, fileName = taskFile.FileName});
        return Ok(taskFile);
    }

    [HttpGet("{id}/files")]
    public async Task<IActionResult> GetFiles(int id)
    {
        var files = await _context.TaskFiles
            .Where(t => t.TaskId == id)
            .Select(f => new {f.Id, f.FileName, f.FileSize})
            .ToListAsync();
        return Ok(files);
    }
    
    //контроллер для скачивания (юзать для фронта)
    [HttpGet("files/{fileId}")]
    public async Task<IActionResult> DownloadFile(int fileId)
    {
        var file = await _context.TaskFiles.FindAsync(fileId);
        if (file == null) return NotFound();
        var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        var FilePath = Path.Combine(uploadFolder, file.StoredFileName);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(FilePath);
        
        return File(fileBytes, "application/pdf", file.FileName);
    }

    [HttpDelete("files/{fileId}")]
    public async Task<IActionResult> DeleteFile(int fileId)
    {
        var file = await _context.TaskFiles.FindAsync(fileId);
        if (file == null) return NotFound();
        
        var filePath = Path.Combine("Uploads", file.StoredFileName);

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath); //FilePath - ?
        }
        _context.TaskFiles.Remove(file);
        await _context.SaveChangesAsync();
        return Ok();
    }
}