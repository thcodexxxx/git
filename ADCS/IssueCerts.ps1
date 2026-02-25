param (
    [string]$CsvPath = ".\Certificates.csv",
    [string]$CAConfig = "WIN-P3B1TK8EI3E.dss.mod.go.jp\dss-intermediate-ca",
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
    
    $infSubject = ""
    $sanExtension = ""
    
    if ($certType -eq "Computer") {
        $templateName = "コンピュータ証明書（サブジェクト入力）"
        # コンピュータ証明書: サブジェクトは空で、SANにDNS名を設定する
        $sanExtension = "2.5.29.17 = `"{text}dns=$subject`""
    }
    elseif ($certType -eq "User") {
        $templateName = "ユーザ証明書（サブジェクト入力）"
        $machineKeySet = "false"
        $storeScope = "CurrentUser"
        # ユーザ証明書: サブジェクトはCNとドメイン要素。SANはUPN
        # 簡単なプレースホルダーとしてCNのみを設定し、残りはADから取得させるか、
        # 指定された入力 (例: administrator@dss.mod.go.jp) から生成します。
        
        $upn = ""
        $cn = ""
        if ($subject -match "@") {
            $upn = $subject
            $cn = ($subject -split "@")[0]
        }
        else {
            $cn = $subject
            $upn = "$subject@dss.mod.go.jp"
        }
        
        # DCの組み立てはハードコードするか環境の引数にするかですが、一旦例に合わせます
        $infSubject = "CN=$cn,CN=Users,DC=dss,DC=mod,DC=go,DC=jp"
        $sanExtension = "2.5.29.17 = `"{text}upn=$upn`""
    }
    elseif ($certType -eq "WebServer") {
        $templateName = "サーバ証明書"
        # Webサーバ: 組織名などを付与
        $infSubject = "CN=$subject,O=Minitary of Defence,L=Shinjuku-ku,S=Tokyo,C=JP"
        if (-not [string]::IsNullOrWhiteSpace($san)) {
            $sanExtension = "2.5.29.17 = `"{text}$san`""
        }
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
KeyLength = 3072
KeyAlgorithm = RSA
ProviderName = `"Microsoft Software Key Storage Provider`"
MachineKeySet = $machineKeySet
Exportable = true
RequestType = PKCS10
"@

    # サブジェクト名が存在する場合のみ追加（Computer証明書のように空の場合は追加しない）
    if (-not [string]::IsNullOrWhiteSpace($infSubject)) {
        $infContent = $infContent -replace "\[NewRequest\]", "[NewRequest]`nSubject = `"$infSubject`""
    }

    # SAN Extensionがあれば追加
    if ($sanExtension) {
        $infContent += "`n[Extensions]`n$sanExtension`n"
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
        $certObj.Import($cerPath)
        $thumbprint = $certObj.Thumbprint

        Write-Host "[$baseName] PFXファイルとしてエクスポート中（パスワードなし）..."
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
