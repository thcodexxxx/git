# 証明書一括発行ツール

このツールは、Active Directory 証明書サービス (AD CS) のエンタープライズCAから、各種証明書（コンピュータ証明書、ユーザ証明書、Webサーバ証明書）をCSVファイルに基づき一括作成・発行・PFXエクスポートするためのスクリプトです。

## 概要

`Certificates.csv` に必要な情報を記載し、`IssueCerts.ps1` を実行することで、自動的に以下を行います。
1. INFファイルの動的生成
2. `certreq -new` による秘密鍵（RSA 3072bit）とCSRの生成
3. `certreq -submit` によるCAへの証明書発行要求
4. `certreq -accept` による証明書のローカルストアへのインストール
5. `Export-PfxCertificate` によるPFXファイルとしてのエクスポート（**パスワードなし**）
6. 作業用にローカルストアへインストールした証明書のクリーンアップ処理

発行されたPFXファイルは `.\Output` フォルダ内に保存されます。

## 必須要件

- 実行する端末がドメインに参加していること。
- 実行ユーザが、各証明書テンプレートの「登録 (Enroll)」権限を持っていること。
- 指定されたCAサーバおよび中間CAにネットワーク接続可能であること。
- Webサーバ証明書のSAN属性を使用する場合、エンタープライズCAにて要求属性（`EDITF_ATTRIBUTESUBJECTALTNAME2`）の受容が許可されていること。

## ファイル構成

- `Certificates.csv` : 発行対象のリストを定義するCSVファイル。
- `IssueCerts.ps1` : 実際に一括発行処理を行うメインスクリプト。

## 使用方法

### 1. CA情報の修正

`IssueCerts.ps1` 内の `$CAConfig` 変数を、実際のCAサーバ情報に合わせて変更します。

```powershell
# 例: CAサーバのFQDN \ CAの論理名
[string]$CAConfig = "CAServer.domain.local\IntermediateCA"
```

### 2. CSVファイルの記述

`Certificates.csv` に発行したい証明書情報を記述します。

**列名と説明:**
- `CertType`: 発行する証明書の種別（`Computer`, `User`, `WebServer` のいずれか）。
- `SubjectName`: サブジェクト名（共通名 `CN=` として記述）。
- `SAN`: Webサーバ証明書の場合のみ使用。Subject Alternative Nameを指定します。複数ある場合は `&` で繋ぎます。
  - 例: `dns=Web01.domain.local&dns=www.domain.local`

スクリプト内で、全ての証明書の要求（CSR生成）時に、組織情報（O, OU, L, S, C）が自動付与されます（例: `,O=MMM,OU=III,L=SSS-ku,S=TTT,C=JP`）。

**CSVの記述例:**
```csv
CertType,SubjectName,SAN
Computer,CN=MemberServer01.domain.local,
User,CN=User01,
WebServer,CN=Web01.domain.local,dns=Web01.domain.local&dns=www.domain.local
```

### 3. スクリプトの実行

PowerShell コンソールを開き、スクリプトを実行します。

```powershell
.\IssueCerts.ps1
```

### 4. 結果の確認

実行が完了すると、自動的にスクリプト配置場所と同じ階層に `Output` フォルダが作成され、その中に以下のファイルが出力されます。

- `*.inf` （CSR生成用の設定ファイル）
- `*.req` （生成されたCSRファイル）
- `*.cer` （CAから発行された公開鍵証明書）
- `*.pfx` （秘密鍵を含む証明書、移行やインポート用）

※ PFXファイルはパスワードなし（空のパスワード）でエクスポートされています。

## 注意事項

- PFXファイルには秘密鍵情報が含まれます。Output フォルダやファイルの取り扱い・保管には十分注意してください。

### トラブルシューティング

**Q: スクリプト実行時に文字化けや構文エラー（`UnexpectedToken` など）が発生する**
- **原因:** PowerShell 5.1環境等で実行した場合、BOM無しのUTF-8で保存されたスクリプト内の日本語が誤って Shift-JIS として解釈され、構文エラーを引き起こしている可能性があります。
- **対処法:** `IssueCerts.ps1` および `Certificates.csv` を、テキストエディタ（VSCode等）やメモ帳で開き、**「UTF-8（BOM付き）」または「ANSI (Shift-JIS)」** で保存し直してから再度実行してください。
