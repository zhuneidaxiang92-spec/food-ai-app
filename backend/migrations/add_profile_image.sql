-- =============================================
-- Profile Image カラム確認・追加 SQLスクリプト (MySQL版)
-- =============================================

-- 1. カラムの存在を確認
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'profile_image';

-- 2. カラムが存在しない場合は追加（上のクエリで結果がない場合のみ実行）
ALTER TABLE users ADD COLUMN profile_image VARCHAR(500);

-- 3. 既存のprofile_imageカラムのデータ型を確認・修正（念のため）
-- ※ カラムが存在するが、長さが不足している場合
-- ※ MySQL用の構文: MODIFY COLUMN
ALTER TABLE users MODIFY COLUMN profile_image VARCHAR(500);

-- 4. 確認：すべてのユーザーのprofile_image状態を確認
SELECT id, name, email, profile_image, created_at
FROM users
ORDER BY id;

-- 5. テスト：profile_imageを更新してみる（user_id=1の例）
-- UPDATE users SET profile_image = '/uploads/profiles/test.jpg' WHERE id = 1;

-- 6. アップロードディレクトリの確認用（Python側で実行）
-- import os
-- from pathlib import Path
-- UPLOAD_DIR = Path("backend/uploads/profiles")
-- UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
-- print(f"Upload directory created: {UPLOAD_DIR.absolute()}")
