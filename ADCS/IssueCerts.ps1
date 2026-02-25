param (
    [string]$CsvPath = ".\Certificates.csv",
    [string]$CAConfig = "CAServer.domain.local\IntermediateCA",
    [string]$OutputDir = ".\Output"
)

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }

$csvData = Import-Csv $CsvPath

foreach ($row in $csvData) {
    $certType = $row.CertType
    $subject = $row.SubjectName
    $san = $row.SAN
    
    $baseName = ($subject -replace "(?i)^CN=", "") -replace ",.*", ""
    
    $infPath = Join-Path $OutputDir "$baseName.inf"
    $reqPath = Join-Path $OutputDir "$baseName.req"
    $cerPath = Join-Path $OutputDir "$baseName.cer"
    $pfxPath = Join-Path $OutputDir "$baseName.pfx"

    $machineKeySet = "true"
    $templateName = ""
    $storeScope = "LocalMachine"
    
    if ($certType -eq "Computer") {
        $templateName = "コンピュータ証明書（サブジェクト入力）"
    } elseif ($certType -eq "User") {
        $templateName = "ユーザ証明書（サブジェクト入力）"
        $machineKeySet = "false"
        $storeScope = "CurrentUser"
    } elseif ($certType -eq "WebServer") {
        $templateName = "サーバ証明書"
    } else {
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
RequestType = Cert
"@
    Set-Content -Path $infPath -Value $infContent

    Write-Host "[$baseName] CSR生成中..."
    certreq.exe -new -q $infPath $reqPath

    Write-Host "[$baseName] 証明書を要求中 ($certType)..."
    
    # 属性の付与
    $attrib = "CertificateTemplate:$templateName"
    if ($certType -eq "WebServer" -and -not [string]::IsNullOrWhiteSpace($san)) {
        $attrib += "\nSAN:$san"
    }

    certreq.exe -submit -q -config $CAConfig -attrib $attrib $reqPath $cerPath

    if (Test-Path $cerPath) {
        Write-Host "[$baseName] 証明書をローカルストアにインストール中..."
        certreq.exe -accept -q $cerPath

        $certObj = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
        $certObj.Import($cerPath)
        $thumbprint = $certObj.Thumbprint

        Write-Host "[$baseName] PFXファイルとしてエクスポート中（パスワードなし）..."
        $securePwd = ConvertTo-SecureString -String "" -Force -AsPlainText
        Export-PfxCertificate -Cert "Cert:\$storeScope\My\$thumbprint" -FilePath $pfxPath -Password $securePwd | Out-Null

        Write-Host "[$baseName] 作業用の証明書をローカルストアから削除中..."
        Remove-Item -Path "Cert:\$storeScope\My\$thumbprint" -Force

        Write-Host "[$baseName] 完了しました。出力先: $pfxPath" -ForegroundColor Green
    } else {
        Write-Host "[$baseName] 証明書の発行に失敗しました。CAの設定などを確認してください。" -ForegroundColor Red
    }
}
