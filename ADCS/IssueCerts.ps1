param (
    [string]$CsvPath = ".\Certificates.csv",
    [string]$CAConfig = "hostname.local\ca",
    [string]$OutputDir = ".\Output"
)

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }
$OutputDirAbs = (Resolve-Path $OutputDir).ProviderPath

$csvData = Import-Csv $CsvPath -Encoding Default

foreach ($row in $csvData) {
    $certType = $row.CertType
    $subject = $row.SubjectName
    $san = $row.SAN
    
    $baseName = ($subject -replace "(?i)^CN=", "") -replace ",.*", ""
    
    $infPath = Join-Path $OutputDirAbs "$baseName.inf"
    $reqPath = Join-Path $OutputDirAbs "$baseName.req"
    $cerPath = Join-Path $OutputDirAbs "$baseName.cer"
    $pfxPath = Join-Path $OutputDirAbs "$baseName.pfx"

    $machineKeySet = "true"
    $templateName = ""
    $storeScope = "LocalMachine"
    
    if ($certType -eq "Computer") {
        $templateName = "コンピュータ証明書（サブジェクト入力）"
    }
    elseif ($certType -eq "User") {
        $templateName = "ユーザ証明書（サブジェクト入力）"
        $machineKeySet = "false"
        $storeScope = "CurrentUser"
    }
    elseif ($certType -eq "WebServer") {
        $templateName = "サーバ証明書"
    }
    else {
        Write-Host "[$baseName] 不明な証明書タイプです: $certType" -ForegroundColor Yellow
        continue
    }

    # INFファイルの作成
    $infContent = @"
[Version]
Signature=`"`$Windows NT$`"

[NewRequest]
Subject = `"$subject,O=MMM,OU=III,L=SSS-ku,S=TTT,C=JP`"
KeyLength = 3072
KeyAlgorithm = RSA
ProviderName = `"Microsoft Software Key Storage Provider`"
MachineKeySet = $machineKeySet
Exportable = true
RequestType = PKCS10
"@

    # WebServerでSANがある場合、INFの [Extensions] セクションにSANを埋め込む
    # dns=name1&dns=name2 のような形式を想定
    if ($certType -eq "WebServer" -and -not [string]::IsNullOrWhiteSpace($san)) {
        # 'dns=' で始まっている形式をパースしてカンマ区切りの文字列に直すか、
        # WindowsのINF形式で直接指定する形式 (2.5.29.17) にする
        # 例: SANが "dns=web01&dns=www" の場合、2.5.29.17 = "{text}dns=web01&dns=www" と指定可能
        $infContent += "`n[Extensions]`n2.5.29.17 = `"{text}$san`"`n"
    }

    # Set-Content without -Encoding in PowerShell 5.1 writes ANSI. certreq.exe expects ANSI or UTF-8.
    Set-Content -Path $infPath -Value $infContent

    Write-Host "[$baseName] CSR生成中..."
    certreq.exe -new -q $infPath $reqPath

    Write-Host "[$baseName] 証明書を要求中 ($certType)..."
    
    # 属性の付与。テンプレート名のみ指定するよう修正
    $attrib = "CertificateTemplate:$templateName"

    # 引数として渡す際に、コマンドプロンプトのパースエラーを避けるため引数を配列展開で渡すか、Invoke-Expressionを避ける
    $certreqArgs = @("-submit", "-q", "-config", $CAConfig, "-attrib", $attrib, $reqPath, $cerPath)
    & certreq.exe @certreqArgs

    if (Test-Path $cerPath) {
        Write-Host "[$baseName] 証明書をローカルストアにインストール中..."
        certreq.exe -accept -q $cerPath

        $certObj = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
        try {
            # .NETの仕様上、フルパスで指定しないとカレントディレクトリに依存して見つからないエラーになるため絶対パスを渡す
            $certObj.Import($cerPath)
            $thumbprint = $certObj.Thumbprint
        }
        catch {
            Write-Host "[$baseName] 証明書の情報を読み込めませんでした（拇印取得失敗）: $_" -ForegroundColor Red
            continue
        }

        if ([string]::IsNullOrWhiteSpace($thumbprint)) {
            Write-Host "[$baseName] 拇印が空のためPFX化と削除処理をスキップします。" -ForegroundColor Red
            continue
        }

        Write-Host "[$baseName] PFXファイルとしてエクスポート中..."
        try {
            # certutil を使ってパスワードなし("")でPfxをエクスポート
            $storeName = if ($storeScope -eq "CurrentUser") { "-user" } else { "" }
            $certutilArgs = @("certutil.exe", "-exportPFX", "-p", '""', $storeName, "My", $thumbprint, $pfxPath)
            
            # "-user" が空の要素にならないようにフィルタリング
            $certutilArgs = $certutilArgs | Where-Object { $_ -ne "" }
            
            $exportResult = & $certutilArgs[0] $certutilArgs[1..($certutilArgs.Length - 1)] 2>&1
        }
        catch {
            Write-Host "[$baseName] PFXエクスポートエラー: $_" -ForegroundColor Yellow
        }

        Write-Host "[$baseName] 作業用の証明書をローカルストアから削除中..."
        try {
            $storeName = if ($storeScope -eq "CurrentUser") { "-user" } else { "" }
            $delArgs = @("certutil.exe", "-delstore", $storeName, "My", $thumbprint)
            $delArgs = $delArgs | Where-Object { $_ -ne "" }
            
            & $delArgs[0] $delArgs[1..($delArgs.Length - 1)] | Out-Null
        }
        catch {
            Write-Host "[$baseName] 作業証明書の削除に失敗しました: $_" -ForegroundColor Yellow
        }

        Write-Host "[$baseName] 完了しました。出力先: $pfxPath" -ForegroundColor Green
    }
    else {
        Write-Host "[$baseName] 証明書の発行に失敗しました。CAの設定などを確認してください。" -ForegroundColor Red
    }
}
