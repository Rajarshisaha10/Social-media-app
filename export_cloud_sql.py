import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    port=3306,
    user='root',
    password='raju@123',
    database='social_media',
    charset='utf8mb4'
)

tables = [
    'Users', 'User_Credentials', 'Profile_Pic', 'Regular_User', 'Admin_User',
    'Post', 'Comment', 'Reaction', 'Community_Group', 'Group_Members',
    'Hashtag', 'Post_Hashtag', 'Notification', 'Friend_Recommendation',
    'Message', 'Event_Analysis', 'User_Follow'
]

with open('klouds_full_deploy.sql', 'w', encoding='utf-8') as out:
    out.write('-- =======================================================\n')
    out.write('-- Full Database Deployment for klouds.online (dbms-da-db)\n')
    out.write('-- =======================================================\n')
    out.write('SET NAMES utf8mb4;\n')
    out.write('SET FOREIGN_KEY_CHECKS = 0;\n\n')

    # Read and adapt schema DDL for `dbms-da-db`
    with open('schema_mysql.sql', 'r', encoding='utf-8') as sf:
        ddl = sf.read()
        # Ensure it works directly inside `dbms-da-db` without trying to CREATE social_media
        ddl = ddl.replace('CREATE DATABASE IF NOT EXISTS social_media CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', '')
        ddl = ddl.replace('USE social_media;', '')
        out.write(ddl)

    out.write('\n\n-- =======================================================\n')
    out.write('-- 2. Seed & Initial Data Across All 17 Tables\n')
    out.write('-- =======================================================\n')

    with conn.cursor() as cur:
        for t in tables:
            cur.execute(f'SELECT * FROM `{t}`')
            rows = cur.fetchall()
            if not rows:
                continue
            cols = [desc[0] for desc in cur.description]
            cols_str = ', '.join([f'`{c}`' for c in cols])
            out.write(f'\n-- Table: `{t}` ({len(rows)} rows)\n')
            for r in rows:
                vals = []
                for v in r:
                    if v is None:
                        vals.append('NULL')
                    elif isinstance(v, (int, float)):
                        vals.append(str(v))
                    else:
                        escaped = str(v).replace('\\', '\\\\').replace("'", "\\'")
                        vals.append(f"'{escaped}'")
                vals_joined = ', '.join(vals)
                out.write(f'INSERT INTO `{t}` ({cols_str}) VALUES ({vals_joined});\n')

    out.write('\nSET FOREIGN_KEY_CHECKS = 1;\n')

print('Generated klouds_full_deploy.sql successfully!')
conn.close()



