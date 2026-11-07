param([string]$LectureId = '', [int]$Limit = 0)
# Run with Windows PowerShell 5.1: WinRT OCR is unavailable in PowerShell 7.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Await-WinRT($operation, $resultType) {
    $task = $asTask.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $task.GetAwaiter().GetResult()
}
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
if (!$engine) { throw 'Install the Windows English OCR language component first.' }
$root = Split-Path $PSScriptRoot
$manifest = Get-Content (Join-Path $root 'video-frame-notes.json') -Raw | ConvertFrom-Json
$outFolder = Join-Path $root 'content\frame-transcriptions\drafts'
New-Item -ItemType Directory -Force -Path $outFolder | Out-Null
foreach ($lecture in $manifest.PSObject.Properties) {
    if ($LectureId -and $LectureId -ne $lecture.Name) { continue }
    $target = Join-Path $outFolder ($lecture.Name + '.json')
    if ((Test-Path $target) -and !$LectureId) { continue }
    $rows = @()
    foreach ($frame in $lecture.Value.frames) {
        if ($Limit -gt 0 -and $rows.Count -ge $Limit) { break }
        $file = Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Join-Path $root $frame.src))) ([Windows.Storage.StorageFile])
        $stream = Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        try {
            $decoder = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
            $transform = New-Object Windows.Graphics.Imaging.BitmapTransform
            $transform.ScaledWidth = $decoder.PixelWidth * 4
            $transform.ScaledHeight = $decoder.PixelHeight * 4
            $bitmap = Await-WinRT ($decoder.GetSoftwareBitmapAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied, $transform, [Windows.Graphics.Imaging.ExifOrientationMode]::IgnoreExifOrientation, [Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage)) ([Windows.Graphics.Imaging.SoftwareBitmap])
            try {
                $result = Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
                $rows += [ordered]@{src=$frame.src; seconds=$frame.seconds; text=($result.Lines.Text -join "`n"); reviewed=$false}
            } finally { $bitmap.Dispose() }
        } finally { $stream.Dispose() }
    }
    [ordered]@{lectureId=$lecture.Name; status='unreviewed-ocr'; source='Windows OCR of low-resolution YouTube preview frames'; frames=$rows} | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $target
    Write-Output ($lecture.Name + ': ' + $rows.Count + ' draft frames; not published')
}
