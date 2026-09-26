"""
Adds "bold" as a recognized title_source value: a poem's own name marked in bold inside the
opening text, instead of written again as a separate line. No column or data changes — this
only updates the field's recognized choices (and their labels in the admin).
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("corpus", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="poem",
            name="title_source",
            field=models.CharField(
                choices=[
                    ("name_line", "Own name (line before the abyat)"),
                    ("bold", "Own name (marked in bold, inside the opening text)"),
                    ("first_sadr", "First sadr (no own name)"),
                ],
                default="first_sadr",
                max_length=10,
            ),
        ),
    ]
