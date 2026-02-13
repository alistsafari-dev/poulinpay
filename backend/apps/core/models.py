from django.db import models

class TimeStampedModel(models.Model):
    """
    مدل پایه برای اضافه کردن created_at و updated_at به همه مدل‌ها
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # این مدل جدول جدا نمی‌سازد، فقط وراثت داده می‌شود
