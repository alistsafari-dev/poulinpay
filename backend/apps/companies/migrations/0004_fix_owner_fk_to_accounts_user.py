from django.db import migrations


def _rebuild_company_fk(apps, schema_editor, target_user_table):
    if schema_editor.connection.vendor != "sqlite":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute("PRAGMA foreign_keys=OFF;")
        cursor.execute(
            f"""
            CREATE TABLE companies_company_new (
                id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                created_at datetime NOT NULL,
                updated_at datetime NOT NULL,
                name varchar(255) NOT NULL,
                owner_id integer NOT NULL REFERENCES "{target_user_table}" ("id") DEFERRABLE INITIALLY DEFERRED
            );
            """
        )
        cursor.execute(
            """
            INSERT INTO companies_company_new (id, created_at, updated_at, name, owner_id)
            SELECT id, created_at, updated_at, name, owner_id
            FROM companies_company;
            """
        )
        cursor.execute("DROP TABLE companies_company;")
        cursor.execute("ALTER TABLE companies_company_new RENAME TO companies_company;")
        cursor.execute(
            "CREATE INDEX companies_company_owner_id_89314e2a ON companies_company (owner_id);"
        )
        cursor.execute("PRAGMA foreign_keys=ON;")


def forwards(apps, schema_editor):
    _rebuild_company_fk(apps, schema_editor, "accounts_user")


def backwards(apps, schema_editor):
    _rebuild_company_fk(apps, schema_editor, "auth_user")


class Migration(migrations.Migration):
    dependencies = [
        ("companies", "0003_alter_company_owner"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
