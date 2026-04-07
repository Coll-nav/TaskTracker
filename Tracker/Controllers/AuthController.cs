using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Tracker.Data;

namespace TaskTracker.Api.Controllers;

[ApiController] //включает автоматическую валидацию моделей
[Route("api/[controller]")]

public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;  //JwT key
    
    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] LoginRequest request)
    {
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (existingUser != null)
        {
            return BadRequest(new { message = "Такой пользователь уже есть" });
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "user",
            
        };
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            return Unauthorized(new {message = "Неверный пароль или логин"});
        }

        
        var token = GenerateJwtToken(user);
        
        //сохрание в браузере cookie
        Response.Cookies.Append("jwt", token, new CookieOptions   
        {
            HttpOnly = true,  //cookie не доступа на js (защита от XSS атак)
            Secure = false,  //отправлени только по HTTPS

            SameSite = SameSiteMode.Lax, //защита от CSRF (межсайтовой подделки)
            Expires = DateTime.Now.AddDays(7), //время жизни 7 дней
            Path = "/" //работа на всем сайте 
        });
        
        return Ok(new
        {
            token = token,
            role = user.Role,
            username = user.Username,
            userId = user.Id
        });
    }
    
    private string GenerateJwtToken(User user)
    {
        var claims = new[]   //хранилище для токена (данные которые в нем хранятся)
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username), 
            new Claim(ClaimTypes.Role, user.Role) 
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256); //создает подпись

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(7),
            signingCredentials: creds  //подпись токена, о том что его нельзя подделать 
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }

    //при выходе пользователя удаляет cookie
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwt");
        return Ok();
    }

    [Authorize(Roles = "admin")]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new {u.Id, u.Username, u.Email, u.Role})
            .ToListAsync();
        return Ok(users);
    }

    [Authorize(Roles = "admin")]
    [HttpGet("users/{userId}/tasks")]
    public async Task<IActionResult> GetUserTasks(int userId)
    {
        var tasks = await  _context.Tasks
            .Where(t => t.UserId == userId)
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

    [Authorize(Roles = "admin")]
    [HttpPost("users/{userId}/tasks")]
    public async Task<IActionResult> addTaskUser(int userId, [FromBody] CreatedTask request)
    {
        var user = await _context.Users.FindAsync(userId);
        if(user == null) return NotFound();

        var task = new TaskItem
        {
            Title = request.Title,
            CreatedAt = DateTime.UtcNow,
            Deadline = request.Deadline,
            UserId = userId,
        };
        
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpDelete("id")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    public class CreatedTask
    {
        public string Title { get; set; }
        public DateTime Deadline { get; set; }
    }
}
