from django.db import models
from django.conf import settings
from core.models import TimeStampedModel

class Company(TimeStampedModel):
    
    
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_companies",
   
    )

    def __str__(self):
        return self.name