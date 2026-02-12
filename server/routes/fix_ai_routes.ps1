$p = 'c:\Users\USER\Saved Games\audnix-ai-project\server\routes\ai-routes.ts'
Copy-Item $p "$p.bak"
$c = Get-Content $p
$n = $c[0..1131] + $c[1399..($c.Count-1)]
$n | Set-Content $p -Encoding ASCII
Write-Host "Done"
